import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import { buildProjectAccessFilter, hasProjectAccess, isAdmin, isIssueVisibleToUser } from '../middleware/auth.js';
import { notify } from '../utils/notificationEngine.js';

const issuePopulate = [
  { path: 'assignee', select: 'username email role' },
  { path: 'reviewAssignee', select: 'username email role' },
  { path: 'reporter', select: 'username email role' },
  { path: 'watchers', select: 'username email role' },
  { path: 'comments.author', select: 'username email role' },
  { path: 'comments.replies.author', select: 'username email role' },
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

const sanitizeIssuePayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

const workflowProjectPopulate = {
  path: 'workflow',
  populate: [
    { path: 'states', select: 'name color description isActive' },
    { path: 'defaultState', select: 'name color description isActive' },
  ],
};

const getAllowedWorkflowStatuses = (project) =>
  (project?.workflow?.states || [])
    .filter((state) => state?.isActive !== false && state?.name)
    .map((state) => state.name);

const getInitialWorkflowStatus = (project) =>
  project?.workflow?.defaultState?.name ||
  getAllowedWorkflowStatuses(project)[0] ||
  'To Do';

const validateWorkflowStatus = (status, allowedStatuses) =>
  !status || allowedStatuses.length === 0 || allowedStatuses.includes(status);

const getProjectWithWorkflow = (projectId) =>
  Project.findById(projectId).populate([
    workflowProjectPopulate,
    { path: 'visibleToUsers', select: 'username email role active' },
  ]);

const findCommentById = (comments, commentId) => {
  for (const comment of comments) {
    if (String(comment._id) === String(commentId)) {
      return { comment, parentArray: comments };
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

const uniqueUserIds = (values = []) =>
  [...new Set(values.map((value) => String(value?._id || value || '')).filter(Boolean))];

const buildIssueWatchers = (...valueGroups) => uniqueUserIds(valueGroups.flat());

export const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      issueType,
      priority,
      status,
      assignee,
      reviewAssignee,
      reporter,
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
      return res.status(400).json({
        error: 'Status is not valid for the project workflow',
      });
    }

    // Generate unique issue ID
    const issueId = `ISSUE-${Date.now()}`;

    const issue = new Issue({
      issueId,
      title,
      description,
      issueType: issueType || 'Task',
      priority: priority || 'Medium',
      status: resolvedStatus,
      assignee: assignee || null,
      reviewAssignee: reviewAssignee || null,
      reporter: isAdmin(req.user) ? reporter || null : req.user._id,
      watchers: buildIssueWatchers(
        isAdmin(req.user) ? reporter || null : req.user._id,
        assignee || null,
        reviewAssignee || null
      ),
      project,
      customFields: customFields || {},
    });

    await issue.save();
    await issue.populate(issuePopulate);
    await notify('TASK_CREATED', issue._id);
    res.status(201).json({ message: 'Issue created successfully', issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssues = async (req, res) => {
  try {
    const { status, priority, assignee, project } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
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

    const issues = await Issue.find(filter)
      .populate(issuePopulate);

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate(issuePopulate);

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
      assignee,
      reviewAssignee,
      reporter,
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
      return res.status(400).json({
        error: 'Status is not valid for the project workflow',
      });
    }

    const previousAssigneeId = String(existingIssue.assignee?._id || existingIssue.assignee || '');

    const updates = sanitizeIssuePayload({
      title,
      description,
      issueType,
      priority,
      status,
      assignee,
      reviewAssignee,
      reporter,
      customFields,
    });

    Object.assign(existingIssue, updates);
    existingIssue.watchers = buildIssueWatchers(
      existingIssue.watchers || [],
      existingIssue.assignee,
      existingIssue.reviewAssignee,
      existingIssue.reporter
    );
    await existingIssue.save();
    await existingIssue.populate(issuePopulate);
    const nextAssigneeId = String(existingIssue.assignee?._id || existingIssue.assignee || '');

    if (assignee !== undefined && previousAssigneeId !== nextAssigneeId) {
      await notify('TASK_ASSIGNED', existingIssue._id);
    }
    await notify('TASK_UPDATED', existingIssue._id);
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
      replies: [],
    });
    issue.watchers = buildIssueWatchers(issue.watchers || [], req.user._id, issue.assignee, issue.reviewAssignee, issue.reporter);
    await issue.save();
    await issue.populate(issuePopulate);
    await notify('TASK_COMMENTED', issue._id);
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

    result.comment.text = text.trim();
    await issue.save();
    await issue.populate(issuePopulate);

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
    });
    issue.watchers = buildIssueWatchers(issue.watchers || [], req.user._id, issue.assignee, issue.reviewAssignee, issue.reporter);
    await issue.save();
    await issue.populate(issuePopulate);
    await notify('TASK_COMMENTED', issue._id);

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

    result.reply.text = text.trim();
    await issue.save();
    await issue.populate(issuePopulate);

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
    const { url, name } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { $push: { attachments: { url, name, uploadedAt: new Date() } } },
      { new: true }
    );
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
