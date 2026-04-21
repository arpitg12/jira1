import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Button, Breadcrumb } from '../../components/common';
import { 
  IoArrowBack, 
  IoCheckmark, 
  IoClose, 
  IoAdd,
  IoPencil,
  IoTrash,
  IoFlag,
  IoPerson,
  IoCalendar,
  IoLink,
  IoAttach,
  IoRefresh
} from 'react-icons/io5';
import { getIssueById, updateIssue, getUsers } from '../../services/api';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [issue, setIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issueData, usersData] = await Promise.all([
        getIssueById(id),
        getUsers(),
      ]);
      setIssue(issueData);
      setUsers(usersData);
      setEditForm({
        title: issueData.title,
        description: issueData.description,
        status: issueData.status,
        priority: issueData.priority,
        issueType: issueData.issueType,
        assignee: issueData.assignee?._id || '',
      });
    } catch (err) {
      setError('Failed to load issue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateIssue(id, { status: newStatus });
      setIssue({ ...issue, status: newStatus });
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateIssue(id, editForm);
      setIssue({ ...issue, ...editForm });
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save changes');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // TODO: Implement comment API
      setNewComment('');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading issue...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!issue) {
    return (
      <AdminLayout>
        <div className="text-center py-8 text-red-600">Issue not found</div>
      </AdminLayout>
    );
  }

  const statusColors = {
    'To Do': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'In Review': 'bg-purple-100 text-purple-800',
    'Done': 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    'Low': 'text-blue-600',
    'Medium': 'text-yellow-600',
    'High': 'text-orange-600',
    'Critical': 'text-red-600',
  };

  const statusOptions = ['To Do', 'In Progress', 'In Review', 'Done'];

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="sticky top-0 z-40 py-3">
          <div className="ui-surface-muted ui-shadow flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-dark transition"
              >
                <IoArrowBack /> Back
              </button>
              <span className="text-gray-400">|</span>
              <span className="text-sm font-medium text-gray-600">{issue.issueId}</span>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IoPencil size={14} /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IoTrash size={14} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="py-3">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {/* Title and Status */}
              <div className="ui-surface ui-shadow p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="text-xl font-bold w-full px-2 py-1"
                      />
                    ) : (
                      <h1 className="text-xl font-bold text-dark">{issue.title}</h1>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <>
                        <Button variant="primary" size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="ui-surface ui-shadow p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">{issue.description}</p>
                )}
              </div>

              {/* Subtasks */}
              <div className="ui-surface ui-shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Subtasks</h2>
                  <Button variant="ghost" size="sm" className="text-primary text-xs flex items-center gap-1">
                    <IoAdd size={14} /> Add subtask
                  </Button>
                </div>
                <p className="text-xs text-gray-500">No subtasks yet</p>
              </div>

              {/* Linked Work Items */}
              <div className="ui-surface ui-shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Linked work items</h2>
                  <Button variant="ghost" size="sm" className="text-primary text-xs flex items-center gap-1">
                    <IoLink size={14} /> Add link
                  </Button>
                </div>
                <p className="text-xs text-gray-500">No linked items</p>
              </div>

              {/* Activity */}
              <div className="ui-surface ui-shadow p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Activity</h2>
                
                {/* Comments */}
                <div className="mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      S
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full resize-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        {newComment && (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => setNewComment('')}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={handleAddComment}>Comment</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p className="text-gray-400">Created 22 April 2025 at 05:09</p>
                    <p className="text-gray-400">Updated 12 June 2025 at 16:25</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Details */}
            <div className="space-y-3">
              {/* Status Button */}
              <div className="ui-surface ui-shadow p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Status</span>
                  <div className="relative group">
                    <button className={`px-3 py-1 rounded text-xs font-semibold ${statusColors[issue.status]} hover:opacity-80 flex items-center gap-1`}>
                      {issue.status}
                      <span className="text-xs">▼</span>
                    </button>
                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Panel */}
              <div className="ui-surface ui-shadow p-3 space-y-3">
                <div className="text-xs">
                  <span className="text-gray-600 font-semibold block mb-1">Assignee</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                      {issue.assignee?.username?.[0].toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium">{issue.assignee?.username || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <span className="text-gray-600 font-semibold block mb-2 text-xs">Priority</span>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    disabled={!isEditing}
                    className="w-full text-xs disabled:bg-transparent"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <span className="text-gray-600 font-semibold block mb-1 text-xs">Type</span>
                  <select
                    value={editForm.issueType}
                    onChange={(e) => setEditForm({ ...editForm, issueType: e.target.value })}
                    disabled={!isEditing}
                    className="w-full text-xs disabled:bg-transparent"
                  >
                    <option>Task</option>
                    <option>Bug</option>
                    <option>Feature</option>
                    <option>Improvement</option>
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <span className="text-gray-600 font-semibold block mb-1 text-xs">Reporter</span>
                  <span className="text-gray-700 text-xs">{issue.project?.name || 'N/A'}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="ui-surface ui-shadow p-3">
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold">Created</span>
                    <p>22 April 2025 at 05:09</p>
                  </div>
                  <div>
                    <span className="font-semibold">Updated</span>
                    <p>12 June 2025 at 16:25</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IssueDetail;
