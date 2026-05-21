// Error handling utilities
export const errorHandler = {
  // Handle API errors consistently
  handleApiError: (error) => {
    
    if (!error.response) {
      return {
        message: 'Network error occurred',
        type: 'network',
        details: error.message,
        action: 'Check your internet connection'
      };
    }
    
    const status = error.response.status;
    const data = error.response.data;
    
    // Handle different HTTP status codes
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Bad request',
          type: 'validation',
          details: data?.errors || data,
          action: 'Please check your input and try again'
        };
      
      case 401:
        return {
          message: 'Authentication failed',
          type: 'auth',
          action: 'Please login again'
        };
      
      case 403:
        return {
          message: 'Access denied',
          type: 'permission',
          action: 'Contact administrator for access'
        };
      
      case 404:
        return {
          message: 'Resource not found',
          type: 'not_found',
          action: 'Check the URL and try again'
        };
      
      case 422:
        return {
          message: data?.detail || 'Validation error',
          type: 'validation',
          details: data?.errors || data,
          action: 'Please correct the errors and try again'
        };
      
      case 500:
        return {
          message: 'Server error occurred',
          type: 'server',
          action: 'Please try again later or contact support'
        };
      
      default:
        return {
          message: data?.message || data?.detail || 'An error occurred',
          type: 'unknown',
          details: data,
          action: 'Please try again or contact support'
        };
    }
  },

  // Handle form validation errors
  handleValidationError: (errors) => {
    const errorMessages = [];
    
    Object.keys(errors).forEach(field => {
      const error = errors[field];
      if (error) {
        errorMessages.push(`${field}: ${error}`);
      }
    });
    
    return errorMessages.join('; ');
  },

  // Show user-friendly error messages
  getUserMessage: (error) => {
    const handled = errorHandler.handleApiError(error);
    return handled.message || 'An unexpected error occurred';
  },

  // Get error type for styling
  getErrorType: (error) => {
    const handled = errorHandler.handleApiError(error);
    return handled.type || 'default';
  },

  // Get suggested action for user
  getSuggestedAction: (error) => {
    const handled = errorHandler.handleApiError(error);
    return handled.action || 'Please try again';
  },

  // Check if error is recoverable
  isRecoverable: (error) => {
    const handled = errorHandler.handleApiError(error);
    return ['validation', 'network'].includes(handled.type);
  }
};

export default errorHandler;
