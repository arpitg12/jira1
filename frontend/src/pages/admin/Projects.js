import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Breadcrumb, Button, Modal } from '../../components/common';
import { IoAdd, IoOpen, IoPencil, IoTrash } from 'react-icons/io5';
import {
  createProject,
  deleteProject,
  getProjects,
  getUsers,
  getWorkflows,
  updateProject,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyProjectForm = {
  name: '',
  description: '',
  workflow: '',
  visibleToUsers: [],
};

const Projects = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsData, workflowsData, usersData] = await Promise.all([
        getProjects(),
        isAdmin ? getWorkflows() : Promise.resolve([]),
        isAdmin ? getUsers() : Promise.resolve([]),
      ]);
      setProjects(projectsData || []);
      setWorkflows(workflowsData || []);
      setUsers(usersData || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setProjectForm(emptyProjectForm);
    setSelectedProject(null);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.workflow) {
      alert('Please enter project name and select workflow');
      return;
    }

    try {
      await createProject(projectForm);
      resetForm();
      setIsCreateModalOpen(false);
      await fetchData();
      alert('Project created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await updateProject(selectedProject._id, projectForm);
      resetForm();
      setIsEditModalOpen(false);
      await fetchData();
      alert('Project updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update project');
    }
  };

  const openEditProject = (project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      description: project.description,
      workflow: project.workflow?._id || '',
      visibleToUsers: (project.visibleToUsers || []).map((member) => member._id),
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(projectId);
      await fetchData();
      alert('Project deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const toggleVisibleUser = (userId) => {
    setProjectForm((current) => ({
      ...current,
      visibleToUsers: current.visibleToUsers.includes(userId)
        ? current.visibleToUsers.filter((entry) => entry !== userId)
        : [...current.visibleToUsers, userId],
    }));
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  return (
    <AdminLayout>
      <div className="-mx-3 -my-3 min-h-[calc(100vh-120px)] ui-dark-page px-3 py-4 md:-mx-5 md:px-6 md:py-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Projects', href: '/admin/projects', active: true },
          ]}
        />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{isAdmin ? 'Projects' : 'My Projects'}</h1>
            <p className="mt-1 text-sm text-white/55">
              {isAdmin
                ? 'Create projects, attach workflows, and choose which members can view them.'
                : 'These are the projects your account is allowed to access.'}
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <IoAdd size={14} /> Create
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded border border-red-500/30 bg-red-500/20 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-white/70">Loading projects...</div>
        ) : (
          <div className="space-y-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div key={project._id} className="group relative ui-dark-surface ui-shadow p-3">
                  <div className="flex items-start justify-between gap-3 pr-20">
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-1 text-base font-bold text-white">{project.name}</h2>
                      {project.description && (
                        <p className="mb-1 line-clamp-1 text-xs text-white/60">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>Workflow:</span>
                        <span className="font-semibold text-white/80">{project.workflow?.name}</span>
                      </div>
                      <div className="mt-2 text-xs text-white/55">
                        {project.visibleToUsers?.length > 0
                          ? `Visible to ${project.visibleToUsers.length} selected member${project.visibleToUsers.length > 1 ? 's' : ''}`
                          : 'Visible to all authenticated members'}
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Button
                      variant="primary"
                      size="sm"
                      title="View"
                      aria-label="View"
                      onClick={() => navigate(`/admin/projects/${project._id}`)}
                      className="flex items-center gap-1 !px-2 !py-1"
                    >
                      <IoOpen size={14} />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => openEditProject(project)}
                          className="!px-2 !py-1"
                        >
                          <IoPencil size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => handleDeleteProject(project._id)}
                          className="!px-2 !py-1"
                        >
                          <IoTrash size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-dark-surface ui-shadow p-6 text-center text-sm text-white/60">
                No projects found.
              </div>
            )}
          </div>
        )}

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Create New Project">
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Project Name</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
              <textarea
                placeholder="Enter description (optional)"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Select Workflow</label>
              <select
                value={projectForm.workflow}
                onChange={(e) => setProjectForm({ ...projectForm, workflow: e.target.value })}
                className="w-full"
                required
              >
                <option value="">-- Select a workflow --</option>
                {workflows.map((workflow) => (
                  <option key={workflow._id} value={workflow._id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Member Access</label>
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/55">
                  Leave this empty if all members should be able to view the project.
                </p>
                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {users.filter((member) => member.role !== 'Admin').map((member) => (
                    <label
                      key={member._id}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80"
                    >
                      <input
                        type="checkbox"
                        checked={projectForm.visibleToUsers.includes(member._id)}
                        onChange={() => toggleVisibleUser(member._id)}
                      />
                      <span>{member.username}</span>
                      <span className="text-xs text-white/45">{member.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" size="sm" type="submit">
                Create
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={closeCreateModal}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Project">
          <form onSubmit={handleEditProject} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Project Name</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
              <textarea
                placeholder="Enter description (optional)"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Select Workflow</label>
              <select
                value={projectForm.workflow}
                onChange={(e) => setProjectForm({ ...projectForm, workflow: e.target.value })}
                className="w-full"
                required
              >
                <option value="">-- Select a workflow --</option>
                {workflows.map((workflow) => (
                  <option key={workflow._id} value={workflow._id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">Member Access</label>
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/55">
                  Select the members who should be able to view this project.
                </p>
                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {users.filter((member) => member.role !== 'Admin').map((member) => (
                    <label
                      key={member._id}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80"
                    >
                      <input
                        type="checkbox"
                        checked={projectForm.visibleToUsers.includes(member._id)}
                        onChange={() => toggleVisibleUser(member._id)}
                      />
                      <span>{member.username}</span>
                      <span className="text-xs text-white/45">{member.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" size="sm" type="submit">
                Update
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={closeEditModal}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Projects;
