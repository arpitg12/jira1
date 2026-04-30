import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb, Button, Modal } from '../../components/common';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';
import {
  addStateToWorkflow,
  createGlobalState,
  createWorkflow,
  deleteGlobalState,
  deleteWorkflow,
  getGlobalStates,
  getWorkflows,
  removeStateFromWorkflow,
  updateGlobalState,
  updateWorkflow,
} from '../../services/api';

const emptyWorkflowForm = {
  name: '',
  description: '',
  states: [],
  defaultState: '',
};

const emptyStateForm = {
  name: '',
  color: '#3b82f6',
  description: '',
};

const WorkflowEditor = () => {
  const [workflows, setWorkflows] = useState([]);
  const [globalStates, setGlobalStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [isEditWorkflowModalOpen, setIsEditWorkflowModalOpen] = useState(false);
  const [isAddStateModalOpen, setIsAddStateModalOpen] = useState(false);
  const [isCreateStateModalOpen, setIsCreateStateModalOpen] = useState(false);
  const [isEditStateModalOpen, setIsEditStateModalOpen] = useState(false);

  const [workflowForm, setWorkflowForm] = useState(emptyWorkflowForm);
  const [stateForm, setStateForm] = useState(emptyStateForm);
  const [stateFormForWorkflow, setStateFormForWorkflow] = useState({ stateId: '' });
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workflowData, stateData] = await Promise.all([getWorkflows(), getGlobalStates()]);
      setWorkflows(workflowData || []);
      setGlobalStates(stateData || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStateOptions = useMemo(
    () => globalStates.filter((state) => workflowForm.states.includes(state._id)),
    [globalStates, workflowForm.states]
  );

  const resetWorkflowForm = () => {
    setWorkflowForm(emptyWorkflowForm);
    setSelectedWorkflow(null);
  };

  const resetStateForm = () => {
    setStateForm(emptyStateForm);
    setSelectedState(null);
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!workflowForm.name.trim()) {
      alert('Please enter workflow name');
      return;
    }

    try {
      await createWorkflow({
        name: workflowForm.name,
        description: workflowForm.description,
        states: workflowForm.states,
        defaultState: workflowForm.defaultState || undefined,
      });
      resetWorkflowForm();
      setIsCreateWorkflowModalOpen(false);
      await fetchData();
      alert('Workflow created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create workflow');
    }
  };

  const handleEditWorkflow = async (e) => {
    e.preventDefault();
    if (!selectedWorkflow) return;

    try {
      await updateWorkflow(selectedWorkflow._id, {
        name: workflowForm.name,
        description: workflowForm.description,
        defaultState: workflowForm.defaultState || null,
      });
      resetWorkflowForm();
      setIsEditWorkflowModalOpen(false);
      await fetchData();
      alert('Workflow updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update workflow');
    }
  };

  const openEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description || '',
      states: workflow.states.map((state) => state._id),
      defaultState: workflow.defaultState?._id || workflow.states[0]?._id || '',
    });
    setIsEditWorkflowModalOpen(true);
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await deleteWorkflow(workflowId);
      await fetchData();
      alert('Workflow deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete workflow');
    }
  };

  const handleAddStateToWorkflow = async (e) => {
    e.preventDefault();
    if (!selectedWorkflow || !stateFormForWorkflow.stateId) {
      alert('Please select a state');
      return;
    }

    try {
      await addStateToWorkflow(selectedWorkflow._id, {
        stateId: stateFormForWorkflow.stateId,
      });
      setStateFormForWorkflow({ stateId: '' });
      setIsAddStateModalOpen(false);
      setSelectedWorkflow(null);
      await fetchData();
      alert('State added to workflow successfully!');
    } catch (err) {
      alert(err.message || 'Failed to add state');
    }
  };

  const handleRemoveStateFromWorkflow = async (workflowId, stateId) => {
    if (!window.confirm('Are you sure you want to remove this state?')) return;

    try {
      await removeStateFromWorkflow(workflowId, { stateId });
      await fetchData();
      alert('State removed successfully!');
    } catch (err) {
      alert(err.message || 'Failed to remove state');
    }
  };

  const handleCreateGlobalState = async (e) => {
    e.preventDefault();
    if (!stateForm.name.trim()) {
      alert('Please enter state name');
      return;
    }

    try {
      await createGlobalState({
        name: stateForm.name,
        color: stateForm.color,
        description: stateForm.description,
      });
      resetStateForm();
      setIsCreateStateModalOpen(false);
      await fetchData();
      alert('Global state created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create state');
    }
  };

  const openEditGlobalState = (state) => {
    setSelectedState(state);
    setStateForm({
      name: state.name || '',
      color: state.color || '#3b82f6',
      description: state.description || '',
    });
    setIsEditStateModalOpen(true);
  };

  const handleEditGlobalState = async (e) => {
    e.preventDefault();
    if (!selectedState) return;

    try {
      await updateGlobalState(selectedState._id, {
        name: stateForm.name,
        color: stateForm.color,
        description: stateForm.description,
      });
      resetStateForm();
      setIsEditStateModalOpen(false);
      await fetchData();
      alert('Global state updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update state');
    }
  };

  const handleDeleteGlobalState = async (state) => {
    if (!window.confirm(`Delete "${state.name}" from all workflows? Existing issues using it will be moved automatically.`)) {
      return;
    }

    try {
      await deleteGlobalState(state._id);
      await fetchData();
      alert('Global state deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete state');
    }
  };

  const toggleInitialState = (stateId, checked) => {
    if (checked) {
      const nextStates = [...workflowForm.states, stateId];
      setWorkflowForm((current) => ({
        ...current,
        states: nextStates,
        defaultState: current.defaultState || stateId,
      }));
      return;
    }

    const nextStates = workflowForm.states.filter((id) => id !== stateId);
    setWorkflowForm((current) => ({
      ...current,
      states: nextStates,
      defaultState: current.defaultState === stateId ? nextStates[0] || '' : current.defaultState,
    }));
  };

  return (
    <AdminLayout>
      <div className="-mx-3 -my-3 min-h-[calc(100vh-120px)] ui-dark-page px-3 py-4 md:-mx-5 md:px-6 md:py-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Workflows', href: '/admin/workflows', active: true },
          ]}
        />
        <div className="mb-4 flex items-center justify-between">
          <h1 className="ui-title">Workflow Editor</h1>
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setIsCreateWorkflowModalOpen(true)}
          >
            <IoAdd size={14} /> Create
          </Button>
        </div>

        {error && (
          <div className="mb-3 rounded border border-red-500/30 bg-red-500/20 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-white/65">Loading workflows...</div>
        ) : (
          <div className="space-y-3">
            <Card title="Global States">
              {globalStates.length > 0 ? (
                <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {globalStates.map((state) => (
                    <div
                      key={state._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className="inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: state.color }}
                          >
                            {state.name}
                          </div>
                          <p className="mt-2 text-xs leading-6 text-white/55">
                            {state.description || 'No description added yet.'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditGlobalState(state)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                            title="Edit state"
                            aria-label="Edit state"
                          >
                            <IoPencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGlobalState(state)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-red-300 hover:bg-white/10"
                            title="Delete state"
                            aria-label="Delete state"
                          >
                            <IoTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-white/50">No global states created yet</p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsCreateStateModalOpen(true)}
              >
                <IoAdd size={16} /> Create Global State
              </Button>
            </Card>

            {workflows.length > 0 ? (
              workflows.map((workflow) => (
                <Card key={workflow._id} title={workflow.name}>
                  <p className="mb-2 text-sm text-gray-600">{workflow.description || 'No description'}</p>
                  <p className="mb-4 text-xs text-white/50">
                    Default state:{' '}
                    <span className="font-semibold text-white/75">
                      {workflow.defaultState?.name || workflow.states[0]?.name || 'Not set'}
                    </span>
                  </p>

                  <div className="mb-6">
                    <h3 className="mb-3 font-semibold text-dark">Workflow States</h3>
                    {workflow.states && workflow.states.length > 0 ? (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {workflow.states.map((state, idx) => (
                          <div key={state._id} className="flex items-center gap-2">
                            <div
                              className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: state.color }}
                            >
                              {state.name}
                              {workflow.defaultState?._id === state._id && (
                                <span className="rounded-full border border-white/30 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                                  Default
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveStateFromWorkflow(workflow._id, state._id)}
                                className="hover:opacity-75"
                                aria-label={`Remove ${state.name}`}
                              >
                                <IoTrash size={14} />
                              </button>
                            </div>
                            {idx < workflow.states.length - 1 && <div className="h-0.5 w-6 bg-gray-300" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-4 text-sm text-gray-500">No states in this workflow</p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsAddStateModalOpen(true);
                      }}
                    >
                      <IoAdd size={16} /> Add State
                    </Button>
                  </div>

                  <div className="flex gap-2 border-t border-gray-200/80 pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openEditWorkflow(workflow)}
                    >
                      <IoPencil size={14} /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleDeleteWorkflow(workflow._id)}
                    >
                      <IoTrash size={14} /> Delete
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="py-8 text-center text-gray-500">
                  No workflows found. Create one to get started!
                </div>
              </Card>
            )}
          </div>
        )}

        <Modal
          isOpen={isCreateWorkflowModalOpen}
          onClose={() => {
            setIsCreateWorkflowModalOpen(false);
            resetWorkflowForm();
          }}
          title="Create New Workflow"
        >
          <form onSubmit={handleCreateWorkflow} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Workflow Name</label>
              <input
                type="text"
                placeholder="Enter workflow name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
              <textarea
                placeholder="Enter description (optional)"
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Initial States (Optional)</label>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {globalStates.map((state) => (
                  <label key={state._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workflowForm.states.includes(state._id)}
                      onChange={(e) => toggleInitialState(state._id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span
                      className="rounded px-3 py-1 text-sm font-semibold text-white"
                      style={{ backgroundColor: state.color }}
                    >
                      {state.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Default State</label>
              <select
                value={workflowForm.defaultState}
                onChange={(e) => setWorkflowForm({ ...workflowForm, defaultState: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                disabled={selectedStateOptions.length === 0}
              >
                <option value="">
                  {selectedStateOptions.length === 0 ? '-- Select workflow states first --' : '-- Select default state --'}
                </option>
                {selectedStateOptions.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">Create</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsCreateWorkflowModalOpen(false);
                  resetWorkflowForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isEditWorkflowModalOpen}
          onClose={() => {
            setIsEditWorkflowModalOpen(false);
            resetWorkflowForm();
          }}
          title="Edit Workflow"
        >
          <form onSubmit={handleEditWorkflow} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Workflow Name</label>
              <input
                type="text"
                placeholder="Enter workflow name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
              <textarea
                placeholder="Enter description (optional)"
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Default State</label>
              <select
                value={workflowForm.defaultState}
                onChange={(e) => setWorkflowForm({ ...workflowForm, defaultState: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                disabled={selectedStateOptions.length === 0}
              >
                <option value="">
                  {selectedStateOptions.length === 0 ? '-- Add workflow states first --' : '-- Select default state --'}
                </option>
                {selectedStateOptions.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">Update</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsEditWorkflowModalOpen(false);
                  resetWorkflowForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isAddStateModalOpen}
          onClose={() => {
            setIsAddStateModalOpen(false);
            setStateFormForWorkflow({ stateId: '' });
            setSelectedWorkflow(null);
          }}
          title="Add State to Workflow"
        >
          <form onSubmit={handleAddStateToWorkflow} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Select Global State</label>
              <select
                value={stateFormForWorkflow.stateId}
                onChange={(e) => setStateFormForWorkflow({ stateId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                required
              >
                <option value="">-- Select a state --</option>
                {globalStates
                  .filter((state) => !selectedWorkflow?.states?.some((workflowState) => workflowState._id === state._id))
                  .map((state) => (
                    <option key={state._id} value={state._id}>
                      {state.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">Add State</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsAddStateModalOpen(false);
                  setStateFormForWorkflow({ stateId: '' });
                  setSelectedWorkflow(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isCreateStateModalOpen}
          onClose={() => {
            setIsCreateStateModalOpen(false);
            resetStateForm();
          }}
          title="Create Global State"
        >
          <form onSubmit={handleCreateGlobalState} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">State Name</label>
              <input
                type="text"
                placeholder="Enter state name"
                value={stateForm.name}
                onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Color</label>
              <input
                type="color"
                value={stateForm.color}
                onChange={(e) => setStateForm({ ...stateForm, color: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
              <textarea
                placeholder="What is this state used for?"
                value={stateForm.description}
                onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">Create State</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsCreateStateModalOpen(false);
                  resetStateForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isEditStateModalOpen}
          onClose={() => {
            setIsEditStateModalOpen(false);
            resetStateForm();
          }}
          title="Edit Global State"
        >
          <form onSubmit={handleEditGlobalState} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">State Name</label>
              <input
                type="text"
                placeholder="Enter state name"
                value={stateForm.name}
                onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Color</label>
              <input
                type="color"
                value={stateForm.color}
                onChange={(e) => setStateForm({ ...stateForm, color: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
              <textarea
                placeholder="What is this state used for?"
                value={stateForm.description}
                onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">Update State</Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsEditStateModalOpen(false);
                  resetStateForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default WorkflowEditor;
