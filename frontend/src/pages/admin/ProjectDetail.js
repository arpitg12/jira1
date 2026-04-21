import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb, Button, Modal } from '../../components/common';
import { IoAdd, IoTrash, IoPencil, IoSearch, IoClose } from 'react-icons/io5';
import {
  getProjectById,
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  getUsers,
} from '../../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
  });
  const [filteredIssues, setFilteredIssues] = useState([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    issueType: 'Task',
    priority: 'Medium',
    status: 'To Do',
    assignee: '',
    reviewAssignee: '',
  });
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [id]);

  // Apply search and filters whenever issues, searchTerm, or filters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [issues, searchTerm, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, issuesData, usersData] = await Promise.all([
        getProjectById(id),
        getIssues(`?project=${id}`),
        getUsers(),
      ]);
      setProject(projectData);
      setIssues(issuesData);
      setUsers(usersData);
      setError('');
    } catch (err) {
      setError('Failed to fetch project data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || issue.status === filters.status;
      const matchesPriority = !filters.priority || issue.priority === filters.priority;
      const matchesAssignee =
        !filters.assignee ||
        (issue.assignee && issue.assignee._id === filters.assignee);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });

    setFilteredIssues(filtered);
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
        assignee: issueForm.assignee || undefined,
        reviewAssignee: issueForm.reviewAssignee || undefined,
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
        assignee: issueForm.assignee || undefined,
        reviewAssignee: issueForm.reviewAssignee || undefined,
      });
      resetIssueForm();
      setIsEditModalOpen(false);
      setSelectedIssue(null);
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
      assignee: issue.assignee?._id || '',
      reviewAssignee: issue.reviewAssignee?._id || '',
    });
    setIsEditModalOpen(true);
  };

  const resetIssueForm = () => {
    setIssueForm({
      title: '',
      description: '',
      issueType: 'Task',
      priority: 'Medium',
      status: 'To Do',
      assignee: '',
      reviewAssignee: '',
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ status: '', priority: '', assignee: '' });
  };

  const statusOptions = ['To Do', 'In Progress', 'In Review', 'Done'];
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
    'Done': 'bg-green-100 text-green-800',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">Loading project...</div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="text-center py-8 text-red-600">Project not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Projects', href: '/admin/projects' },
            { label: project.name, href: '#', active: true },
          ]}
        />

        {/* Project Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-dark mb-1">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 text-xs mb-2">{project.description}</p>
              )}
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
              <Button
                variant="primary"
                className="flex items-center gap-2 text-sm py-2 px-3"
                onClick={() => {
                  resetIssueForm();
                  setIsCreateModalOpen(true);
                }}
              >
                <IoAdd size={14} /> Create Issue
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/projects')}
                className="text-sm py-2 px-3"
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        {/* Search and Filter Section */}
        <Card className="mb-4">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <IoSearch className="absolute left-2 top-2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by title, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:border-primary outline-none"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:border-primary outline-none text-xs"
                >
                  <option value="">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:border-primary outline-none text-xs"
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
                <label className="block text-xs font-semibold text-dark mb-1">
                  Assignee
                </label>
                <select
                  value={filters.assignee}
                  onChange={(e) =>
                    setFilters({ ...filters, assignee: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:border-primary outline-none text-xs"
                >
                  <option value="">All Assignees</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">
                  &nbsp;
                </label>
                <Button
                  variant="secondary"
                  onClick={handleResetFilters}
                  className="w-full text-xs py-1"
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-end">
                <span className="text-xs text-gray-600">
                  <span className="font-semibold">{filteredIssues.length}</span> of <span className="font-semibold">{issues.length}</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Issues List */}
        <div className="space-y-2">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <Card key={issue._id} className="group relative hover:shadow-sm transition cursor-pointer hover:bg-gray-50">
                <div
                  className="flex items-start justify-between gap-3"
                  onClick={() => navigate(`/admin/issue/${issue._id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                        {issue.issueId}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                        {issue.issueType}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 font-semibold whitespace-nowrap ${priorityColors[issue.priority]}`}>
                        {issue.priority}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${statusColors[issue.status]}`}>
                        {issue.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-dark mb-1 truncate hover:underline">{issue.title}</h3>
                    {issue.description && (
                      <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {issue.assignee && (
                        <span>
                          Assigned: <span className="font-semibold text-dark">{issue.assignee.username}</span>
                        </span>
                      )}
                      {issue.reviewAssignee && (
                        <span>
                          Reviewer: <span className="font-semibold text-dark">{issue.reviewAssignee.username}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact actions (top-right) */}
                <div
                  className="absolute top-2 right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Edit"
                    aria-label="Edit"
                    onClick={() => openEditIssue(issue)}
                    className="!px-2 !py-1"
                  >
                    <IoPencil size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => handleDeleteIssue(issue._id)}
                    className="!px-2 !py-1"
                  >
                    <IoTrash size={14} />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-6 text-gray-500 text-sm">
                {issues.length === 0
                  ? 'No issues in this project yet. Create one to get started!'
                  : 'No issues match your search or filters.'}
              </div>
            </Card>
          )}
        </div>

        {/* Create Issue Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetIssueForm();
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
                value={issueForm.description}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Status
                </label>
                <select
                  value={issueForm.status}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Assignee
                </label>
                <select
                  value={issueForm.assignee}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, assignee: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                >
                  <option value="">-- Select assignee --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
              >
                <option value="">-- Select reviewer --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">
                Create Issue
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetIssueForm();
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
            resetIssueForm();
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter description"
                value={issueForm.description}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Status
                </label>
                <select
                  value={issueForm.status}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Assignee
                </label>
                <select
                  value={issueForm.assignee}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, assignee: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
                >
                  <option value="">-- Select assignee --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
              >
                <option value="">-- Select reviewer --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit">
                Update Issue
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetIssueForm();
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

export default ProjectDetail;
