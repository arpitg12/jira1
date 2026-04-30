import fs from 'fs/promises';
import path from 'path';
import Counter from '../models/Counter.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { buildProjectAccessFilter, hasProjectAccess, isAdmin, isIssueVisibleToUser } from '../middleware/auth.js';
import { notify, notifyMentionedUsers } from '../utils/notificationEngine.js';

const issuePopulate = [
  { path: 'assignees', select: 'username email role' },
  { path: 'reviewAssignees', select: 'username email role' },
  { path: 'reporter', select: 'username email role' },
  { path: 'watchers', select: 'username email role' },
  { path: 'attachments.uploadedBy', select: 'username email role' },
  { path: 'comments.author', select: 'username email role' },
  { path: 'comments.editHistory.editedBy', select: 'username email role' },
  { path: 'comments.replies.author', select: 'username email role' },
  { path: 'comments.replies.editHistory.editedBy', select: 'username email role' },
  {
    path: 'project',
    populate: [
      {
        path: 'workflow',
        populate: [
          { path: 'states', select: 'name color description isActive' },
          { path: 'defaultState', select: 'name color description isActive' },
        ],
      },
      { path: 'visibleToUsers', select: 'username email role' },
      { path: 'managers', select: 'username email role' },
      { path: 'members', select: 'username email role' },
      { path: 'watchers', select: 'username email role' },
    ],
  },
];

const workflowProjectPopulate = {
  path: 'workflow',
  populate: [
    { path: 'states', select: 'name color description isActive' },
    { path: 'defaultState', select: 'name color description isActive' },
  ],
};

const ISSUE_COUNTER_KEY = 'issue-sequence';

const uploadsRoot = path.resolve(env.uploadsDir, 'issues');

const sanitizeIssuePayload = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const toId = (value) => String(value?._id || value || '');
const uniqueUserIds = (values = []) => [...new Set(values.map((value) => toId(value)).filter(Boolean))];
const getActorName = (user) => user?.username || user?.email || 'A teammate';

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [value];
};

const buildIssueWatchers = (...valueGroups) => uniqueUserIds(valueGroups.flat());

const getAllowedWorkflowStatuses = (project) =>
  (project?.workflow?.states || [])
    .filter((state) => state?.isActive !== false && state?.name)
    .map((state) => state.name);

const getInitialWorkflowStatus = (project) =>
  (project?.workflow?.defaultState?.isActive !== false && project?.workflow?.defaultState?.name) ||
  getAllowedWorkflowStatuses(project)[0] ||
  'To Do';

const validateWorkflowStatus = (status, allowedStatuses) =>
  !status || allowedStatuses.length === 0 || allowedStatuses.includes(status);

const getProjectWithWorkflow = (projectId) =>
  Project.findById(projectId).populate([
    workflowProjectPopulate,
    { path: 'visibleToUsers', select: 'username email role active' },
  ]);

const getNextIssueSequence = async () => {
  const existingCounter = await Counter.findOneAndUpdate(
    { key: ISSUE_COUNTER_KEY },
    { $inc: { value: 1 } },
    { new: true }
  );

  if (existingCounter) {
    return existingCounter.value;
  }

  const currentIssueCount = await Issue.countDocuments();

  try {
    const createdCounter = await Counter.create({
      key: ISSUE_COUNTER_KEY,
      value: currentIssueCount + 1,
    });

    return createdCounter.value;
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const retriedCounter = await Counter.findOneAndUpdate(
      { key: ISSUE_COUNTER_KEY },
      { $inc: { value: 1 } },
      { new: true }
    );

    return retriedCounter.value;
  }
};

const getNextIssueIdentifier = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const nextSequence = await getNextIssueSequence();
    const nextIssueId = `issue-${nextSequence}`;
    const existingIssue = await Issue.exists({ issueId: nextIssueId });

    if (!existingIssue) {
      return nextIssueId;
    }
  }

  throw new Error('Failed to generate a unique issue ID');
};

