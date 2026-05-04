import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust for your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
});

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

let refreshPromise = null;

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.error) {
    return data.error;
  }

  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return firstValue[0];
    }
  }

  return fallback;
};

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = getRefreshToken();

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/token/')
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/token/refresh/', { refresh: refreshToken })
            .then((response) => {
              localStorage.setItem('access_token', response.data.access);
              return response.data.access;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      clearSession();
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
  changePassword: (data) => api.post('/change-password/', data),
};

export const logsAPI = {
  getLogs: () => api.get('/logs/'),
  createLog: (data) => api.post('/logs/', data),
  getLog: (id) => api.get(`/logs/${id}/`),
  updateLog: (id, data) => api.put(`/logs/${id}/`, data),
  deleteLog: (id) => api.delete(`/logs/${id}/`),
  reviewLog: (id, data) => api.put(`/logs/${id}/review/`, data),
  approveLog: (id, data) => api.put(`/logs/${id}/approve/`, data),
  reviseLog: (id, data) => api.put(`/logs/${id}/revise/`, data),
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

export const criteriaAPI = {
  getCriteria: () => api.get('/criteria/'),
};

export const adminAPI = {
  getStatistics: () => api.get('/admin/statistics/'),
  getUsers: (params) => api.get('/users/', { params }),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications/', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read/`),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
};

export default api;
