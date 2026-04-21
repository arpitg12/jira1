import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb, Button, Modal, Badge } from '../../components/common';
import { IoAdd, IoTrash, IoPencil } from 'react-icons/io5';
import {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  getProjects,
  getUsers,
} from '../../services/api';

const Issues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    issueType: 'Task',
    priority: 'Medium',
    assignee: '',
    reviewAssignee: '',
    project: '',
  });
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesData, projectsData, usersData] = await Promise.all([
        getIssues(),
        getProjects(),
        getUsers(),
      ]);
      setIssues(issuesData);
      setProjects(projectsData);
      setUsers(usersData);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.title || !issueForm.project) {
      alert('Please enter issue title and select project');
      return;
    }

    try {
      await createIssue({
        title: issueForm.title,
        description: issueForm.description,
        issueType: issueForm.issueType,
        priority: issueForm.priority,
        assignee: issueForm.assignee || undefined,
        reviewAssignee: issueForm.reviewAssignee || undefined,
        project: issueForm.project,
      });
      setIssueForm({
        title: '',
        description: '',
        issueType: 'Task',
        priority: 'Medium',
        assignee: '',
        reviewAssignee: '',
        project: '',
      });
      setIsCreateModalOpen(false);
      await fetchData();
      alert('Issue created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create issue');
    }
  };

  const handleEditIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      await updateIssue(selectedIssue._id, {
        title: issueForm.title,
        description: issueForm.description,
        issueType: issueForm.issueType,
        priority: issueForm.priority,
        status: issueForm.status,
        assignee: issueForm.assignee || undefined,
        reviewAssignee: issueForm.reviewAssignee || undefined,
      });
      setIssueForm({
        title: '',
        description: '',
        issueType: 'Task',
        priority: 'Medium',
        assignee: '',
        reviewAssignee: '',
        project: '',
        status: 'To Do',
      });
      setIsEditModalOpen(false);
      setSelectedIssue(null);
      await fetchData();
      alert('Issue updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update issue');
    }
  };

  const openEditIssue = (issue) => {
    setSelectedIssue(issue);
    setIssueForm({
      title: issue.title,
      description: issue.description,
      issueType: issue.issueType,
      priority: issue.priority,
      status: issue.status,
      assignee: issue.assignee?._id || '',
      reviewAssignee: issue.reviewAssignee?._id || '',
      project: issue.project._id,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;

    try {
      await deleteIssue(issueId);
      await fetchData();
      alert('Issue deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete issue');
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || 'Unknown';
  };

  const priorityColors = {
    Low: 'text-blue-600',
    Medium: 'text-yellow-600',
    High: 'text-orange-600',
    Critical: 'text-red-600',
  };

  const filterTabs = [
    { key: 'All', label: 'All' },
    { key: 'Bug', label: 'Bug' },
    { key: 'Critical', label: 'Critical' },
    { key: 'My Issues', label: 'My Issues' },
    { key: 'In Progress', label: 'In Progress' },
  ];

  const filteredIssues = issues.filter((issue) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bug') return issue.issueType === 'Bug';
    if (activeFilter === 'Critical') return issue.priority === 'Critical';
    if (activeFilter === 'In Progress') return issue.status === 'In Progress';
    // Placeholder until auth exists
    if (activeFilter === 'My Issues') return !!issue.assignee;
    return true;
  });

  return (
    <AdminLayout>
      {/* Full-bleed dark page (covers layout padding) */}
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 bg-gradient-to-b from-[#0b0d10] to-[#07080a] text-white min-h-[calc(100vh-120px)]">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Issues', href: '/admin/issues', active: true },
          ]}
        />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Issues</h1>
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
          <div className="text-center py-10 text-white/70 text-sm">Loading issues...</div>
        ) : (
          <>
            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition ${
                    activeFilter === tab.key
                      ? 'bg-[#2a2cff]/25 border-[#5b5dff]/50 text-white shadow-[0_0_0_2px_rgba(91,93,255,0.25)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 ui-shadow">
              <table className="w-full">
                <thead className="text-xs text-white/50 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Issue</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Assignee</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((issue) => (
                      <tr
                        key={issue._id}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer"
                        onClick={() => navigate(`/admin/issue/${issue._id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{issue.title}</div>
                          <div className="text-xs text-white/40">{issue.issueId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={issue.issueType === 'Bug' ? 'secondary' : 'info'} size="sm">
                            {issue.issueType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${priorityColors[issue.priority]}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-white/70">{issue.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#5b5dff] text-white flex items-center justify-center text-xs font-bold">
                              {(issue.assignee?.username?.[0] || 'A').toUpperCase()}
                            </span>
                            <span className="text-white/80 text-sm">
                              {issue.assignee?.username || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit"
                              aria-label="Edit"
                              onClick={() => openEditIssue(issue)}
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                            >
                              <IoPencil size={16} className="text-white/70" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              aria-label="Delete"
                              onClick={() => handleDeleteIssue(issue._id)}
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                            >
                              <IoTrash size={16} className="text-red-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/50">
                        No issues found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Create Issue Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIssueForm({
              title: '',
              description: '',
              issueType: 'Task',
              priority: 'Medium',
              assignee: '',
              reviewAssignee: '',
              project: '',
            });
          }}
          title="Create New Issue"
        >
          <form onSubmit={handleCreateIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Issue Title
              </label>
              <input
                type="text"
                placeholder="Enter issue title"
                value={issueForm.title}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, title: e.target.value })
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
                value={issueForm.description}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, description: e.target.value })
                }
                className="w-full"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Issue Type
                </label>
                <select
                  value={issueForm.issueType}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, issueType: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                  <option value="Improvement">Improvement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Priority
                </label>
                <select
                  value={issueForm.priority}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, priority: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Project
              </label>
              <select
                value={issueForm.project}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, project: e.target.value })
                }
                className="w-full"
                required
              >
                <option value="">-- Select a project --</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Assignee
                </label>
                <select
                  value={issueForm.assignee}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, assignee: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="">-- Select assignee --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Reviewer
                </label>
                <select
                  value={issueForm.reviewAssignee}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      reviewAssignee: e.target.value,
                    })
                  }
                  className="w-full"
                >
                  <option value="">-- Select reviewer --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
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
                  setIssueForm({
                    title: '',
                    description: '',
                    issueType: 'Task',
                    priority: 'Medium',
                    assignee: '',
                    reviewAssignee: '',
                    project: '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Issue Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setIssueForm({
              title: '',
              description: '',
              issueType: 'Task',
              priority: 'Medium',
              assignee: '',
              reviewAssignee: '',
              project: '',
              status: 'To Do',
            });
            setSelectedIssue(null);
          }}
          title="Edit Issue"
        >
          <form onSubmit={handleEditIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Issue Title
              </label>
              <input
                type="text"
                placeholder="Enter issue title"
                value={issueForm.title}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, title: e.target.value })
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
                value={issueForm.description}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, description: e.target.value })
                }
                className="w-full"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Issue Type
                </label>
                <select
                  value={issueForm.issueType}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, issueType: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                  <option value="Improvement">Improvement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Priority
                </label>
                <select
                  value={issueForm.priority}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, priority: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Status
              </label>
              <select
                value={issueForm.status}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, status: e.target.value })
                }
                className="w-full"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Assignee
                </label>
                <select
                  value={issueForm.assignee}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, assignee: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="">-- Select assignee --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Reviewer
                </label>
                <select
                  value={issueForm.reviewAssignee}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      reviewAssignee: e.target.value,
                    })
                  }
                  className="w-full"
                >
                  <option value="">-- Select reviewer --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
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
                  setIssueForm({
                    title: '',
                    description: '',
                    issueType: 'Task',
                    priority: 'Medium',
                    assignee: '',
                    reviewAssignee: '',
                    project: '',
                    status: 'To Do',
                  });
                  setSelectedIssue(null);
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

export default Issues;
