import GlobalState from '../models/GlobalState.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import Workflow from '../models/Workflow.js';

const workflowPopulate = [
  { path: 'states', select: 'name color description isActive' },
  { path: 'defaultState', select: 'name color description isActive' },
];

const getWorkflowFallbackStatus = (workflow) =>
  (workflow?.defaultState?.isActive !== false && workflow?.defaultState?.name) ||
  (workflow?.states || []).find((state) => state?.isActive !== false && state?.name)?.name ||
  'To Do';

const syncIssuesForWorkflowState = async (workflow, previousStateName) => {
  if (!workflow?._id || !previousStateName) {
    return;
  }

  const projects = await Project.find({ workflow: workflow._id }).select('_id');
  if (projects.length === 0) {
    return;
  }

  await Issue.updateMany(
    {
      project: { $in: projects.map((project) => project._id) },
      status: previousStateName,
    },
    { $set: { status: getWorkflowFallbackStatus(workflow) } }
  );
};

export const createGlobalState = async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const trimmedName = String(name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ error: 'State name is required' });
    }

    const state = new GlobalState({
      name: trimmedName,
      color: color || '#3b82f6',
      description,
    });

    await state.save();
    res.status(201).json({ message: 'Global state created successfully', state });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'State name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getGlobalStates = async (req, res) => {
  try {
    const states = await GlobalState.find({ isActive: true }).sort({ createdAt: 1 });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGlobalStateById = async (req, res) => {
  try {
    const state = await GlobalState.findById(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGlobalState = async (req, res) => {
  try {
    const { name, color, description, isActive } = req.body;
    const state = await GlobalState.findById(req.params.id);

    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    const previousName = state.name;

    if (name !== undefined) {
      const trimmedName = String(name || '').trim();

      if (!trimmedName) {
        return res.status(400).json({ error: 'State name is required' });
      }

      state.name = trimmedName;
    }

    if (color !== undefined) {
      state.color = color;
    }

    if (description !== undefined) {
      state.description = description;
    }

    if (isActive !== undefined) {
      state.isActive = Boolean(isActive);
    }

    await state.save();

    if (previousName !== state.name) {
      await Issue.updateMany({ status: previousName }, { $set: { status: state.name } });
    }

    res.json({ message: 'Global state updated successfully', state });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'State name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteGlobalState = async (req, res) => {
  try {
    const state = await GlobalState.findById(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    const affectedWorkflows = await Workflow.find({ states: state._id });

    for (const workflow of affectedWorkflows) {
      workflow.states = (workflow.states || []).filter(
        (workflowStateId) => String(workflowStateId) !== String(state._id)
      );

      if (String(workflow.defaultState || '') === String(state._id)) {
        workflow.defaultState = workflow.states[0] || null;
      }

      await workflow.save();
    }

    if (affectedWorkflows.length > 0) {
      const refreshedWorkflows = await Workflow.find({
        _id: { $in: affectedWorkflows.map((workflow) => workflow._id) },
      }).populate(workflowPopulate);

      for (const workflow of refreshedWorkflows) {
        await syncIssuesForWorkflowState(workflow, state.name);
      }
    }

    await state.deleteOne();

    res.json({ message: 'Global state deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
