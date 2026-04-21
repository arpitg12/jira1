import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb, Button, Modal } from '../../components/common';
import { IoAdd, IoTrash, IoPencil, IoOpen } from 'react-icons/io5';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getWorkflows,
} from '../../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({ name: '', description: '', workflow: '' });
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, workflowsData] = await Promise.all([
        getProjects(),
        getWorkflows(),
      ]);
      setProjects(projectsData);
      setWorkflows(workflowsData);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.workflow) {
      alert('Please enter project name and select workflow');
      return;
    }

    try {
      await createProject({
        name: projectForm.name,
        description: projectForm.description,
        workflow: projectForm.workflow,
      });
      setProjectForm({ name: '', description: '', workflow: '' });
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
      await updateProject(selectedProject._id, {
        name: projectForm.name,
        description: projectForm.description,
        workflow: projectForm.workflow,
      });
      setProjectForm({ name: '', description: '', workflow: '' });
      setIsEditModalOpen(false);
      setSelectedProject(null);
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
      workflow: project.workflow._id,
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

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Projects', href: '/admin/projects', active: true },
          ]}
        />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <IoAdd size={14} /> Create
          </Button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-white/70 text-sm">Loading projects...</div>
        ) : (
          <div className="space-y-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div key={project._id} className="group relative ui-dark-surface ui-shadow p-3">
                  <div className="flex items-start justify-between gap-3 pr-20">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-white mb-1">{project.name}</h2>
                      {project.description && (
                        <p className="text-white/60 text-xs mb-1 line-clamp-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>Workflow:</span>
                        <span className="font-semibold text-white/80">{project.workflow.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact actions (top-right) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Button
                      variant="primary"
                      size="sm"
                      title="View"
                      aria-label="View"
                      onClick={() => navigate(`/admin/projects/${project._id}`)}
                      className="!px-2 !py-1 flex items-center gap-1"
                    >
                      <IoOpen size={14} />
                    </Button>
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
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-dark-surface ui-shadow p-6 text-center text-white/60 text-sm">
                  No projects found. Create one to get started!
              </div>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setProjectForm({ name: '', description: '', workflow: '' });
          }}
          title="Create New Project"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Project Name
              </label>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter description (optional)"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
                className="w-full"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Select Workflow
              </label>
              <select
                value={projectForm.workflow}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, workflow: e.target.value })
                }
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
            <div className="flex gap-2 pt-4">
              <Button variant="primary" size="sm" type="submit">
                Create
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setProjectForm({ name: '', description: '', workflow: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Project Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setProjectForm({ name: '', description: '', workflow: '' });
            setSelectedProject(null);
          }}
          title="Edit Project"
        >
          <form onSubmit={handleEditProject} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Project Name
              </label>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter description (optional)"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
                className="w-full"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Select Workflow
              </label>
              <select
                value={projectForm.workflow}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, workflow: e.target.value })
                }
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
            <div className="flex gap-2 pt-4">
              <Button variant="primary" size="sm" type="submit">
                Update
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setProjectForm({ name: '', description: '', workflow: '' });
                  setSelectedProject(null);
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

export default Projects;
