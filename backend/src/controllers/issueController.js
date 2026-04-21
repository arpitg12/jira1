import Issue from '../models/Issue.js';

export const createIssue = async (req, res) => {
  try {
    const { title, description, issueType, priority, assignee, reviewAssignee, project, customFields } = req.body;

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
      status: 'To Do',
      assignee,
      reviewAssignee,
      project,
      customFields: customFields || {},
    });

    await issue.save();
    await issue.populate([
      { path: 'assignee', select: 'username email' },
      { path: 'reviewAssignee', select: 'username email' },
      { path: 'project', populate: { path: 'workflow' } }
    ]);
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
      .populate('assignee', 'username email')
      .populate('reviewAssignee', 'username email')
      .populate({ path: 'project', populate: { path: 'workflow' } });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('assignee', 'username email')
      .populate('reviewAssignee', 'username email')
      .populate({ path: 'project', populate: { path: 'workflow' } });

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
    const { title, description, issueType, priority, status, assignee, reviewAssignee, customFields } = req.body;

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        issueType,
        priority,
        status,
        assignee,
        reviewAssignee,
        customFields,
      },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'username email')
      .populate('reviewAssignee', 'username email')
      .populate({ path: 'project', populate: { path: 'workflow' } });

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
    const { text } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text, timestamp: new Date() } } },
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
