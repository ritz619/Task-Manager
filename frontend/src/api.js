import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('tf_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  signup: d => api.post('/auth/signup', d),
  login: d => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  users: () => api.get('/auth/users'),
};

export const projects = {
  list: () => api.get('/projects'),
  get: id => api.get(`/projects/${id}`),
  create: d => api.post('/projects', d),
  update: (id, d) => api.patch(`/projects/${id}`, d),
  delete: id => api.delete(`/projects/${id}`),
  addMember: (id, d) => api.post(`/projects/${id}/members`, d),
  removeMember: (id, uid) => api.delete(`/projects/${id}/members/${uid}`),
};

export const tasks = {
  list: params => api.get('/tasks', { params }),
  dashboard: () => api.get('/tasks/dashboard'),
  get: id => api.get(`/tasks/${id}`),
  create: d => api.post('/tasks', d),
  update: (id, d) => api.patch(`/tasks/${id}`, d),
  delete: id => api.delete(`/tasks/${id}`),
  comment: (id, d) => api.post(`/tasks/${id}/comments`, d),
};

export default api;
