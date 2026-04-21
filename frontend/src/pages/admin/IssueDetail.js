import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IoArrowBack,
  IoCalendar,
  IoCheckmark,
  IoFlag,
  IoPencil,
  IoTrash,
} from 'react-icons/io5';
import AdminLayout from '../../layouts/AdminLayout';
import { Breadcrumb, Button } from '../../components/common';
import {
  addComment,
  deleteIssue,
  getIssueById,
  getUsers,
  updateIssue,
} from '../../services/api';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const TYPE_OPTIONS = ['Task', 'Bug', 'Feature', 'Improvement'];

const getInitial = (user) => (user?.username?.[0] || '?').toUpperCase();

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
    case 'Critical': return 'text-red-300';
    case 'High':     return 'text-orange-300';
    case 'Medium':   return 'text-amber-300';
    default:         return 'text-sky-300';
  }
};

const getTypeClasses = (type) => {
  switch (type) {
    case 'Bug':         return 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/20';
    case 'Feature':     return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20';
    case 'Improvement': return 'bg-amber-500/20 text-amber-200 border border-amber-500/20';
    default:            return 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/20';
  }
};

const createEditForm = (issueData) => ({
  title:          issueData?.title          || '',
  description:    issueData?.description    || '',
  status:         issueData?.status         || 'To Do',
  priority:       issueData?.priority       || 'Medium',
  issueType:      issueData?.issueType      || 'Task',
  assignee:       issueData?.assignee?._id  || '',
  reviewAssignee: issueData?.reviewAssignee?._id || '',
  reporter:       issueData?.reporter?._id  || '',
});

const getPreferredCommentAuthor = (issueData, usersData) =>
  issueData?.reporter?._id ||
  issueData?.assignee?._id ||
  issueData?.reviewAssignee?._id ||
  usersData?.[0]?._id ||
  '';

const UserChip = ({ user, emptyLabel = 'Not assigned' }) => {
  if (!user) return <p className="text-sm text-white/40">{emptyLabel}</p>;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1b4ed8] text-xs font-semibold text-white">
        {getInitial(user)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{user.username}</p>
        <p className="truncate text-xs text-white/45">{user.email}</p>
      </div>
    </div>
  );
};

