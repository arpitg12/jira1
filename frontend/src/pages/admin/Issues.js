import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAdd, IoPencil, IoTrash } from 'react-icons/io5';
import AdminLayout from '../../layouts/AdminLayout';
import { Breadcrumb, Button, Modal, Badge } from '../../components/common';
import {
  createIssue,
  deleteIssue,
  getIssues,
  getProjects,
  getUsers,
  updateIssue,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done'];

const emptyIssueForm = {
  title: '',
  description: '',
  issueType: 'Task',
  priority: 'Medium',
  assignees: [],
  reviewAssignees: [],
  reporter: '',
  project: '',
  status: 'To Do',
};

const uniqueUsers = (userList) => {
  const map = new Map();
  [...(Array.isArray(userList) ? userList : [])]
    .filter(Boolean)
    .forEach((user) => map.set(user._id, user));
  return [...map.values()];
};

const userNames = (userList, emptyLabel = 'Unassigned') => {
  const people = uniqueUsers(userList).map((user) => user.username).filter(Boolean);
  return people.length > 0 ? people.join(', ') : emptyLabel;
};

const toggleSelection = (selectedIds, userId) =>
  selectedIds.includes(userId)
    ? selectedIds.filter((id) => id !== userId)
    : [...selectedIds, userId];

const CheckboxList = ({ users, selectedIds, onChange, emptyLabel }) => (
  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 px-3 py-2">
    {users.length > 0 ? (
      users.map((user) => (
        <label key={user._id} className="flex items-center gap-2 text-sm text-dark">
          <input
            type="checkbox"
            checked={selectedIds.includes(user._id)}
            onChange={() => onChange(toggleSelection(selectedIds, user._id))}
          />
          <span>{user.username}</span>
        </label>
      ))
    ) : (
      <div className="text-xs text-gray-500">{emptyLabel}</div>
    )}
  </div>
);

const Issues = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    setActiveFilter('All');
  }, [isAdmin]);

  const getWorkflowStatusOptionsForProject = (projectId) => {
    const selectedProject = projects.find((project) => project._id === projectId);
    const workflowStatuses =
      selectedProject?.workflow?.states?.map((state) => state?.name).filter(Boolean) || [];

    return workflowStatuses.length > 0 ? workflowStatuses : DEFAULT_STATUS_OPTIONS;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [issuesData, projectsData, usersData] = await Promise.all([
        getIssues(),
        getProjects(),
        isAdmin ? getUsers() : Promise.resolve([]),
      ]);
      setIssues(issuesData || []);
      setProjects(projectsData || []);
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
    setIssueForm(emptyIssueForm);
    setSelectedIssue(null);
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
        assignees: issueForm.assignees,
        reviewAssignees: issueForm.reviewAssignees,
        reporter: issueForm.reporter || undefined,
        project: issueForm.project,
      });
      resetForm();
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
        assignees: issueForm.assignees,
        reviewAssignees: issueForm.reviewAssignees,
        reporter: issueForm.reporter || undefined,
      });
      resetForm();
      setIsEditModalOpen(false);
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
      assignees: uniqueUsers(issue.assignees).map((entry) => entry._id),
      reviewAssignees: uniqueUsers(issue.reviewAssignees).map((entry) => entry._id),
      reporter: issue.reporter?._id || '',
      project: issue.project?._id || '',
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
    { key: 'My Issues', label: 'My Items' },
    { key: 'In Progress', label: 'In Progress' },
  ];

  const filteredIssues = issues.filter((issue) => {
    const assigneeIds = uniqueUsers(issue.assignees).map((entry) => entry._id);
    const reviewerIds = uniqueUsers(issue.reviewAssignees).map((entry) => entry._id);

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bug') return issue.issueType === 'Bug';
    if (activeFilter === 'Critical') return issue.priority === 'Critical';
    if (activeFilter === 'In Progress') return issue.status === 'In Progress';
    if (activeFilter === 'My Issues') {
      return [...assigneeIds, ...reviewerIds, issue.reporter?._id].includes(user?._id);
    }
    return true;
  });

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  const renderForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleEditIssue : handleCreateIssue} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-dark">Issue Title</label>
        <input
          type="text"
          placeholder="Enter issue title"
          value={issueForm.title}
          onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
          className="w-full"
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
        <textarea
          placeholder="Enter description (optional)"
          value={issueForm.description}
          onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
          className="w-full"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Issue Type</label>
          <select
            value={issueForm.issueType}
            onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
            className="w-full"
          >
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
            <option value="Feature">Feature</option>
            <option value="Improvement">Improvement</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Priority</label>
          <select
            value={issueForm.priority}
            onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
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
        <label className="mb-2 block text-sm font-semibold text-dark">Project</label>
        <select
          value={issueForm.project}
          onChange={(e) =>
            setIssueForm({
              ...issueForm,
              project: e.target.value,
              status: getWorkflowStatusOptionsForProject(e.target.value)[0] || 'To Do',
            })
          }
          className="w-full"
          required
          disabled={isEdit}
        >
          <option value="">-- Select a project --</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Assignees</label>
          <CheckboxList
            users={users}
            selectedIds={issueForm.assignees}
            onChange={(value) => setIssueForm({ ...issueForm, assignees: value })}
            emptyLabel="No users found"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Reviewers</label>
          <CheckboxList
            users={users}
            selectedIds={issueForm.reviewAssignees}
            onChange={(value) => setIssueForm({ ...issueForm, reviewAssignees: value })}
            emptyLabel="No users found"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Reporter</label>
          <select
            value={issueForm.reporter}
            onChange={(e) => setIssueForm({ ...issueForm, reporter: e.target.value })}
            className="w-full"
          >
            <option value="">-- Select reporter --</option>
            {users.map((entry) => (
              <option key={entry._id} value={entry._id}>
                {entry.username}
              </option>
            ))}
          </select>
        </div>
        {isEdit && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark">Status</label>
            <select
              value={issueForm.status}
              onChange={(e) => setIssueForm({ ...issueForm, status: e.target.value })}
              className="w-full"
            >
              {getWorkflowStatusOptionsForProject(issueForm.project).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="primary" type="submit">
          {isEdit ? 'Update Issue' : 'Create Issue'}
        </Button>
        <Button type="button" variant="secondary" onClick={isEdit ? closeEditModal : closeCreateModal}>
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <AdminLayout>
      <div className="-mx-3 -my-3 min-h-[calc(100vh-120px)] bg-gradient-to-b from-[#0b0d10] to-[#07080a] px-3 py-4 text-white md:-mx-5 md:px-6 md:py-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Issues', href: '/admin/issues', active: true },
          ]}
        />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Issues</h1>
            <p className="mt-1 text-sm text-white/55">
              {isAdmin
                ? 'Full issue visibility across every project in the workspace.'
                : 'You can see every ticket inside the projects your account can access.'}
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
          <div className="py-10 text-center text-sm text-white/70">Loading issues...</div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    activeFilter === tab.key
                      ? 'border-[#5b5dff]/50 bg-[#2a2cff]/25 text-white shadow-[0_0_0_2px_rgba(91,93,255,0.25)]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 ui-shadow">
              <table className="w-full">
                <thead className="border-b border-white/10 text-xs text-white/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Issue</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Assignees</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredIssues.length > 0 ? (
                    filteredIssues.map((issue) => (
                      <tr
                        key={issue._id}
                        className="cursor-pointer border-b border-white/10 hover:bg-white/5"
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
                        <td className="px-4 py-3 text-sm text-white/80">
                          {userNames(issue.assignees)}
                        </td>
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  title="Edit"
                                  aria-label="Edit"
                                  onClick={() => openEditIssue(issue)}
                                  className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                                >
                                  <IoPencil size={16} className="text-white/70" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  aria-label="Delete"
                                  onClick={() => handleDeleteIssue(issue._id)}
                                  className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                                >
                                  <IoTrash size={16} className="text-red-300" />
                                </button>
                              </>
                            )}
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

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Create New Issue">
          {renderForm(false)}
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Issue">
          {renderForm(true)}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Issues;
