import { env } from '../config/env';

const API_URL = env.apiUrl;
const TOKEN_KEY = 'jira_auth_token';
const USER_KEY = 'jira_auth_user';

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

export const storeAuthSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(url, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.error || 'API call failed');
  }

  return data;
};

export const loginUser = (data) =>
  apiCall('/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getCurrentUser = () => apiCall('/users/me');

export const createUser = (data) =>
  apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getUsers = () => apiCall('/users');
export const getUserById = (id) => apiCall(`/users/${id}`);
export const updateUser = (id, data) =>
  apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const updateUserPasswordByEmail = (data) =>
  apiCall('/users/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteUser = (id) =>
  apiCall(`/users/${id}`, { method: 'DELETE' });

export const createWorkflow = (data) =>
  apiCall('/workflows', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getWorkflows = () => apiCall('/workflows');
export const getWorkflowById = (id) => apiCall(`/workflows/${id}`);
export const updateWorkflow = (id, data) =>
  apiCall(`/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteWorkflow = (id) =>
  apiCall(`/workflows/${id}`, { method: 'DELETE' });

export const addStateToWorkflow = (id, data) =>
  apiCall(`/workflows/${id}/states`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const removeStateFromWorkflow = (id, data) =>
  apiCall(`/workflows/${id}/states`, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });

export const createGlobalState = (data) =>
  apiCall('/states', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getGlobalStates = () => apiCall('/states');
export const getGlobalStateById = (id) => apiCall(`/states/${id}`);
export const updateGlobalState = (id, data) =>
  apiCall(`/states/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteGlobalState = (id) =>
  apiCall(`/states/${id}`, { method: 'DELETE' });

export const createIssue = (data) =>
  apiCall('/issues', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getIssues = (filters = '') => apiCall(`/issues${filters}`);
export const getIssueById = (id) => apiCall(`/issues/${id}`);
export const updateIssue = (id, data) =>
  apiCall(`/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteIssue = (id) =>
  apiCall(`/issues/${id}`, { method: 'DELETE' });

export const createProject = (data) =>
  apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getProjects = () => apiCall('/projects');
export const getProjectById = (id) => apiCall(`/projects/${id}`);
export const updateProject = (id, data) =>
  apiCall(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteProject = (id) =>
  apiCall(`/projects/${id}`, { method: 'DELETE' });

export const addComment = (id, data) =>
  apiCall(`/issues/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateComment = (issueId, commentId, data) =>
  apiCall(`/issues/${issueId}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteComment = (issueId, commentId) =>
  apiCall(`/issues/${issueId}/comments/${commentId}`, {
    method: 'DELETE',
  });

export const addReply = (issueId, commentId, data) =>
  apiCall(`/issues/${issueId}/comments/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const addAttachment = (issueId, data) =>
  apiCall(`/issues/${issueId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteAttachment = (issueId, attachmentId) =>
  apiCall(`/issues/${issueId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });

export const updateReply = (issueId, commentId, replyId, data) =>
  apiCall(`/issues/${issueId}/comments/${commentId}/replies/${replyId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteReply = (issueId, commentId, replyId) =>
  apiCall(`/issues/${issueId}/comments/${commentId}/replies/${replyId}`, {
    method: 'DELETE',
  });

export const getPushPublicKey = () => apiCall('/push/vapid-public-key');

export const savePushSubscription = (data) =>
  apiCall('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getNotifications = (limit = 50) =>
  apiCall(`/notifications?limit=${limit}`);

export const getUnreadNotificationCount = () =>
  apiCall('/notifications/unread-count');

export const markNotificationAsRead = (id) =>
  apiCall(`/notifications/mark-read/${id}`, {
    method: 'POST',
  });

export const markAllNotificationsAsRead = () =>
  apiCall('/notifications/mark-all-read', {
    method: 'POST',
  });

export const getNotificationPreferences = () =>
  apiCall('/notifications/preferences');

export const updateNotificationPreferences = (notificationSettings) =>
  apiCall('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ notificationSettings }),
  });

export const createLearnArticle = (data) =>
  apiCall('/learn', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getLearnArticles = (search = '') =>
  apiCall(`/learn${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getLearnArticleById = (id) => apiCall(`/learn/${id}`);

export const updateLearnArticle = (id, data) =>
  apiCall(`/learn/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteLearnArticle = (id) =>
  apiCall(`/learn/${id}`, {
    method: 'DELETE',
  });
