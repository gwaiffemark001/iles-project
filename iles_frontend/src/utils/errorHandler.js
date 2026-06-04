/**
 * Error handling and validation utilities for frontend.
 * 
 * Provides helpers for common error scenarios, user feedback,
 * and error recovery strategies.
 */

/**
 * HTTP status codes and their meanings
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * User-friendly error messages for common HTTP errors
 */
export const ERROR_MESSAGES = {
  [HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
  [HTTP_STATUS.UNAUTHORIZED]: 'You are not authenticated. Please log in again.',
  [HTTP_STATUS.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
  [HTTP_STATUS.CONFLICT]: 'The request conflicts with existing data.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
};

/**
 * Get user-friendly error message based on HTTP status
 * @param {number} status - HTTP status code
 * @param {string} defaultMessage - Fallback message
 * @returns {string} User-friendly error message
 */
export const getStatusErrorMessage = (status, defaultMessage = 'Something went wrong') => {
  return ERROR_MESSAGES[status] || defaultMessage;
};

/**
 * Check if error is a network/connection error
 * @param {Error} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response || error.message === 'Network Error';
};

/**
 * Check if error is a client error (4xx)
 * @param {Error} error - Error object
 * @returns {boolean} True if client error
 */
export const isClientError = (error) => {
  return error.response?.status >= 400 && error.response?.status < 500;
};

/**
 * Check if error is a server error (5xx)
 * @param {Error} error - Error object
 * @returns {boolean} True if server error
 */
export const isServerError = (error) => {
  return error.response?.status >= 500;
};

/**
 * Determine if request can be retried
 * @param {Error} error - Error object
 * @returns {boolean} True if request is retryable
 */
export const isRetryable = (error) => {
  // Retry on network errors and server errors
  if (isNetworkError(error)) return true;
  if (isServerError(error)) return true;
  
  // Retry on specific client errors
  const retryableStatuses = [408, 429]; // Request Timeout, Too Many Requests
  return retryableStatuses.includes(error.response?.status);
};

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid flag and issues array
 */
export const validatePassword = (password) => {
  const issues = [];
  
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain number');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

export default {
  HTTP_STATUS,
  ERROR_MESSAGES,
  getStatusErrorMessage,
  isNetworkError,
  isClientError,
  isServerError,
  isRetryable,
  isValidEmail,
  validatePassword,
};
