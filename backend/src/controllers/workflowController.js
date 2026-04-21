import Workflow from "../models/Workflow.js";

export const createWorkflow = async (req, res) => {
  try {
    const { name, description, states } = req.body;

    const workflow = new Workflow({
      name,
      description,
      states: states || [],
    });

    await workflow.save();
    await workflow.populate("states");
    res.status(201).json({ message: "Workflow created successfully", workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({}).populate("states").populate("defaultState");
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id).populate("states").populate("defaultState");
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const { name, description, states, defaultState, active } = req.body;
    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      { name, description, states, defaultState, active },
      { new: true, runValidators: true }
    ).populate("states").populate("defaultState");
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json({ message: "Workflow updated successfully", workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addStateToWorkflow = async (req, res) => {
  try {
    const { stateId } = req.body;
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    if (workflow.states.includes(stateId)) {
      return res.status(400).json({ error: "State already added to workflow" });
    }

    workflow.states.push(stateId);
    await workflow.save();
    await workflow.populate("states");
    res.json({ message: "State added successfully", workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeStateFromWorkflow = async (req, res) => {
  try {
    const { stateId } = req.body;
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    workflow.states = workflow.states.filter(id => id.toString() !== stateId);
    await workflow.save();
    await workflow.populate("states");
    res.json({ message: "State removed successfully", workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};