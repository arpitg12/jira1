import Issue from '../models/Issue.js';

const issuePopulate = [
  { path: 'assignee', select: 'username email role' },
  { path: 'reviewAssignee', select: 'username email role' },
  { path: 'reporter', select: 'username email role' },
  { path: 'comments.author', select: 'username email role' },
  { path: 'project', populate: { path: 'workflow' } },
];

const sanitizeIssuePayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

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

    // Generate unique issue ID
    const issueId = `ISSUE-${Date.now()}`;

    const issue = new Issue({
      issueId,
      title,
      description,
      issueType: issueType || 'Task',
      priority: priority || 'Medium',
      status: status || 'To Do',
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

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate(issuePopulate);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json({ message: 'Issue updated successfully', issue });
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

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: text.trim(),
            author: author || null,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate(issuePopulate);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json({ message: 'Comment added successfully', issue });
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
