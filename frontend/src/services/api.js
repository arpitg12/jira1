const API_URL = 'http://localhost:5000/api';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return await response.json();
};

// User APIs
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
export const deleteUser = (id) =>
  apiCall(`/users/${id}`, { method: 'DELETE' });

// Workflow APIs
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

// Global State APIs
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

// Issue APIs
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

// Project APIs
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

export const updateReply = (issueId, commentId, replyId, data) =>
  apiCall(`/issues/${issueId}/comments/${commentId}/replies/${replyId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteReply = (issueId, commentId, replyId) =>
  apiCall(`/issues/${issueId}/comments/${commentId}/replies/${replyId}`, {
    method: 'DELETE',
  });
