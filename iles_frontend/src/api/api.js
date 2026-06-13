/**
 * API client module with request caching, token refresh, and error handling.
 * 
 * Features:
 * - Automatic Bearer token injection from localStorage
 * - JWT token refresh on 401 responses
 * - Request-level caching with TTL
 * - Cache invalidation by URL prefix
 * - Centralized error message extraction
 */

import axios from 'axios'
import { API_BASE_URL } from '@/constants/appConstants'

const api = axios.create({
    baseURL: API_BASE_URL,
})
/** @returns {string|null} Access token from localStorage */
const getAccessToken = () => localStorage.getItem('access_token');

/** @returns {string|null} Refresh token from localStorage */
const getRefreshToken = () => localStorage.getItem('refresh_token');

let refreshPromise = null;
const requestCache = new Map();

/** Clear all cached requests */
const clearRequestCache = () => {
  requestCache.clear();
};

/**
 * Generate cache key from URL and parameters
 * @param {string} url - Request URL
 * @param {object} params - Query parameters
 * @returns {string} Cache key
 */
const cacheKey = (url, params) => `${url}::${JSON.stringify(params ?? null)}`;

/**
 * Get cached request response if available and not expired
 * @param {string} url - Request URL
 * @param {object} options - Options with params and ttl (time-to-live in ms)
 * @returns {Promise} Axios promise
 */
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

/**
 * Invalidate cached requests matching one or more URL prefixes
 * @param {...string} prefixes - URL prefixes to invalidate (e.g., '/logs/', '/placements/')
 */
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

/**
 * Clear session data (tokens and cache) and log user out
 */
const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  clearRequestCache();
};

/**
 * Extract error message from axios error response
 * @param {AxiosError} error - Axios error object
 * @param {string} fallback - Fallback message if extraction fails
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const payload = error?.payload ?? error?.response?.data ?? error?.data;

  if (typeof payload === 'string') {
    return payload;
  }

  if (payload?.detail) {
    return payload.detail;
  }

  if (payload?.error) {
    return payload.error;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (payload && typeof payload === 'object') {
    const firstValue = Object.values(payload)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  if (typeof error?.message === 'string' && error.message !== '') {
    return error.message;
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

/**
 * Authentication API endpoints
 */
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  register: (userData) => api.post('/register/', userData),
  getProfile: () => api.get('/profile/'),
  updateProfile: (data) => api.put('/profile/', data),
  changePassword: (data) => api.post('/change-password/', data),
};

/**
 * Weekly logs API endpoints with caching
 */
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

/**
 * Internship placements API endpoints with caching
 */
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

/**
 * Evaluation assessments API endpoints with caching
 */
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

/**
 * Evaluation criteria API endpoints with caching
 */
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

/**
 * Admin panel API endpoints with caching
 */
export const adminAPI = {
  getStatistics: () => getCachedRequest('/admin/statistics/', { ttl: 30000 }),
  getUsers: (params) => getCachedRequest('/users/', { params, ttl: 30000 }),
  deleteUser: (id) => api.delete(`/users/${id}/`).then((response) => {
    invalidateCacheByPrefix('/users/');
    return response;
  }),
  deletePlacement: (id) => api.delete(`/placements/${id}/`).then((response) => {
    invalidateCacheByPrefix('/placements/');
    return response;
  }),
};

/**
 * Notifications API endpoints with caching
 */
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

/**
 * Real-time chat API endpoints
 */
export const chatAPI = {
  getContacts: () => api.get('/chat/contacts/'),
  getMessages: (recipientId) => api.get(`/chat/messages/${recipientId}/`),
  sendMessage: (recipientId, message) => api.post(`/chat/messages/${recipientId}/`, { message }),
};

export default api;

//
// split commit: feat(api): implement request caching and token refresh
