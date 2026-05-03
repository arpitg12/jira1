import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IoArrowBack,
  IoAttach,
  IoCalendar,
  IoCheckmark,
  IoDocumentText,
  IoFlag,
  IoImage,
  IoPencil,
  IoReturnDownBack,
  IoTimeOutline,
  IoTrash,
} from 'react-icons/io5';
import AdminLayout from '../../layouts/AdminLayout';
import { Button, SearchableUserMultiSelect } from '../../components/common';
import { MentionTextarea } from '../../components/common/MentionTextarea';
import { useAuth } from '../../context/AuthContext';
import {
  addAttachment,
  addComment,
  addReply,
  deleteAttachment,
  deleteComment,
  deleteIssue,
  deleteReply,
  getIssueById,
  getUsers,
  updateComment,
  updateIssue,
  updateReply,
} from '../../services/api';
import { env } from '../../config/env';

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

const formatFileSize = (size = 0) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'Done':
      return 'issue-pill issue-pill--status-done';
    case 'In Progress':
      return 'issue-pill issue-pill--status-progress';
    case 'In Review':
      return 'issue-pill issue-pill--status-review';
    default:
      return 'issue-pill issue-pill--status-default';
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
      return 'issue-pill issue-pill--type-bug';
    case 'Feature':
      return 'issue-pill issue-pill--type-feature';
    case 'Improvement':
      return 'issue-pill issue-pill--type-improvement';
    default:
      return 'issue-pill issue-pill--type-task';
  }
};

const normalizeUsers = (userList) => {
  const map = new Map();
  [...(Array.isArray(userList) ? userList : [])]
    .filter(Boolean)
    .forEach((user) => map.set(user._id, user));

  return [...map.values()];
};

const createEditForm = (issueData) => ({
  title: issueData?.title || '',
  description: issueData?.description || '',
  status: issueData?.status || 'To Do',
  priority: issueData?.priority || 'Medium',
  issueType: issueData?.issueType || 'Task',
  assignees: normalizeUsers(issueData?.assignees).map((user) => user._id),
  reviewAssignees: normalizeUsers(issueData?.reviewAssignees).map((user) => user._id),
});

const getInitials = (username = '') =>
  username.slice(0, 2).toUpperCase();

const UserPills = ({ users = [], emptyLabel = 'Not set' }) => {
  if (users.length === 0) {
    return <span className="text-sm text-white/40">{emptyLabel}</span>;
  }
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {users.map((user) => (
        <span
          key={user._id}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/80"
          title={user.username}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/15 text-[9px] font-bold text-white/90">
            {getInitials(user.username)}
          </span>
          <span className="max-w-[80px] truncate">{user.username}</span>
        </span>
      ))}
    </div>
  );
};

