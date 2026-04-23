import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IoArrowBack,
  IoCalendar,
  IoCheckmark,
  IoFlag,
  IoPencil,
  IoReturnDownBack,
  IoTrash,
} from 'react-icons/io5';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  addComment,
  addReply,
  deleteComment,
  deleteIssue,
  deleteReply,
  getIssueById,
  getUsers,
  updateComment,
  updateIssue,
  updateReply,
} from '../../services/api';

const DEFAULT_STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const TYPE_OPTIONS = ['Task', 'Bug', 'Feature', 'Improvement'];

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'Done':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20';
    case 'In Progress':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/20';
    case 'In Review':
      return 'bg-violet-500/20 text-violet-300 border border-violet-500/20';
    default:
      return 'bg-white/10 text-white/75 border border-white/10';
  }
};

const getPriorityClasses = (priority) => {
  switch (priority) {
    case 'Critical':
      return 'text-red-300';
    case 'High':
      return 'text-orange-300';
    case 'Medium':
      return 'text-amber-300';
    default:
      return 'text-sky-300';
  }
};

const getTypeClasses = (type) => {
  switch (type) {
    case 'Bug':
      return 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/20';
    case 'Feature':
      return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20';
    case 'Improvement':
      return 'bg-amber-500/20 text-amber-200 border border-amber-500/20';
    default:
      return 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/20';
  }
};

const createEditForm = (issueData) => ({
  title: issueData?.title || '',
  description: issueData?.description || '',
  status: issueData?.status || 'To Do',
  priority: issueData?.priority || 'Medium',
  issueType: issueData?.issueType || 'Task',
  assignee: issueData?.assignee?._id || '',
  reviewAssignee: issueData?.reviewAssignee?._id || '',
  reporter: issueData?.reporter?._id || '',
});

const DetailRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
    <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{label}</p>
    <div className="min-w-0 text-right">{children}</div>
  </div>
);

const PersonValue = ({ user, emptyLabel = 'Not set' }) => (
  <span className="block truncate text-sm font-medium text-white/80">
    {user?.username || emptyLabel}
  </span>
);

