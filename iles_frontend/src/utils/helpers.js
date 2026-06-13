// Date formatting utilities
const DEFAULT_LOCALE = 'en-US'

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[\d\s-]{7,15}$/

export const formatDate = (date) => {
  if (!date) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long' 
  };
  
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, options);
};

export const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  
  return new Date(dateTime).toLocaleString(DEFAULT_LOCALE, options);
};

// String utilities
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return '?';
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}`;
};

// Validation utilities
export const isValidEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

export const isValidPhone = (phone) => {
  return PHONE_REGEX.test(phone);
};

export const isValidRequired = (value) => {
  return value && value.trim().length > 0;
};

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i < 1) {
    return bytes + ' ' + sizes[0];
  }
  
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};

// Array utilities
export const sortByProperty = (array, property, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = a[property];
    const bValue = b[property];
    
    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

export const filterByProperty = (array, property, value) => {
  return array.filter(item => {
    const itemValue = item[property];
    return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
  });
};

import { getErrorMessage as parseApiErrorMessage } from '@/api/api';

// Status utilities
export const getStatusColor = (status) => {
  const statusColors = {
    'pending': '#f59e0b',
    'approved': '#10b981',
    'rejected': '#ef4444',
    'completed': '#3b82f6',
    'in_progress': '#3b82f6'
  };
  
  return statusColors[status] || '#6b7280';
};

export const getStatusLabel = (status) => {
  const statusLabels = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'completed': 'Completed',
    'in_progress': 'In Progress'
  };
  
  return statusLabels[status] || status;
};

export const confirmAction = (message) => window.confirm(message);

export const getApiErrorMessage = (error, fallback = 'An unexpected error occurred.') => {
  if (!error) return fallback;
  return parseApiErrorMessage(error, fallback);
};
