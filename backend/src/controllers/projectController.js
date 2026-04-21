import Project from '../models/Project.js';

export const createProject = async (req, res) => {
  try {
    const { name, description, workflow } = req.body;

    if (!name || !workflow) {
      return res.status(400).json({ error: 'Project name and workflow are required' });
    }

    const project = new Project({
      name,
      description: description || '',
      workflow,
    });

    await project.save();
    await project.populate('workflow');
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ active: true }).populate('workflow');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('workflow');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description, workflow, active } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        workflow: workflow !== undefined ? workflow : undefined,
        active: active !== undefined ? active : undefined,
      },
      { new: true, runValidators: true }
    ).populate('workflow');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Project name already exists' });
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