const findCommentById = (comments, commentId) => {
  for (const comment of comments) {
    if (String(comment._id) === String(commentId)) {
      return { comment };
    }
  }

  return null;
};

const findReplyById = (comments, replyId) => {
  for (const comment of comments) {
    const reply = comment.replies.id(replyId);
    if (reply) {
      return { reply, parentComment: comment };
    }
  }

  return null;
};

const isCommentOwnerOrAdmin = (user, author) =>
  isAdmin(user) || String(author?._id || author) === String(user?._id);

const normalizeIssuePeople = (payload = {}) => ({
  assignees: uniqueUserIds(toArray(payload.assignees).concat(toArray(payload.assignee))),
  reviewAssignees: uniqueUserIds(toArray(payload.reviewAssignees).concat(toArray(payload.reviewAssignee))),
});

const mentionPattern = /(^|\s)@([a-zA-Z0-9._-]+)/g;

const extractMentionUsernames = (text = '') => {
  const usernames = new Set();
  let match = mentionPattern.exec(text);

  while (match) {
    usernames.add(match[2].toLowerCase());
    match = mentionPattern.exec(text);
  }

  mentionPattern.lastIndex = 0;
  return [...usernames];
};

const resolveMentionedUserIds = async (text, actorId) => {
  const usernames = extractMentionUsernames(text);

  if (usernames.length === 0) {
    return [];
  }

  const users = await User.find({
    username: { $in: usernames.map((name) => new RegExp(`^${name}$`, 'i')) },
    active: true,
  }).select('_id');

  return uniqueUserIds(users.map((user) => user._id)).filter((id) => id !== String(actorId || ''));
};

const notifyMentionsFromText = async (issue, text, actor) => {
  const mentionedUserIds = await resolveMentionedUserIds(text, actor?._id);

  if (mentionedUserIds.length === 0) {
    return;
  }

  await notifyMentionedUsers(issue._id, mentionedUserIds, {
    actorId: actor?._id,
    actorName: getActorName(actor),
    actionText: `mentioned you on ${issue?.title || 'this ticket'}`,
    text,
  });
};

const getAttachmentExtension = (filename = '', mimeType = '') => {
  const explicit = path.extname(filename);
  if (explicit) return explicit.toLowerCase();

  const mimeMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/json': '.json',
    'text/log': '.log',
  };

  return mimeMap[mimeType] || '';
};

const sanitizeFilename = (name = 'attachment') =>
  name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'attachment';

const saveAttachmentFile = async ({ issueId, name, mimeType, content }) => {
  const normalizedContent = String(content || '');
  const base64Content = normalizedContent.includes(',')
    ? normalizedContent.split(',').pop()
    : normalizedContent;
  const buffer = Buffer.from(base64Content, 'base64');
  const extension = getAttachmentExtension(name, mimeType);
  const timestamp = Date.now();
  const fileBase = sanitizeFilename(path.basename(name, path.extname(name)));
  const fileName = `${issueId}-${timestamp}-${fileBase}${extension}`;
  const issueDir = path.join(uploadsRoot, issueId);

  await fs.mkdir(issueDir, { recursive: true });
  await fs.writeFile(path.join(issueDir, fileName), buffer);

  return {
    size: buffer.byteLength,
    url: `/uploads/issues/${issueId}/${fileName}`,
  };
};

const deleteAttachmentFile = async (attachmentUrl = '') => {
  const relativePath = attachmentUrl.replace(/^\/+/, '');
  const absolutePath = path.resolve(env.uploadsDir, relativePath.replace(/^uploads[\\/]/, ''));

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
};

