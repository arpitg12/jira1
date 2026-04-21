import Issue from '../models/Issue.js';
import Project from '../models/Project.js';

const issuePopulate = [
  { path: 'assignee', select: 'username email role' },
  { path: 'reviewAssignee', select: 'username email role' },
  { path: 'reporter', select: 'username email role' },
  { path: 'comments.author', select: 'username email role' },
  { path: 'comments.replies.author', select: 'username email role' },
  {
    path: 'project',
    populate: {
      path: 'workflow',
      populate: [
        { path: 'states', select: 'name color description isActive' },
        { path: 'defaultState', select: 'name color description isActive' },
      ],
    },
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
  Project.findById(projectId).populate(workflowProjectPopulate);

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
      reporter: reporter || null,
      project,
      customFields: customFields || {},
    });

    await issue.save();
    await issue.populate(issuePopulate);
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

    const allowedStatuses = getAllowedWorkflowStatuses(existingIssue.project);
    if (!validateWorkflowStatus(status, allowedStatuses)) {
      return res.status(400).json({
        error: 'Status is not valid for the project workflow',
      });
    }

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
    await existingIssue.save();
    await existingIssue.populate(issuePopulate);
    res.json({ message: 'Issue updated successfully', issue: existingIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteIssue = async (req, res) => {
  try {
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
    const { text, author } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    issue.comments.push({
      text: text.trim(),
      author: author || null,
      replies: [],
    });
    await issue.save();
    await issue.populate(issuePopulate);
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

    const result = findCommentById(issue.comments, req.params.commentId);
    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
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

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
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
    const { text, author } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const result = findCommentById(issue.comments, req.params.commentId);
    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    result.comment.replies.push({
      text: text.trim(),
      author: author || null,
    });
    await issue.save();
    await issue.populate(issuePopulate);

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

    const result = findReplyById(issue.comments, req.params.replyId);
    if (!result || String(result.parentComment._id) !== String(req.params.commentId)) {
      return res.status(404).json({ error: 'Reply not found' });
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

    const result = findReplyById(issue.comments, req.params.replyId);
    if (!result || String(result.parentComment._id) !== String(req.params.commentId)) {
      return res.status(404).json({ error: 'Reply not found' });
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
