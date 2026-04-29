import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IoAdd, IoPencil, IoSearch, IoTrash } from 'react-icons/io5';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb, Button, Modal } from '../../components/common';
import {
  createIssue,
  deleteIssue,
  getIssues,
  getProjectById,
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
  status: 'To Do',
  assignees: [],
  reviewAssignees: [],
};

const uniqueUsers = (userList) => {
  const map = new Map();
  [...(Array.isArray(userList) ? userList : [])]
    .filter(Boolean)
    .forEach((user) => map.set(user._id, user));
  return [...map.values()];
};

const userNames = (userList, emptyLabel = 'Unassigned') => {
  const names = uniqueUsers(userList).map((user) => user.username).filter(Boolean);
  return names.length > 0 ? names.join(', ') : emptyLabel;
};

const toggleSelection = (selectedIds, userId) =>
  selectedIds.includes(userId)
    ? selectedIds.filter((id) => id !== userId)
    : [...selectedIds, userId];

const CheckboxList = ({ users, selectedIds, onChange }) => (
  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 px-4 py-3">
    {users.map((member) => (
      <label key={member._id} className="flex items-center gap-2 text-sm text-dark">
        <input
          type="checkbox"
          checked={selectedIds.includes(member._id)}
          onChange={() => onChange(toggleSelection(selectedIds, member._id))}
        />
        <span>{member.username}</span>
      </label>
    ))}
  </div>
);

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
  });
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, issuesData, usersData] = await Promise.all([
        getProjectById(id),
        getIssues(`?project=${id}`),
        isAdmin ? getUsers() : Promise.resolve([]),
      ]);
      setProject(projectData);
      setIssues(issuesData || []);
      setUsers(usersData || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch project data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  const applyFiltersAndSearch = useCallback(() => {
    const filtered = issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || issue.status === filters.status;
      const matchesPriority = !filters.priority || issue.priority === filters.priority;
      const assigneeIds = uniqueUsers(issue.assignees).map((entry) => entry._id);
      const matchesAssignee = !filters.assignee || assigneeIds.includes(filters.assignee);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });

    setFilteredIssues(filtered);
  }, [filters, issues, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [applyFiltersAndSearch]);

  const resetIssueForm = () => {
    setIssueForm(emptyIssueForm);
    setSelectedIssue(null);
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.title) {
      alert('Please enter issue title');
      return;
    }

    try {
      await createIssue({
        title: issueForm.title,
        description: issueForm.description,
        issueType: issueForm.issueType,
        priority: issueForm.priority,
        status: issueForm.status,
        assignees: issueForm.assignees,
        reviewAssignees: issueForm.reviewAssignees,
        project: id,
      });
      resetIssueForm();
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
      });
      resetIssueForm();
      setIsEditModalOpen(false);
      await fetchData();
      alert('Issue updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update issue');
    }
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
    });
    setIsEditModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ status: '', priority: '', assignee: '' });
  };

  const statusOptions = project?.workflow?.states?.map((state) => state?.name).filter(Boolean) || [];
  const resolvedStatusOptions = statusOptions.length > 0 ? statusOptions : DEFAULT_STATUS_OPTIONS;
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  const priorityColors = {
    Low: 'text-blue-600',
    Medium: 'text-yellow-600',
    High: 'text-orange-600',
    Critical: 'text-red-600',
  };

  const statusColors = {
    'To Do': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'In Review': 'bg-purple-100 text-purple-800',
    Done: 'bg-green-100 text-green-800',
  };

  const renderIssueForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleEditIssue : handleCreateIssue} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-dark">Issue Title</label>
        <input
          type="text"
          placeholder="Enter issue title"
          value={issueForm.title}
          onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-dark">Description</label>
        <textarea
          placeholder="Enter description (optional)"
          value={issueForm.description}
          onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Issue Type</label>
          <select
            value={issueForm.issueType}
            onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-dark">Status</label>
        <select
          value={issueForm.status}
          onChange={(e) => setIssueForm({ ...issueForm, status: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
        >
          {resolvedStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
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
            onChange={(nextValue) => setIssueForm({ ...issueForm, assignees: nextValue })}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Reviewers</label>
          <CheckboxList
            users={users}
            selectedIds={issueForm.reviewAssignees}
            onChange={(nextValue) => setIssueForm({ ...issueForm, reviewAssignees: nextValue })}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="primary" type="submit">
          {isEdit ? 'Update Issue' : 'Create Issue'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isEdit) {
              setIsEditModalOpen(false);
            } else {
              setIsCreateModalOpen(false);
            }
            resetIssueForm();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-8 text-center">Loading project...</div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="py-8 text-center text-red-600">Project not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="-mx-3 -my-3 min-h-[calc(100vh-120px)] ui-dark-page px-3 py-4 md:-mx-5 md:px-6 md:py-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Projects', href: '/admin/projects' },
            { label: project.name, href: '#', active: true },
          ]}
        />

        <div className="mb-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-dark">{project.name}</h1>
              {project.description && <p className="mb-2 text-xs text-gray-600">{project.description}</p>}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600">
                  Workflow: <span className="font-semibold text-dark">{project.workflow?.name}</span>
                </span>
                <span className="text-gray-600">
                  Total Issues: <span className="font-semibold text-dark">{issues.length}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="primary"
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  onClick={() => {
                    resetIssueForm();
                    setIssueForm((current) => ({ ...current, status: resolvedStatusOptions[0] || 'To Do' }));
                    setIsCreateModalOpen(true);
                  }}
                >
                  <IoAdd size={14} /> Create Issue
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/projects')}
                className="px-3 py-2 text-sm"
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded border border-red-300 bg-red-100 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <Card className="mb-4">
          <div className="space-y-3">
            <div className="relative">
              <IoSearch className="absolute left-2 top-2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by title, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-gray-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-dark">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  <option value="">All Status</option>
                  {resolvedStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-dark">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  <option value="">All Priority</option>
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-dark">Assignee</label>
                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  <option value="">All Assignees</option>
                  {users.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-dark">&nbsp;</label>
                <Button variant="secondary" onClick={handleResetFilters} className="w-full py-1 text-xs">
                  Reset
                </Button>
              </div>

              <div className="flex items-end">
                <span className="text-xs text-gray-600">
                  <span className="font-semibold">{filteredIssues.length}</span> of{' '}
                  <span className="font-semibold">{issues.length}</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="ui-dark-surface ui-shadow p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/90">Project Issues</h2>
            <span className="text-xs text-white/50">{filteredIssues.length} visible</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="ui-dark-table">
              <thead className="ui-dark-thead">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Issue ID</th>
                  <th className="px-3 py-2 text-left font-semibold">Issue Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Priority</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Assignees</th>
                  <th className="px-3 py-2 text-left font-semibold">Reviewers</th>
                  <th className="px-3 py-2 text-left font-semibold">Reporter</th>
                  <th className="px-3 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <tr
                      key={issue._id}
                      className="ui-dark-tr cursor-pointer"
                      onClick={() => navigate(`/admin/issue/${issue._id}`)}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-white/55">
                        {issue.issueId}
                      </td>
                      <td className="px-3 py-2">
                        <div className="min-w-[180px]">
                          <p className="truncate text-sm font-semibold text-white">{issue.title}</p>
                          <p className="text-xs text-white/40">{issue.issueType}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`whitespace-nowrap text-xs font-semibold ${priorityColors[issue.priority]}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`whitespace-nowrap rounded-md px-2 py-1 text-xs ${statusColors[issue.status]}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-white/75">
                        {userNames(issue.assignees)}
                      </td>
                      <td className="px-3 py-2 text-sm text-white/75">
                        {userNames(issue.reviewAssignees)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-white/75">
                        {issue.reporter?.username || 'Unassigned'}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
                    <td colSpan="8" className="px-3 py-10 text-center text-sm text-white/50">
                      {issues.length === 0 ? 'No issues in this project yet.' : 'No issues match your search or filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Issue">
          {renderIssueForm(false)}
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Issue">
          {renderIssueForm(true)}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ProjectDetail;