const CommentActions = ({ onReply, onEdit, onDelete, canManage = true, showReply = true }) => (
  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {showReply && (
      <button type="button" onClick={onReply} className="text-white/45 hover:text-white">
        Reply
      </button>
    )}
    {canManage && (
      <>
        <button type="button" onClick={onEdit} className="text-white/45 hover:text-white">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="text-red-300 hover:text-red-200">
          Delete
        </button>
      </>
    )}
  </div>
);

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  const [issue, setIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editForm, setEditForm] = useState(createEditForm(null));
  const [replyDraft, setReplyDraft] = useState({ commentId: '', text: '' });
  const [editingTarget, setEditingTarget] = useState({ type: '', commentId: '', replyId: '', text: '' });
  const [busyAction, setBusyAction] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [issueData, usersData] = await Promise.all([getIssueById(id), getUsers()]);
      setIssue(issueData);
      setUsers(usersData);
      setEditForm(createEditForm(issueData));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const workflowStatusOptions = useMemo(() => {
    const workflowStates = (issue?.project?.workflow?.states || [])
      .map((state) => state?.name)
      .filter(Boolean);

    return workflowStates.length > 0 ? workflowStates : DEFAULT_STATUS_OPTIONS;
  }, [issue]);

  const sortedComments = useMemo(
    () =>
      [...(issue?.comments || [])].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [issue]
  );

  const applyIssueUpdate = (updatedIssue) => {
    setIssue(updatedIssue);
    setEditForm(createEditForm(updatedIssue));
  };

  const resetInlineStates = () => {
    setReplyDraft({ commentId: '', text: '' });
    setEditingTarget({ type: '', commentId: '', replyId: '', text: '' });
  };

  const handleSaveIssue = async () => {
    try {
      setIsSaving(true);
      const response = await updateIssue(id, {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        priority: editForm.priority,
        issueType: editForm.issueType,
        assignee: editForm.assignee || null,
        reviewAssignee: editForm.reviewAssignee || null,
        reporter: editForm.reporter || null,
      });
      applyIssueUpdate(response.issue || response);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to save issue changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;

    try {
      await deleteIssue(id);
      navigate(issue?.project?._id ? `/admin/projects/${issue.project._id}` : '/admin/issues');
    } catch (err) {
      setError(err.message || 'Failed to delete issue');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setBusyAction('comment-add');
      const response = await addComment(id, {
        text: newComment.trim(),
      });
      applyIssueUpdate(response.issue || response);
      setNewComment('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setBusyAction('');
    }
  };

  const handleReply = async (commentId) => {
    if (!replyDraft.text.trim()) return;

    try {
      setBusyAction(`reply-${commentId}`);
      const response = await addReply(id, commentId, {
        text: replyDraft.text.trim(),
      });
      applyIssueUpdate(response.issue || response);
      setReplyDraft({ commentId: '', text: '' });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add reply');
    } finally {
      setBusyAction('');
    }
  };

  const handleSaveEditedComment = async () => {
    if (!editingTarget.text.trim()) return;

    try {
      setBusyAction(`${editingTarget.type}-${editingTarget.commentId}-${editingTarget.replyId || 'root'}`);
      const response =
        editingTarget.type === 'reply'
          ? await updateReply(id, editingTarget.commentId, editingTarget.replyId, {
              text: editingTarget.text.trim(),
            })
          : await updateComment(id, editingTarget.commentId, {
              text: editingTarget.text.trim(),
            });

      applyIssueUpdate(response.issue || response);
      setEditingTarget({ type: '', commentId: '', replyId: '', text: '' });
      setError('');
    } catch (err) {
      setError(err.message || `Failed to update ${editingTarget.type}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteCommentItem = async (commentId, replyId = '') => {
    const label = replyId ? 'reply' : 'comment';
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;

    try {
      setBusyAction(`delete-${commentId}-${replyId || 'root'}`);
      const response = replyId
        ? await deleteReply(id, commentId, replyId)
        : await deleteComment(id, commentId);
      applyIssueUpdate(response.issue || response);
      setError('');
    } catch (err) {
      setError(err.message || `Failed to delete ${label}`);
    } finally {
      setBusyAction('');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-white/60">Loading issue...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!issue) {
    return (
      <AdminLayout>
        <div className="py-10 text-center text-red-300">Issue not found</div>
      </AdminLayout>
    );
  }

  const canManageComment = (author) =>
    isAdmin || String(author?._id || author) === String(currentUser?._id);

  return (
    <AdminLayout>
      <div className="-mx-3 flex h-[calc(100vh-104px)] flex-col overflow-hidden ui-dark-page px-3 py-3 md:-mx-5 md:px-5 md:py-4">
        <div className="ui-dark-surface-strong ui-shadow mb-3 flex shrink-0 items-center gap-3 overflow-hidden px-4 py-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <IoArrowBack size={15} /> Back
          </button>

          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((current) => ({ ...current, title: e.target.value }))}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-lg font-bold text-white focus:ring-0"
              placeholder="Issue title"
            />
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-white">{issue.title}</h1>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveIssue}
                  disabled={isSaving || !editForm.title.trim()}
                  className="flex items-center gap-1.5"
                >
                  <IoCheckmark size={14} />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditForm(createEditForm(issue));
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5"
              >
                <IoPencil size={13} /> Edit
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={handleDeleteIssue} className="flex items-center gap-1.5">
              <IoTrash size={13} /> Delete
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-3 shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_300px]">
          <div className="grid min-h-0 gap-3 xl:grid-rows-[auto,minmax(0,1fr)]">
            <section className="ui-dark-surface ui-shadow shrink-0 overflow-hidden p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Description</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeClasses(issue.issueType)}`}>
                    {issue.issueType}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(issue.status)}`}>
                    {issue.status}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white"
                  placeholder="Add a clear description so the team knows what needs to happen."
                />
              ) : (
                <div className="max-h-24 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-white/80">
                  {issue.description || 'No description has been added for this issue yet.'}
                </div>
              )}
            </section>

            <section className="ui-dark-surface ui-shadow flex min-h-0 flex-col overflow-hidden p-4">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">Comments</h2>
                <span className="text-xs text-white/40">{sortedComments.length} comment{sortedComments.length === 1 ? '' : 's'}</span>
              </div>

              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    Commenting As
                  </div>
                  <div className="mb-3 rounded-xl border border-white/10 bg-[#0d1015] px-3 py-2 text-sm text-white/75">
                    {currentUser?.username || currentUser?.email || 'Signed-in user'}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm leading-6 text-white"
                    placeholder="Add context, share updates, or leave a review note..."
                  />
                  <div className="mt-1.5 flex justify-end gap-2">
                    {newComment && <Button type="button" variant="secondary" size="sm" onClick={() => setNewComment('')}>Clear</Button>}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={busyAction === 'comment-add' || !newComment.trim()}
                    >
                      {busyAction === 'comment-add' ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
                {sortedComments.length > 0 ? (
                  sortedComments.map((comment) => {
                    const isEditingComment =
                      editingTarget.type === 'comment' && editingTarget.commentId === comment._id;
                    const isReplying = replyDraft.commentId === comment._id;

                    return (
                      <div key={comment._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                {comment.author?.username || 'Anonymous'}
                              </p>
                              <span className="text-xs text-white/40">{formatDateTime(comment.updatedAt || comment.createdAt)}</span>
                            </div>

                            {isEditingComment ? (
                              <div className="mt-2">
                                <textarea
                                  value={editingTarget.text}
                                  onChange={(e) => setEditingTarget((current) => ({ ...current, text: e.target.value }))}
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm text-white"
                                />
                                <div className="mt-2 flex gap-2">
                                  <Button variant="primary" size="sm" onClick={handleSaveEditedComment}>
                                    Save
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={resetInlineStates}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/75">{comment.text}</p>
                                <CommentActions
                                  onReply={() => {
                                    setEditingTarget({ type: '', commentId: '', replyId: '', text: '' });
                                    setReplyDraft({ commentId: comment._id, text: '' });
                                  }}
                                  onEdit={() => {
                                    setReplyDraft({ commentId: '', text: '' });
                                    setEditingTarget({ type: 'comment', commentId: comment._id, replyId: '', text: comment.text });
                                  }}
                                  onDelete={() => handleDeleteCommentItem(comment._id)}
                                  canManage={canManageComment(comment.author)}
                                />
                              </>
                            )}

                            {isReplying && (
                              <div className="mt-3 rounded-xl border border-white/10 bg-[#0d1015] p-3">
                                <textarea
                                  value={replyDraft.text}
                                  onChange={(e) => setReplyDraft({ commentId: comment._id, text: e.target.value })}
                                  rows={2}
                                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white"
                                  placeholder="Write a reply..."
                                />
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleReply(comment._id)}
                                    disabled={busyAction === `reply-${comment._id}` || !replyDraft.text.trim()}
                                  >
                                    {busyAction === `reply-${comment._id}` ? 'Replying...' : 'Reply'}
                                  </Button>
                                  <Button type="button" variant="secondary" size="sm" onClick={resetInlineStates}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {comment.replies?.length > 0 && (
                              <div className="mt-3 space-y-2 border-l border-white/10 pl-4">
                                {comment.replies.map((reply) => {
                                  const isEditingReply =
                                    editingTarget.type === 'reply' &&
                                    editingTarget.commentId === comment._id &&
                                    editingTarget.replyId === reply._id;

                                  return (
                                    <div key={reply._id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                      <div className="flex items-center gap-2 text-xs text-white/45">
                                        <IoReturnDownBack size={12} />
                                        <span>{reply.author?.username || 'Anonymous'}</span>
                                        <span>{formatDateTime(reply.updatedAt || reply.createdAt)}</span>
                                      </div>

                                      {isEditingReply ? (
                                        <div className="mt-2">
                                          <textarea
                                            value={editingTarget.text}
                                            onChange={(e) =>
                                              setEditingTarget((current) => ({ ...current, text: e.target.value }))
                                            }
                                            rows={2}
                                            className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm text-white"
                                          />
                                          <div className="mt-2 flex gap-2">
                                            <Button variant="primary" size="sm" onClick={handleSaveEditedComment}>
                                              Save
                                            </Button>
                                            <Button type="button" variant="secondary" size="sm" onClick={resetInlineStates}>
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/75">{reply.text}</p>
                                          <CommentActions
                                            showReply={false}
                                            onReply={() => {}}
                                            onEdit={() => {
                                              setReplyDraft({ commentId: '', text: '' });
                                              setEditingTarget({
                                                type: 'reply',
                                                commentId: comment._id,
                                                replyId: reply._id,
                                                text: reply.text,
                                              });
                                            }}
                                            onDelete={() => handleDeleteCommentItem(comment._id, reply._id)}
                                            canManage={canManageComment(reply.author)}
                                          />
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/40">
                    No comments yet. Add the first update.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="min-h-0 overflow-hidden">
            <section className="ui-dark-surface ui-shadow flex h-full flex-col overflow-hidden p-4">
              <div className="mb-3 shrink-0">
                <h2 className="text-sm font-semibold text-white">Details</h2>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                <DetailRow label="Status">
                  {isEditing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                      className="w-full min-w-[140px]"
                    >
                      {workflowStatusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(issue.status)}`}>
                      {issue.status}
                    </span>
                  )}
                </DetailRow>

                <DetailRow label="Priority">
                  {isEditing ? (
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm((current) => ({ ...current, priority: e.target.value }))}
                      className="w-full min-w-[140px]"
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 text-sm font-semibold ${getPriorityClasses(issue.priority)}`}>
                      <IoFlag size={13} /> {issue.priority}
                    </div>
                  )}
                </DetailRow>

                <DetailRow label="Type">
                  {isEditing ? (
                    <select
                      value={editForm.issueType}
                      onChange={(e) => setEditForm((current) => ({ ...current, issueType: e.target.value }))}
                      className="w-full min-w-[140px]"
                    >
                      {TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeClasses(issue.issueType)}`}>
                      {issue.issueType}
                    </span>
                  )}
                </DetailRow>

                <DetailRow label="Assignee">
                  {isEditing ? (
                    <select
                      value={editForm.assignee}
                      onChange={(e) => setEditForm((current) => ({ ...current, assignee: e.target.value }))}
                      className="w-full min-w-[140px]"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.username}</option>
                      ))}
                    </select>
                  ) : (
                    <PersonValue user={issue.assignee} emptyLabel="No assignee" />
                  )}
                </DetailRow>

                <DetailRow label="Reviewer">
                  {isEditing ? (
                    <select
                      value={editForm.reviewAssignee}
                      onChange={(e) => setEditForm((current) => ({ ...current, reviewAssignee: e.target.value }))}
                      className="w-full min-w-[140px]"
                    >
                      <option value="">No reviewer</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.username}</option>
                      ))}
                    </select>
                  ) : (
                    <PersonValue user={issue.reviewAssignee} emptyLabel="No reviewer" />
                  )}
                </DetailRow>

                <DetailRow label="Reporter">
                  {isEditing ? (
                    <select
                      value={editForm.reporter}
                      onChange={(e) => setEditForm((current) => ({ ...current, reporter: e.target.value }))}
                      className="w-full min-w-[140px]"
                    >
                      <option value="">No reporter</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.username}</option>
                      ))}
                    </select>
                  ) : (
                    <PersonValue user={issue.reporter} emptyLabel="Not set" />
                  )}
                </DetailRow>

                <DetailRow label="Project">
                  <span className="block truncate text-sm font-medium text-white/80">{issue.project?.name || 'No project'}</span>
                </DetailRow>

                <DetailRow label="Workflow">
                  <span className="block truncate text-sm font-medium text-white/80">{issue.project?.workflow?.name || 'No workflow'}</span>
                </DetailRow>

                <DetailRow label="Created">
                  <div className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <IoCalendar size={12} className="text-white/40" /> {formatDateTime(issue.createdAt)}
                  </div>
                </DetailRow>

                <DetailRow label="Updated">
                  <div className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <IoCalendar size={12} className="text-white/40" /> {formatDateTime(issue.updatedAt)}
                  </div>
                </DetailRow>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IssueDetail;
