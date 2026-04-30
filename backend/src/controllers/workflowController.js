import GlobalState from '../models/GlobalState.js';
import Workflow from '../models/Workflow.js';

const populateWorkflow = (query) =>
  query.populate('states').populate('defaultState');

const normalizeStateIds = (states = []) =>
  [...new Set((Array.isArray(states) ? states : []).filter(Boolean))];

const resolveDefaultStateId = (stateIds = [], defaultState) => {
  if (!defaultState) {
    return stateIds[0] || null;
  }

  return stateIds.includes(defaultState) ? defaultState : stateIds[0] || null;
};

const validateStateIds = async (states = [], defaultState = null) => {
  const stateIds = normalizeStateIds(states);

  if (stateIds.length === 0) {
    return {
      stateIds: [],
      defaultStateId: null,
    };
  }

  const validStates = await GlobalState.find({
    _id: { $in: stateIds },
    isActive: true,
  }).select('_id');

  if (validStates.length !== stateIds.length) {
    throw new Error('One or more workflow states are invalid');
  }

  return {
    stateIds,
    defaultStateId: resolveDefaultStateId(stateIds, defaultState),
  };
};

export const createWorkflow = async (req, res) => {
  try {
    const { name, description, states, defaultState } = req.body;
    const trimmedName = String(name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    const { stateIds, defaultStateId } = await validateStateIds(states, defaultState);

    const workflow = new Workflow({
      name: trimmedName,
      description,
      states: stateIds,
      defaultState: defaultStateId,
    });

    await workflow.save();
    await populateWorkflow(workflow);
    res.status(201).json({ message: 'Workflow created successfully', workflow });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Workflow name already exists' });
    }
    if (error.message === 'One or more workflow states are invalid') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getWorkflows = async (req, res) => {
  try {
    const workflows = await populateWorkflow(Workflow.find({}));
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkflowById = async (req, res) => {
  try {
    const workflow = await populateWorkflow(Workflow.findById(req.params.id));
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const { name, description, states, defaultState, active } = req.body;
    const updates = {};

    if (name !== undefined) {
      const trimmedName = String(name || '').trim();

      if (!trimmedName) {
        return res.status(400).json({ error: 'Workflow name is required' });
      }

      updates.name = trimmedName;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (active !== undefined) {
      updates.active = Boolean(active);
    }

    if (states !== undefined || defaultState !== undefined) {
      const currentWorkflow = await Workflow.findById(req.params.id).select('states defaultState');

      if (!currentWorkflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const { stateIds, defaultStateId } = await validateStateIds(
        states !== undefined ? states : currentWorkflow.states.map((stateId) => String(stateId)),
        defaultState !== undefined ? defaultState : String(currentWorkflow.defaultState || '')
      );

      updates.states = stateIds;
      updates.defaultState = defaultStateId;
    }

    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await populateWorkflow(workflow);
    res.json({ message: 'Workflow updated successfully', workflow });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Workflow name already exists' });
    }
    if (error.message === 'One or more workflow states are invalid') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addStateToWorkflow = async (req, res) => {
  try {
    const { stateId } = req.body;
    const state = await GlobalState.findOne({ _id: stateId, isActive: true }).select('_id');

    if (!state) {
      return res.status(400).json({ error: 'State not found or inactive' });
    }

    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.states.some((id) => String(id) === String(stateId))) {
      return res.status(400).json({ error: 'State already added to workflow' });
    }

    workflow.states.push(stateId);
    if (!workflow.defaultState) {
      workflow.defaultState = stateId;
    }
    await workflow.save();
    await populateWorkflow(workflow);
    res.json({ message: 'State added successfully', workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeStateFromWorkflow = async (req, res) => {
  try {
    const { stateId } = req.body;
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.states = workflow.states.filter((id) => String(id) !== String(stateId));
    if (String(workflow.defaultState || '') === String(stateId)) {
      workflow.defaultState = workflow.states[0] || null;
    }
    await workflow.save();
    await populateWorkflow(workflow);
    res.json({ message: 'State removed successfully', workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
