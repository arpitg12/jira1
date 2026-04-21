import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb, Button, Modal } from '../../components/common';
import { IoAdd, IoTrash, IoPencil } from 'react-icons/io5';
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  addStateToWorkflow,
  removeStateFromWorkflow,
  getGlobalStates,
  createGlobalState,
} from '../../services/api';

const WorkflowEditor = () => {
  const [workflows, setWorkflows] = useState([]);
  const [globalStates, setGlobalStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [isEditWorkflowModalOpen, setIsEditWorkflowModalOpen] = useState(false);
  const [isAddStateModalOpen, setIsAddStateModalOpen] = useState(false);
  const [isCreateStateModalOpen, setIsCreateStateModalOpen] = useState(false);

  // Form states
  const [workflowForm, setWorkflowForm] = useState({ name: '', description: '', states: [] });
  const [stateForm, setStateForm] = useState({ name: '', color: '#3b82f6' });
  const [stateFormForWorkflow, setStateFormForWorkflow] = useState({ stateId: '' });
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workflows, states] = await Promise.all([
        getWorkflows(),
        getGlobalStates(),
      ]);
      setWorkflows(workflows);
      setGlobalStates(states);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!workflowForm.name) {
      alert('Please enter workflow name');
      return;
    }

    try {
      await createWorkflow({
        name: workflowForm.name,
        description: workflowForm.description,
        states: workflowForm.states,
      });
      setWorkflowForm({ name: '', description: '', states: [] });
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
      });
      setWorkflowForm({ name: '', description: '', states: [] });
      setIsEditWorkflowModalOpen(false);
      setSelectedWorkflow(null);
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
      description: workflow.description,
      states: workflow.states.map(s => s._id),
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
    if (!stateFormForWorkflow.stateId) {
      alert('Please select a state');
      return;
    }

    try {
      await addStateToWorkflow(selectedWorkflow._id, {
        stateId: stateFormForWorkflow.stateId,
      });
      setStateFormForWorkflow({ stateId: '' });
      setIsAddStateModalOpen(false);
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
    if (!stateForm.name) {
      alert('Please enter state name');
      return;
    }

    try {
      await createGlobalState({
        name: stateForm.name,
        color: stateForm.color,
      });
      setStateForm({ name: '', color: '#3b82f6' });
      setIsCreateStateModalOpen(false);
      await fetchData();
      alert('Global state created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create state');
    }
  };

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Workflows', href: '/admin/workflows', active: true },
          ]}
        />
        <div className="flex items-center justify-between mb-4">
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
          <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-sm text-gray-600">Loading workflows...</div>
        ) : (
          <div className="space-y-3">
            {/* Global States Section */}
            <Card title="Global States">
              <div className="mb-4">
                {globalStates.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {globalStates.map((state) => (
                      <div
                        key={state._id}
                        className="text-white rounded-xl px-3 py-1.5 font-semibold text-xs flex items-center gap-2"
                        style={{ backgroundColor: state.color }}
                      >
                        {state.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-4">No global states created yet</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsCreateStateModalOpen(true)}
                >
                  <IoAdd size={16} /> Create Global State
                </Button>
              </div>
            </Card>

            {/* Workflows Section */}
            {workflows.length > 0 ? (
              workflows.map((workflow) => (
                <Card key={workflow._id} title={workflow.name}>
                  <p className="text-gray-600 text-sm mb-4">
                    {workflow.description || 'No description'}
                  </p>

                  {/* States Section */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-dark mb-3">Workflow States</h3>
                    {workflow.states && workflow.states.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {workflow.states.map((state, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div
                              className="text-white rounded-xl px-3 py-1.5 font-semibold text-xs whitespace-nowrap flex items-center gap-2"
                              style={{ backgroundColor: state.color }}
                            >
                              {state.name}
                              <button
                                onClick={() =>
                                  handleRemoveStateFromWorkflow(workflow._id, state._id)
                                }
                                className="hover:opacity-75"
                              >
                                <IoTrash size={14} />
                              </button>
                            </div>
                            {idx < workflow.states.length - 1 && (
                              <div className="w-6 h-0.5 bg-gray-300"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-4">No states in this workflow</p>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsAddStateModalOpen(true);
                      }}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <IoAdd size={16} /> Add State
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200/80">
                    <Button
                      variant="secondary"
                      onClick={() => openEditWorkflow(workflow)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <IoPencil size={14} /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteWorkflow(workflow._id)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <IoTrash size={14} /> Delete
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="text-center py-8 text-gray-500">
                  No workflows found. Create one to get started!
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Create Workflow Modal */}
        <Modal
          isOpen={isCreateWorkflowModalOpen}
          onClose={() => {
            setIsCreateWorkflowModalOpen(false);
            setWorkflowForm({ name: '', description: '', states: [] });
          }}
          title="Create New Workflow"
        >
          <form onSubmit={handleCreateWorkflow} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                placeholder="Enter workflow name"
                value={workflowForm.name}
                onChange={(e) =>
                  setWorkflowForm({ ...workflowForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter description (optional)"
                value={workflowForm.description}
                onChange={(e) =>
                  setWorkflowForm({ ...workflowForm, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Initial States (Optional)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {globalStates.map((state) => (
                  <label key={state._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workflowForm.states.includes(state._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWorkflowForm({
                            ...workflowForm,
                            states: [...workflowForm.states, state._id],
                          });
                        } else {
                          setWorkflowForm({
                            ...workflowForm,
                            states: workflowForm.states.filter(id => id !== state._id),
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span
                      className="px-3 py-1 rounded text-white text-sm font-semibold"
                      style={{ backgroundColor: state.color }}
                    >
                      {state.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">
                Create
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateWorkflowModalOpen(false);
                  setWorkflowForm({ name: '', description: '', states: [] });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Workflow Modal */}
        <Modal
          isOpen={isEditWorkflowModalOpen}
          onClose={() => {
            setIsEditWorkflowModalOpen(false);
            setWorkflowForm({ name: '', description: '', states: [] });
            setSelectedWorkflow(null);
          }}
          title="Edit Workflow"
        >
          <form onSubmit={handleEditWorkflow} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                placeholder="Enter workflow name"
                value={workflowForm.name}
                onChange={(e) =>
                  setWorkflowForm({ ...workflowForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter description (optional)"
                value={workflowForm.description}
                onChange={(e) =>
                  setWorkflowForm({ ...workflowForm, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">
                Update
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditWorkflowModalOpen(false);
                  setWorkflowForm({ name: '', description: '', states: [] });
                  setSelectedWorkflow(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add State to Workflow Modal */}
        <Modal
          isOpen={isAddStateModalOpen}
          onClose={() => setIsAddStateModalOpen(false)}
          title="Add State to Workflow"
        >
          <form onSubmit={handleAddStateToWorkflow} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Select Global State
              </label>
              <select
                value={stateFormForWorkflow.stateId}
                onChange={(e) =>
                  setStateFormForWorkflow({
                    stateId: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                required
              >
                <option value="">-- Select a state --</option>
                {globalStates.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">
                Add State
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsAddStateModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Global State Modal */}
        <Modal
          isOpen={isCreateStateModalOpen}
          onClose={() => setIsCreateStateModalOpen(false)}
          title="Create Global State"
        >
          <form onSubmit={handleCreateGlobalState} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                State Name
              </label>
              <input
                type="text"
                placeholder="Enter state name"
                value={stateForm.name}
                onChange={(e) =>
                  setStateForm({ ...stateForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Color
              </label>
              <input
                type="color"
                value={stateForm.color}
                onChange={(e) =>
                  setStateForm({ ...stateForm, color: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">
                Create State
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsCreateStateModalOpen(false)}
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