export const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      issueType,
      priority,
      status,
      project,
      customFields,
    } = req.body;

    if (!title || !project) {
      return res.status(400).json({ error: 'Title and project are required' });
    }

    const selectedProject = await getProjectWithWorkflow(project);
    if (!selectedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!hasProjectAccess(req.user, selectedProject)) {
      return res.status(403).json({ error: 'You do not have access to this project' });
    }

    const allowedStatuses = getAllowedWorkflowStatuses(selectedProject);
    const resolvedStatus = status || getInitialWorkflowStatus(selectedProject);

    if (!validateWorkflowStatus(resolvedStatus, allowedStatuses)) {
      return res.status(400).json({ error: 'Status is not valid for the project workflow' });
    }

    const issuePeople = normalizeIssuePeople(req.body);
    const issueId = await getNextIssueIdentifier();

    const issue = new Issue({
      issueId,
      title,
      description,
      issueType: issueType || 'Task',
      priority: priority || 'Medium',
      status: resolvedStatus,
      ...issuePeople,
      reporter: req.user._id,
      watchers: buildIssueWatchers(
        req.user._id,
        issuePeople.assignees,
        issuePeople.reviewAssignees
      ),
      project,
      customFields: customFields || {},
    });

    await issue.save();
    await issue.populate(issuePopulate);
    await notify('TASK_CREATED', issue._id, {
      actorId: req.user._id,
      actorName: getActorName(req.user),
    });
    res.status(201).json({ message: 'Issue created successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssues = async (req, res) => {
  try {
    const { status, priority, assignee, project } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignees = assignee;
    if (project) filter.project = project;

    if (!isAdmin(req.user)) {
      const accessibleProjects = await Project.find(buildProjectAccessFilter(req.user)).select('_id');
      const accessibleProjectIds = accessibleProjects.map((entry) => entry._id);

      if (accessibleProjectIds.length === 0) {
        return res.json([]);
      }

      filter.project = project
        ? { $in: accessibleProjectIds.filter((entry) => String(entry) === String(project)) }
        : { $in: accessibleProjectIds };
    }

    const issues = await Issue.find(filter).populate(issuePopulate);
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate(issuePopulate);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      issueType,
      priority,
      status,
      customFields,
    } = req.body;

    const existingIssue = await Issue.findById(req.params.id).populate({
      path: 'project',
      populate: workflowProjectPopulate,
    });

    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (!isIssueVisibleToUser(req.user, existingIssue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const allowedStatuses = getAllowedWorkflowStatuses(existingIssue.project);
    if (!validateWorkflowStatus(status, allowedStatuses)) {
      return res.status(400).json({ error: 'Status is not valid for the project workflow' });
    }

    const previousAssigneeIds = uniqueUserIds(existingIssue.assignees || []);
    const previousStatus = existingIssue.status;

    const updates = sanitizeIssuePayload({
      title,
      description,
      issueType,
      priority,
      status,
      customFields,
      ...normalizeIssuePeople(req.body),
    });

    Object.assign(existingIssue, updates);
    existingIssue.watchers = buildIssueWatchers(
      existingIssue.watchers || [],
      existingIssue.assignees || [],
      existingIssue.reviewAssignees || [],
      existingIssue.reporter
    );
    await existingIssue.save();
    await existingIssue.populate(issuePopulate);

    const nextAssigneeIds = uniqueUserIds(existingIssue.assignees || []);
    const assigneeChanged =
      previousAssigneeIds.length !== nextAssigneeIds.length ||
      previousAssigneeIds.some((id) => !nextAssigneeIds.includes(id));

    if ((req.body.assignee !== undefined || req.body.assignees !== undefined) && assigneeChanged) {
      await notify('TASK_ASSIGNED', existingIssue._id, {
        actorId: req.user._id,
        actorName: getActorName(req.user),
      });
    }

    await notify('TASK_UPDATED', existingIssue._id, {
      actorId: req.user._id,
      actorName: getActorName(req.user),
      previousStatus,
    });
    res.json({ message: 'Issue updated successfully', issue: existingIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteIssue = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can delete issues' });
    }

    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    issue.comments.push({
      text: text.trim(),
      author: req.user._id,
      editHistory: [],
      replies: [],
    });
    issue.watchers = buildIssueWatchers(
      issue.watchers || [],
      req.user._id,
      issue.assignees || [],
      issue.reviewAssignees || [],
      issue.reporter
    );

    await issue.save();
    await issue.populate(issuePopulate);
    await notify('TASK_COMMENTED', issue._id, {
      actorId: req.user._id,
      actorName: getActorName(req.user),
    });
    await notifyMentionsFromText(issue, text.trim(), req.user);

    res.json({ message: 'Comment added successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const result = findCommentById(issue.comments, req.params.commentId);
    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!isCommentOwnerOrAdmin(req.user, result.comment.author)) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    result.comment.editHistory.push({
      text: result.comment.text,
      editedAt: new Date(),
      editedBy: req.user._id,
    });
    result.comment.text = text.trim();

    await issue.save();
    await issue.populate(issuePopulate);
    await notifyMentionsFromText(issue, text.trim(), req.user);

    res.json({ message: 'Comment updated successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!isCommentOwnerOrAdmin(req.user, comment.author)) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    comment.deleteOne();
    await issue.save();
    await issue.populate(issuePopulate);

    res.json({ message: 'Comment deleted successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addReply = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const result = findCommentById(issue.comments, req.params.commentId);
    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    result.comment.replies.push({
      text: text.trim(),
      author: req.user._id,
      editHistory: [],
    });
    issue.watchers = buildIssueWatchers(
      issue.watchers || [],
      req.user._id,
      issue.assignees || [],
      issue.reviewAssignees || [],
      issue.reporter
    );

    await issue.save();
    await issue.populate(issuePopulate);
    await notify('TASK_COMMENTED', issue._id, {
      actorId: req.user._id,
      actorName: getActorName(req.user),
    });
    await notifyMentionsFromText(issue, text.trim(), req.user);

    res.json({ message: 'Reply added successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReply = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const result = findReplyById(issue.comments, req.params.replyId);
    if (!result || String(result.parentComment._id) !== String(req.params.commentId)) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (!isCommentOwnerOrAdmin(req.user, result.reply.author)) {
      return res.status(403).json({ error: 'You can only edit your own replies' });
    }

    result.reply.editHistory.push({
      text: result.reply.text,
      editedAt: new Date(),
      editedBy: req.user._id,
    });
    result.reply.text = text.trim();

    await issue.save();
    await issue.populate(issuePopulate);
    await notifyMentionsFromText(issue, text.trim(), req.user);

    res.json({ message: 'Reply updated successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const result = findReplyById(issue.comments, req.params.replyId);
    if (!result || String(result.parentComment._id) !== String(req.params.commentId)) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (!isCommentOwnerOrAdmin(req.user, result.reply.author)) {
      return res.status(403).json({ error: 'You can only delete your own replies' });
    }

    result.reply.deleteOne();
    await issue.save();
    await issue.populate(issuePopulate);

    res.json({ message: 'Reply deleted successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAttachment = async (req, res) => {
  try {
    const { name, mimeType, content } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Attachment name and content are required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const savedFile = await saveAttachmentFile({
      issueId: String(issue._id),
      name,
      mimeType,
      content,
    });

    issue.attachments.push({
      name,
      url: savedFile.url,
      mimeType: mimeType || '',
      size: savedFile.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    });

    await issue.save();
    await issue.populate(issuePopulate);

    res.json({ message: 'Attachment uploaded successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await issue.populate(issuePopulate);
    if (!isIssueVisibleToUser(req.user, issue)) {
      return res.status(403).json({ error: 'You do not have access to this issue' });
    }

    const attachment = issue.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const canDelete =
      isAdmin(req.user) || String(attachment.uploadedBy?._id || attachment.uploadedBy || '') === String(req.user._id);

    if (!canDelete) {
      return res.status(403).json({ error: 'You can only delete your own attachments' });
    }

    await deleteAttachmentFile(attachment.url);
    attachment.deleteOne();
    await issue.save();
    await issue.populate(issuePopulate);

    res.json({ message: 'Attachment deleted successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