const getAttachmentUrl = (url) => (url?.startsWith('http') ? url : `${env.uploadsBaseUrl}${url}`);
const isImageAttachment = (attachment) => attachment?.mimeType?.startsWith('image/');

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const renderTextWithMentions = (text) => {
  const parts = String(text || '').split(/(@[a-zA-Z0-9._-]+)/g);
  return parts.map((part, index) =>
    /^@[a-zA-Z0-9._-]+$/.test(part) ? (
      <span key={`${part}-${index}`} className="font-semibold text-sky-300">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
};

// ── Reusable section label (replaces old bold h2 inside each card) ──────────
const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{children}</p>
);

const DetailRow = ({ label, children, wrap = false }) => (
  <div
    className={`rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 ${
      wrap
        ? 'flex flex-col items-start gap-3'
        : 'flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between'
    }`}
  >
    <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{label}</p>
    <div className={wrap ? 'w-full' : 'w-full sm:min-w-0 sm:text-right'}>{children}</div>
  </div>
);

const OverviewStat = ({ label, value, hint = '', valueClassName = 'text-white' }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
    <div className={`mt-2 text-sm font-semibold ${valueClassName}`}>{value}</div>
    {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
  </div>
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

const HistoryBlock = ({ item, historyKey, expandedHistory, setExpandedHistory }) => {
  const history = item?.editHistory || [];
  const isExpanded = expandedHistory.includes(historyKey);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-xs text-white/45 hover:text-white"
        onClick={() =>
          setExpandedHistory((current) =>
            current.includes(historyKey)
              ? current.filter((entry) => entry !== historyKey)
              : [...current, historyKey]
          )
        }
      >
        {isExpanded ? 'Hide history' : `View history (${history.length})`}
      </button>
      {isExpanded && (
        <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          {history
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry._id} className="rounded-lg border border-white/5 bg-black/10 p-2">
                <div className="mb-1 flex items-center gap-2 text-[11px] text-white/45">
                  <IoTimeOutline size={12} />
                  <span>{formatDateTime(entry.editedAt)}</span>
                  <span>{entry.editedBy?.username || 'Unknown user'}</span>
                </div>
                <p className="whitespace-pre-wrap text-xs leading-6 text-white/65">{entry.text}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  const [issue, setIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editForm, setEditForm] = useState(createEditForm(null));
  const [replyDraft, setReplyDraft] = useState({ commentId: '', text: '' });
  const [editingTarget, setEditingTarget] = useState({ type: '', commentId: '', replyId: '', text: '' });
  const [busyAction, setBusyAction] = useState('');
  const [expandedHistory, setExpandedHistory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [issueData, usersData] = await Promise.all([getIssueById(id), getUsers()]);
      setIssue(issueData);
      setUsers(usersData || []);
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
    () => [...(issue?.comments || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [issue]
  );

  const currentAssignees = useMemo(() => normalizeUsers(issue?.assignees), [issue]);
  const currentReviewers = useMemo(() => normalizeUsers(issue?.reviewAssignees), [issue]);

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
        assignees: editForm.assignees,
        reviewAssignees: editForm.reviewAssignees,
      });
      applyIssueUpdate(response.issue || response);
      setIsEditing(false);
      setIsEditingDescription(false);
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

  const handleSaveDescription = async () => {
    try {
      setIsSavingDescription(true);
      const response = await updateIssue(id, {
        description: editForm.description,
      });
      applyIssueUpdate(response.issue || response);
      setIsEditingDescription(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update description');
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleCancelDescriptionEdit = () => {
    setEditForm((current) => ({ ...current, description: issue?.description || '' }));
    setIsEditingDescription(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setBusyAction('comment-add');
      const response = await addComment(id, { text: newComment.trim() });
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
      const response = await addReply(id, commentId, { text: replyDraft.text.trim() });
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

  const handleAttachmentUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      let latestResponse = null;

      for (const file of files) {
        const content = await readFileAsDataUrl(file);
        latestResponse = await addAttachment(id, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          content,
        });
      }

      if (latestResponse) {
        applyIssueUpdate(latestResponse.issue || latestResponse);
      }

      setError('');
      event.target.value = '';
    } catch (err) {
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      setBusyAction(`attachment-delete-${attachmentId}`);
      const response = await deleteAttachment(id, attachmentId);
      applyIssueUpdate(response.issue || response);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete attachment');
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

  const canManageComment = (author) => isAdmin || String(author?._id || author) === String(currentUser?._id);

  return (
    <AdminLayout>
      <div className="-mx-3 min-h-[calc(100vh-104px)] ui-dark-page px-3 py-3 md:-mx-5 md:px-5 md:py-4">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="ui-dark-surface-strong ui-shadow mb-4 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <IoArrowBack size={15} /> Back
              </button>

              <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{issue.issueId}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  {issue.project?.name || 'No project'}
                </span>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((current) => ({ ...current, title: e.target.value }))}
                  className="mt-3 w-full border-0 bg-transparent p-0 text-xl font-bold text-white focus:ring-0"
                  placeholder="Issue title"
                />
              ) : (
                <h1 className="mt-3 text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                  {issue.title}
                </h1>
              )}

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Review details, update ownership, and keep the conversation moving without fighting the layout.
              </p>
            </div>

            <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
              {isEditing ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveIssue}
                    disabled={isSaving || !editForm.title.trim()}
                    className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
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
                    className="flex-1 justify-center sm:flex-none"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsEditingDescription(false);
                    setIsEditing(true);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
                >
                  <IoPencil size={13} /> Edit
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteIssue}
                className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
              >
                <IoTrash size={13} /> Delete
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* ── Main two-column layout ───────────────────────────────────────── */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_340px]">

          {/* ── LEFT: single unified card, fully scrollable ─────────────────── */}
          <div className="order-2 xl:order-1">
            <div className="ui-dark-surface ui-shadow overflow-visible">

              {/* ── Description ─────────────────────────────────────────────── */}
              <section className="p-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionLabel>Description</SectionLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isEditing && (
                      isEditingDescription ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveDescription}
                            disabled={isSavingDescription}
                            className="flex items-center gap-1.5"
                          >
                            <IoCheckmark size={14} />
                            {isSavingDescription ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCancelDescriptionEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsEditingDescription(true)}
                          className="flex items-center gap-1.5"
                        >
                          <IoPencil size={13} /> Edit Description
                        </Button>
                      )
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeClasses(issue.issueType)}`}>
                      {issue.issueType}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>

                {isEditing || isEditingDescription ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white"
                    placeholder="Add a clear description so the team knows what needs to happen."
                  />
                ) : (
                  <p className="text-sm leading-6 text-white/75 whitespace-pre-wrap">
                    {issue.description || (
                      <span className="text-white/35 italic">No description has been added for this issue yet.</span>
                    )}
                  </p>
                )}
              </section>

              {/* ── Divider ─────────────────────────────────────────────────── */}
              <div className="border-t border-white/[0.06]" />

              {/* ── Attachments ─────────────────────────────────────────────── */}
              <section className="p-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionLabel>Attachments</SectionLabel>
                    <p className="mt-1 text-xs text-white/30">Images, logs, PDFs, screenshots</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75 hover:bg-white/10 hover:text-white">
                    <IoAttach size={14} />
                    {isUploading ? 'Uploading...' : 'Upload files'}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAttachmentUpload}
                      disabled={isUploading}
                      accept="image/*,.pdf,.log,.txt,.json"
                    />
                  </label>
                </div>

                {issue.attachments?.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {issue.attachments.map((attachment) => (
                      <div
                        key={attachment._id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                      >
                        <div className="flex items-start gap-3">
                          <a
                            href={getAttachmentUrl(attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-w-0 flex-1 items-start gap-3"
                          >
                            <div className="rounded-lg border border-white/10 bg-[#0d1015] p-2 text-white/70">
                              {isImageAttachment(attachment) ? <IoImage size={16} /> : <IoDocumentText size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">{attachment.name}</p>
                              <p className="mt-1 text-xs text-white/45">
                                {formatFileSize(attachment.size)} • {formatDateTime(attachment.uploadedAt)}
                              </p>
                              <p className="mt-1 text-xs text-white/35">
                                Uploaded by {attachment.uploadedBy?.username || 'Unknown'}
                              </p>
                            </div>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(attachment._id)}
                            disabled={busyAction === `attachment-delete-${attachment._id}`}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Delete attachment"
                          >
                            <IoTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/40">
                    No attachments yet.
                  </div>
                )}
              </section>

              {/* ── Divider ─────────────────────────────────────────────────── */}
              <div className="border-t border-white/[0.06]" />

              {/* ── Comments ────────────────────────────────────────────────── */}
              <section className="p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <SectionLabel>Comments</SectionLabel>
                  <span className="text-xs text-white/30">
                    {sortedComments.length} comment{sortedComments.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Comment composer */}
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 overflow-visible">
                  {/* <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    Commenting As
                  </div> */}
                  {/* <div className="mb-3 rounded-xl border border-white/10 bg-[#0d1015] px-3 py-2 text-sm text-white/75">
                    {currentUser?.username || currentUser?.email || 'Signed-in user'}
                  </div> */}
                  <MentionTextarea
                    value={newComment}
                    onChange={setNewComment}
                    users={users}
                    currentUserId={currentUser?._id}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm leading-6 text-white"
                    placeholder="Add context, share updates, or mention someone with @username..."
                  />
                  <div className="mt-1.5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {newComment && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => setNewComment('')}>
                        Clear
                      </Button>
                    )}
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

                {/* Comment list */}
                <div className="space-y-2.5">
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
                                {comment.editHistory?.length > 0 && (
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                                    Edited
                                  </span>
                                )}
                              </div>

                              {isEditingComment ? (
                                <div className="mt-2">
                                  <MentionTextarea
                                    value={editingTarget.text}
                                    onChange={(text) => setEditingTarget((current) => ({ ...current, text }))}
                                    users={users}
                                    currentUserId={currentUser?._id}
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm text-white"
                                  />
                                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
                                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/75">
                                    {renderTextWithMentions(comment.text)}
                                  </p>
                                  <HistoryBlock
                                    item={comment}
                                    historyKey={`comment-${comment._id}`}
                                    expandedHistory={expandedHistory}
                                    setExpandedHistory={setExpandedHistory}
                                  />
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
                                  <MentionTextarea
                                    value={replyDraft.text}
                                    onChange={(text) => setReplyDraft({ commentId: comment._id, text })}
                                    users={users}
                                    currentUserId={currentUser?._id}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white"
                                    placeholder="Write a reply and use @username if needed..."
                                  />
                                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
                                <div className="mt-3 space-y-2 border-l border-white/10 pl-3 sm:pl-4">
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
                                          {reply.editHistory?.length > 0 && <span>edited</span>}
                                        </div>

                                        {isEditingReply ? (
                                          <div className="mt-2">
                                            <MentionTextarea
                                              value={editingTarget.text}
                                              onChange={(text) => setEditingTarget((current) => ({ ...current, text }))}
                                              users={users}
                                              currentUserId={currentUser?._id}
                                              rows={2}
                                              className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1015] p-3 text-sm text-white"
                                            />
                                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
                                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/75">
                                              {renderTextWithMentions(reply.text)}
                                            </p>
                                            <HistoryBlock
                                              item={reply}
                                              historyKey={`reply-${reply._id}`}
                                              expandedHistory={expandedHistory}
                                              setExpandedHistory={setExpandedHistory}
                                            />
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
          </div>

          {/* ── RIGHT: Details sidebar ───────────────────────────────────────── */}
          <div className="order-1 xl:order-2 xl:sticky xl:top-4 xl:self-start">
            <section className="ui-dark-surface ui-shadow p-4 sm:p-5 xl:max-h-[calc(100vh-136px)] xl:overflow-y-auto">
              <div className="mb-3 shrink-0">
                <h2 className="text-sm font-semibold text-white">Overview</h2>
                <p className="mt-1 text-xs text-white/40">Everything important at a glance.</p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <OverviewStat
                  label="Status"
                  value={
                    isEditing ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                        className="w-full min-w-0"
                      >
                        {workflowStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(issue.status)}`}>
                        {issue.status}
                      </span>
                    )
                  }
                />
                <OverviewStat
                  label="Priority"
                  value={
                    isEditing ? (
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm((current) => ({ ...current, priority: e.target.value }))}
                        className="w-full min-w-0"
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    ) : (
                      <div className={`inline-flex items-center gap-1.5 ${getPriorityClasses(issue.priority)}`}>
                        <IoFlag size={13} /> {issue.priority}
                      </div>
                    )
                  }
                />
              </div>

              <div className="space-y-2">
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

                <DetailRow label="Assignees" wrap>
                  {isEditing ? (
                    <SearchableUserMultiSelect
                      users={users}
                      selectedIds={editForm.assignees}
                      onChange={(nextValue) => setEditForm((current) => ({ ...current, assignees: nextValue }))}
                      emptyLabel="No users available"
                      placeholder="Select assignees"
                    />
                  ) : (
                    <UserPills users={currentAssignees} emptyLabel="No assignees" />
                  )}
                </DetailRow>

                <DetailRow label="Reviewers" wrap>
                  {isEditing ? (
                    <SearchableUserMultiSelect
                      users={users}
                      selectedIds={editForm.reviewAssignees}
                      onChange={(nextValue) => setEditForm((current) => ({ ...current, reviewAssignees: nextValue }))}
                      emptyLabel="No users available"
                      placeholder="Select reviewers"
                    />
                  ) : (
                    <UserPills users={currentReviewers} emptyLabel="No reviewers" />
                  )}
                </DetailRow>

                <DetailRow label="Reporter">
                  <span className="block truncate text-sm font-medium text-white/80">
                    {issue.reporter?.username || 'Not set'}
                  </span>
                </DetailRow>

                <DetailRow label="Project">
                  <span className="block truncate text-sm font-medium text-white/80">{issue.project?.name || 'No project'}</span>
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
