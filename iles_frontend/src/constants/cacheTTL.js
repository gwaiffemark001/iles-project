/**
 * Cache TTL (Time-To-Live) constants for API requests in milliseconds.
 * 
 * These constants control how long cached API responses are considered valid.
 * Shorter TTLs (e.g., notifications) ensure more frequent updates.
 * Longer TTLs (e.g., placements) reduce API load for less frequently changing data.
 */

// Real-time data that changes frequently
export const CACHE_TTL = {
  // Notifications update frequently, cache for 10 seconds
  NOTIFICATIONS: 10000,
  
  // Weekly logs may be updated while viewing, cache for 15 seconds
  LOGS: 15000,
  
  // Placements, evaluations, criteria change less frequently, cache for 30 seconds
  PLACEMENTS: 30000,
  EVALUATIONS: 30000,
  CRITERIA: 30000,
  
  // Admin statistics and user lists, cache for 30 seconds
  ADMIN_STATISTICS: 30000,
  USERS: 30000,
};

export default CACHE_TTL;
