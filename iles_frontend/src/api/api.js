
import axios from 'axios';
const API_BASE_URL = 'http://localhost:8000/api'; // Adjust for your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
});

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

let refreshPromise = null;
const requestCache = new Map();

const clearRequestCache = () => {
  requestCache.clear();
};

const cacheKey = (url, params) => `${url}::${JSON.stringify(params ?? null)}`;

const getCachedRequest = (url, { params, ttl = 30000 } = {}) => {
  const key = cacheKey(url, params);
  const cached = requestCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = api.get(url, { params }).catch((error) => {
    requestCache.delete(key);
    throw error;
  });

  requestCache.set(key, {
    expiresAt: Date.now() + ttl,
    promise,
  });

  return promise;
};

const invalidateCacheByPrefix = (...prefixes) => {
  if (prefixes.length === 0) {
    clearRequestCache();
    return;
  }

  Array.from(requestCache.keys()).forEach((key) => {
    if (prefixes.some((prefix) => key.startsWith(`${prefix}::`))) {
      requestCache.delete(key);
    }
  });
};

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  clearRequestCache();
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
  getLogs: () => getCachedRequest('/logs/', { ttl: 15000 }),
  createLog: (data) => api.post('/logs/', data).then((response) => {
    invalidateCacheByPrefix('/logs/');
    return response;
  }),
  getLog: (id) => getCachedRequest(`/logs/${id}/`, { ttl: 15000 }),
  updateLog: (id, data) => api.put(`/logs/${id}/`, data).then((response) => {
    invalidateCacheByPrefix('/logs/');
    return response;
  }),
  deleteLog: (id) => api.delete(`/logs/${id}/`).then((response) => {
    invalidateCacheByPrefix('/logs/');
    return response;
  }),
  reviewLog: (id, data) => api.put(`/logs/${id}/review/`, data).then((response) => {
    invalidateCacheByPrefix('/logs/');
    return response;
  }),
  approveLog: (id, data) => api.put(`/logs/${id}/approve/`, data).then((response) => {
    invalidateCacheByPrefix('/logs/');
    return response;
  }),
  reviseLog: (id, data) => api.put(`/logs/${id}/revise/`, data).then((response) => {
    invalidateCacheByPrefix('/logs/');
    return response;
  }),
};

export const placementsAPI = {
  getPlacements: () => getCachedRequest('/placements/', { ttl: 30000 }),
  createPlacement: (data) => api.post('/placements/', data).then((response) => {
    invalidateCacheByPrefix('/placements/');
    return response;
  }),
  getPlacement: (id) => getCachedRequest(`/placements/${id}/`, { ttl: 30000 }),
  updatePlacement: (id, data) => api.put(`/placements/${id}/`, data).then((response) => {
    invalidateCacheByPrefix('/placements/');
    return response;
  }),
  deletePlacement: (id) => api.delete(`/placements/${id}/`).then((response) => {
    invalidateCacheByPrefix('/placements/');
    return response;
  }),
};

export const evaluationsAPI = {
  getEvaluations: () => getCachedRequest('/evaluations/', { ttl: 30000 }),
  createEvaluation: (data) => api.post('/evaluations/', data).then((response) => {
    invalidateCacheByPrefix('/evaluations/');
    return response;
  }),
  getEvaluation: (id) => getCachedRequest(`/evaluations/${id}/`, { ttl: 30000 }),
  updateEvaluation: (id, data) => api.put(`/evaluations/${id}/`, data).then((response) => {
    invalidateCacheByPrefix('/evaluations/');
    return response;
  }),
  deleteEvaluation: (id) => api.delete(`/evaluations/${id}/`).then((response) => {
    invalidateCacheByPrefix('/evaluations/');
    return response;
  }),
};

export const criteriaAPI = {
  getCriteria: () => getCachedRequest('/criteria/', { ttl: 30000 }),
  createCriteria: (data) => api.post('/criteria/', data).then((response) => {
    invalidateCacheByPrefix('/criteria/');
    return response;
  }),
  updateCriteria: (id, data) => api.put(`/criteria/${id}/`, data).then((response) => {
    invalidateCacheByPrefix('/criteria/');
    return response;
  }),
  deleteCriteria: (id) => api.delete(`/criteria/${id}/`).then((response) => {
    invalidateCacheByPrefix('/criteria/');
    return response;
  }),
};

export const adminAPI = {
  getStatistics: () => getCachedRequest('/admin/statistics/', { ttl: 30000 }),
  getUsers: (params) => getCachedRequest('/users/', { params, ttl: 30000 }),
};

export const notificationsAPI = {
  getNotifications: (params) => getCachedRequest('/notifications/', { params, ttl: 10000 }),
  markAsRead: (id) => api.put(`/notifications/${id}/read/`).then((response) => {
    invalidateCacheByPrefix('/notifications/');
    return response;
  }),
  markAllAsRead: () => api.post('/notifications/mark-all-read/').then((response) => {
    invalidateCacheByPrefix('/notifications/');
    return response;
  }),
};

export const chatAPI = {
  getContacts: () => api.get('/chat/contacts/'),
  getMessages: (recipientId) => api.get(`/chat/messages/${recipientId}/`),
  sendMessage: (recipientId, message) => api.post(`/chat/messages/${recipientId}/`, { message }),
};

export default api;
