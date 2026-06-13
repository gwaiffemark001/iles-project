/*
 HTTP Status Codes
 Centralized HTTP status codes for consistent use across the application
 */
export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // 4xx Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
}


/// HTTP Methods

export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
}


/// HTTP Headers

export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  CACHE_CONTROL: 'Cache-Control',
}

/// Content Types
export const CONTENT_TYPE = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  XML: 'application/xml',
  TEXT: 'text/plain',
}

/// API Response Status

export const API_RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
}


/// Error Type Classifications

export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}


///Timeout values in milliseconds

export const TIMEOUT_VALUES = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  EXTRA_LONG: 30000,
}