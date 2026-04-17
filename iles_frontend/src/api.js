import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust for your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  register: (userData) => api.post('/register/', userData),
  getProfile: () => api.get('/profile/'),
  updateProfile: (data) => api.put('/profile/', data),
  changePassword: (data) => api.put('/change-password/', data),
};

export const logsAPI = {
  getLogs: () => api.get('/logs/'),
  createLog: (data) => api.post('/logs/', data),
  getLog: (id) => api.get(`/logs/${id}/`),
  updateLog: (id, data) => api.put(`/logs/${id}/`, data),
  deleteLog: (id) => api.delete(`/logs/${id}/`),
  reviewLog: (id, data) => api.put(`/logs/${id}/review/`, data),
  approveLog: (id, data) => api.put(`/logs/${id}/approve/`, data),
};

export const placementsAPI = {
  getPlacements: () => api.get('/placements/'),
  createPlacement: (data) => api.post('/placements/', data),
  getPlacement: (id) => api.get(`/placements/${id}/`),
  updatePlacement: (id, data) => api.put(`/placements/${id}/`, data),
  deletePlacement: (id) => api.delete(`/placements/${id}/`),
};

export const evaluationsAPI = {
  getEvaluations: () => api.get('/evaluations/'),
  createEvaluation: (data) => api.post('/evaluations/', data),
  getEvaluation: (id) => api.get(`/evaluations/${id}/`),
  updateEvaluation: (id, data) => api.put(`/evaluations/${id}/`, data),
};

export default api;
