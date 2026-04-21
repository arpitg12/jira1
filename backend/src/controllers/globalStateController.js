import GlobalState from '../models/GlobalState.js';

export const createGlobalState = async (req, res) => {
  try {
    const { name, color, description } = req.body;

    const state = new GlobalState({
      name,
      color: color || '#3b82f6',
      description,
    });

    await state.save();
    res.status(201).json({ message: 'Global state created successfully', state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGlobalStates = async (req, res) => {
  try {
    const states = await GlobalState.find({ isActive: true });
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
    const state = await GlobalState.findByIdAndUpdate(
      req.params.id,
      { name, color, description, isActive },
      { new: true, runValidators: true }
    );
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json({ message: 'Global state updated successfully', state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGlobalState = async (req, res) => {
  try {
    const state = await GlobalState.findByIdAndDelete(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json({ message: 'Global state deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