// Inline detail row: label on left, value on right
const DetailRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40 shrink-0">{label}</p>
    <div className="flex justify-end">{children}</div>
  </div>
);

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue]                         = useState(null);
  const [users, setUsers]                         = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState('');
  const [isEditing, setIsEditing]                 = useState(false);
  const [isSaving, setIsSaving]                   = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editForm, setEditForm]                   = useState(createEditForm(null));
  const [newComment, setNewComment]               = useState('');
  const [commentAuthorId, setCommentAuthorId]     = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [issueData, usersData] = await Promise.all([getIssueById(id), getUsers()]);
      setIssue(issueData);
      setUsers(usersData);
      setEditForm(createEditForm(issueData));
      setCommentAuthorId((cur) => cur || getPreferredCommentAuthor(issueData, usersData));
      setError('');
    } catch (err) {
      setError('Failed to load issue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedComments = useMemo(() =>
    [...(issue?.comments || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    ),
  [issue]);

  const applyIssueUpdate = (updatedIssue) => {
    setIssue(updatedIssue);
    setEditForm(createEditForm(updatedIssue));
    setCommentAuthorId((cur) => cur || getPreferredCommentAuthor(updatedIssue, users));
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      const response = await updateIssue(id, {
        title:          editForm.title,
        description:    editForm.description,
        status:         editForm.status,
        priority:       editForm.priority,
        issueType:      editForm.issueType,
        assignee:       editForm.assignee       || null,
        reviewAssignee: editForm.reviewAssignee || null,
        reporter:       editForm.reporter       || null,
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

  const handleCancelEdit = () => {
    setEditForm(createEditForm(issue));
    setIsEditing(false);
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
      setIsSubmittingComment(true);
      const response = await addComment(id, {
        text:   newComment.trim(),
        author: commentAuthorId || null,
      });
      applyIssueUpdate(response.issue || response);
      setNewComment('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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

  return (
    <AdminLayout>
      {/* Full-height container, no page-level scroll — children scroll internally */}
      <div className="-mx-3 ui-dark-page px-3 py-3 md:-mx-5 md:px-5 md:py-4 flex flex-col" style={{ height: 'calc(100vh - 104px)', overflow: 'hidden' }}>

        {/* ── Top bar: Back + Title + Actions ── */}
        <div className="ui-dark-surface-strong ui-shadow mb-3 flex items-center gap-3 px-4 py-2.5 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white shrink-0"
          >
            <IoArrowBack size={15} /> Back
          </button>

          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((cur) => ({ ...cur, title: e.target.value }))}
              className="flex-1 min-w-0 border-0 bg-transparent p-0 text-lg font-bold text-white focus:ring-0"
              placeholder="Issue title"
            />
          ) : (
            <h1 className="flex-1 min-w-0 truncate text-lg font-bold tracking-tight text-white">
              {issue.title}
            </h1>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editForm.title.trim()}
                  className="flex items-center gap-1.5"
                >
                  <IoCheckmark size={14} />
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
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
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteIssue}
              className="flex items-center gap-1.5"
            >
              <IoTrash size={13} /> Delete
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-3 shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid gap-3 flex-1 min-h-0 xl:grid-cols-[minmax(0,1.55fr)_300px]">

          {/* Left column */}
          <div className="grid gap-3 min-h-0 xl:grid-rows-[auto,minmax(0,1fr)]">

            {/* Description */}
            <section className="ui-dark-surface ui-shadow overflow-hidden p-4 shrink-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Description</h2>
              </div>

              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((cur) => ({ ...cur, description: e.target.value }))}
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

            {/* Comments */}
            <section className="ui-dark-surface ui-shadow flex min-h-0 flex-col overflow-hidden p-4">
              <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
                <h2 className="text-sm font-semibold text-white">Comments</h2>
                <span className="text-xs text-white/40">{sortedComments.length} comment{sortedComments.length === 1 ? '' : 's'}</span>
              </div>

              {/* Composer */}
              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                      Comment As
                    </label>
                    <select
                      value={commentAuthorId}
                      onChange={(e) => setCommentAuthorId(e.target.value)}
                      className="w-full"
                    >
                      <option value="">Anonymous</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm leading-6 text-white"
                      placeholder="Add context, share updates, or leave a review note..."
                    />
                    <div className="mt-1.5 flex justify-end gap-2">
                      {newComment && (
                        <Button variant="secondary" size="sm" onClick={() => setNewComment('')}>Clear</Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={isSubmittingComment || !newComment.trim()}
                      >
                        {isSubmittingComment ? 'Posting…' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment list — scrollable */}
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto space-y-2.5 pr-1">
                {sortedComments.length > 0 ? (
                  sortedComments.map((comment) => (
                    <div
                      key={comment._id || `${comment.createdAt}-${comment.text}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1b4ed8] text-sm font-semibold text-white">
                          {getInitial(comment.author)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {comment.author?.username || 'Anonymous'}
                            </p>
                            <span className="text-xs text-white/40">{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/75">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/40">
                    No comments yet. Add the first update.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column — Details */}
          <div className="min-h-0 overflow-hidden">
            <section className="ui-dark-surface ui-shadow h-full overflow-hidden p-4 flex flex-col">
              <div className="mb-3 shrink-0">
                <h2 className="text-sm font-semibold text-white">Details</h2>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
                {/* Status */}
                <DetailRow label="Status">
                  {isEditing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((cur) => ({ ...cur, status: e.target.value }))}
                      className="w-full"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(issue.status)}`}>
                      {issue.status}
                    </span>
                  )}
                </DetailRow>

                {/* Priority */}
                <DetailRow label="Priority">
                  {isEditing ? (
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm((cur) => ({ ...cur, priority: e.target.value }))}
                      className="w-full"
                    >
                      {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${getPriorityClasses(issue.priority)}`}>
                      <IoFlag size={13} />
                      {issue.priority}
                    </div>
                  )}
                </DetailRow>

                {/* Issue Type */}
                <DetailRow label="Type">
                  {isEditing ? (
                    <select
                      value={editForm.issueType}
                      onChange={(e) => setEditForm((cur) => ({ ...cur, issueType: e.target.value }))}
                      className="w-full"
                    >
                      {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeClasses(issue.issueType)}`}>
                      {issue.issueType}
                    </span>
                  )}
                </DetailRow>

                {/* Assignee */}
                <DetailRow label="Assignee">
                  {isEditing ? (
                    <select
                      value={editForm.assignee}
                      onChange={(e) => setEditForm((cur) => ({ ...cur, assignee: e.target.value }))}
                      className="w-full"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => <option key={u._id} value={u._id}>{u.username}</option>)}
                    </select>
                  ) : (
                    <UserChip user={issue.assignee} emptyLabel="No assignee" />
                  )}
                </DetailRow>

                {/* Review Assignee */}
                <DetailRow label="Reviewer">
                  {isEditing ? (
                    <select
                      value={editForm.reviewAssignee}
                      onChange={(e) => setEditForm((cur) => ({ ...cur, reviewAssignee: e.target.value }))}
                      className="w-full"
                    >
                      <option value="">No reviewer</option>
                      {users.map((u) => <option key={u._id} value={u._id}>{u.username}</option>)}
                    </select>
                  ) : (
                    <UserChip user={issue.reviewAssignee} emptyLabel="No reviewer" />
                  )}
                </DetailRow>

                {/* Reporter */}
                <DetailRow label="Reporter">
                  {isEditing ? (
                    <select
                      value={editForm.reporter}
                      onChange={(e) => setEditForm((cur) => ({ ...cur, reporter: e.target.value }))}
                      className="w-full"
                    >
                      <option value="">No reporter</option>
                      {users.map((u) => <option key={u._id} value={u._id}>{u.username}</option>)}
                    </select>
                  ) : (
                    <UserChip user={issue.reporter} emptyLabel="Not set" />
                  )}
                </DetailRow>

                {/* Created */}
                <DetailRow label="Created">
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <IoCalendar size={12} className="text-white/40" />
                    {formatDateTime(issue.createdAt)}
                  </div>
                </DetailRow>

                {/* Updated */}
                <DetailRow label="Updated">
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <IoCalendar size={12} className="text-white/40" />
                    {formatDateTime(issue.updatedAt)}
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