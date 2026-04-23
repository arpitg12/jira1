import Project from '../models/Project.js';
import User from '../models/User.js';
import Workflow from '../models/Workflow.js';
import {
  buildProjectAccessFilter,
  hasProjectAccess,
  isAdmin,
} from '../middleware/auth.js';

const workflowPopulate = {
  path: 'workflow',
  populate: [
    { path: 'states', select: 'name color description isActive' },
    { path: 'defaultState', select: 'name color description isActive' },
  ],
};

const projectPopulate = [
  workflowPopulate,
  { path: 'visibleToUsers', select: 'username email role active' },
];

const toArray = (value) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const validateVisibleUsers = async (userIds = []) => {
  const uniqueIds = [...new Set(toArray(userIds).filter(Boolean))];

  if (uniqueIds.length === 0) {
    return [];
  }

  const users = await User.find({
    _id: { $in: uniqueIds },
    active: true,
  }).select('_id');

  if (users.length !== uniqueIds.length) {
    throw new Error('One or more selected users are invalid');
  }

  return uniqueIds;
};

export const createProject = async (req, res) => {
  try {
    const { name, description, workflow, visibleToUsers } = req.body;

    if (!name || !workflow) {
      return res.status(400).json({ error: 'Project name and workflow are required' });
    }

    const selectedWorkflow = await Workflow.findById(workflow);
    if (!selectedWorkflow) {
      return res.status(400).json({ error: 'A valid workflow is required' });
    }

    const validatedVisibleUsers = await validateVisibleUsers(visibleToUsers);

    const project = new Project({
      name: name.trim(),
      description: description || '',
      workflow,
      visibleToUsers: validatedVisibleUsers,
    });

    await project.save();
    await project.populate(projectPopulate);
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    if (error.message === 'One or more selected users are invalid') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const filter = {
      active: true,
      ...buildProjectAccessFilter(req.user),
    };
    const projects = await Project.find(filter).populate(projectPopulate);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(projectPopulate);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!hasProjectAccess(req.user, project)) {
      return res.status(403).json({ error: 'You do not have access to this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description, workflow, active, visibleToUsers } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (workflow !== undefined) {
      const selectedWorkflow = await Workflow.findById(workflow);
      if (!selectedWorkflow) {
        return res.status(400).json({ error: 'A valid workflow is required' });
      }
      updates.workflow = workflow;
    }

    if (active !== undefined) {
      updates.active = Boolean(active);
    }

    if (visibleToUsers !== undefined) {
      updates.visibleToUsers = await validateVisibleUsers(visibleToUsers);
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate(projectPopulate);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    if (error.message === 'One or more selected users are invalid') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
