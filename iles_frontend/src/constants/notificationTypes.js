/**
 * Notification type constants.
 * 
 * Represents all possible notification types in the system.
 * Used for filtering, routing, and displaying notifications.
 */

export const NOTIFICATION_TYPES = {
  // Placement-related notifications
  PLACEMENT_CREATED: 'placement_created',
  PLACEMENT_STATUS_UPDATED: 'placement_status_updated',
  
  // Weekly log notifications
  LOG_SUBMITTED: 'log_submitted',
  LOG_REVIEWED: 'log_reviewed',
  LOG_APPROVED: 'log_approved',
  LOG_REJECTED: 'log_rejected',
  
  // Evaluation notifications
  EVALUATION_SUBMITTED: 'evaluation_submitted',
  EVALUATION_UPDATED: 'evaluation_updated',
  
  // System notifications
  GENERAL: 'general',
  SYSTEM: 'system',
};

/**
 * Notification type display labels for UI
 */
export const NOTIFICATION_LABELS = {
  [NOTIFICATION_TYPES.PLACEMENT_CREATED]: 'Placement Created',
  [NOTIFICATION_TYPES.PLACEMENT_STATUS_UPDATED]: 'Placement Status Updated',
  [NOTIFICATION_TYPES.LOG_SUBMITTED]: 'Log Submitted',
  [NOTIFICATION_TYPES.LOG_REVIEWED]: 'Log Reviewed',
  [NOTIFICATION_TYPES.LOG_APPROVED]: 'Log Approved',
  [NOTIFICATION_TYPES.LOG_REJECTED]: 'Log Rejected',
  [NOTIFICATION_TYPES.EVALUATION_SUBMITTED]: 'Evaluation Submitted',
  [NOTIFICATION_TYPES.EVALUATION_UPDATED]: 'Evaluation Updated',
  [NOTIFICATION_TYPES.GENERAL]: 'General',
  [NOTIFICATION_TYPES.SYSTEM]: 'System',
};

export default NOTIFICATION_TYPES;
