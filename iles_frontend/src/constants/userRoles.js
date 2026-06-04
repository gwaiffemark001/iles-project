/**
 * User role constants and role-based configuration.
 * 
 * Defines all user roles in the system and their display names.
 * Used for permission checks, UI rendering, and role-based access control.
 */

export const USER_ROLES = {
  STUDENT: 'student',
  WORKPLACE_SUPERVISOR: 'workplace_supervisor',
  ACADEMIC_SUPERVISOR: 'academic_supervisor',
  ADMIN: 'admin',
};

/**
 * Role display labels for UI
 */
export const ROLE_LABELS = {
  [USER_ROLES.STUDENT]: 'Student Intern',
  [USER_ROLES.WORKPLACE_SUPERVISOR]: 'Workplace Supervisor',
  [USER_ROLES.ACADEMIC_SUPERVISOR]: 'Academic Supervisor',
  [USER_ROLES.ADMIN]: 'Administrator',
};

/**
 * Role-based permissions configuration
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    canCreateLogs: true,
    canViewOwnLogs: true,
    canViewPlacementApplications: true,
    canApplyForPlacements: true,
  },
  [USER_ROLES.WORKPLACE_SUPERVISOR]: {
    canReviewLogs: true,
    canApproveLogs: true,
    canViewSupervisedStudents: true,
    canCreateEvaluations: true,
  },
  [USER_ROLES.ACADEMIC_SUPERVISOR]: {
    canReviewLogs: true,
    canApproveLogs: true,
    canViewSupervisedStudents: true,
    canCreateEvaluations: true,
  },
  [USER_ROLES.ADMIN]: {
    canManageUsers: true,
    canCreatePlacements: true,
    canManagePlacements: true,
    canViewAllLogs: true,
    canViewAllEvaluations: true,
    canAccessStatistics: true,
  },
};

/**
 * Check if user with given role has permission
 * @param {string} role - User role
 * @param {string} permission - Permission key
 * @returns {boolean} True if role has permission
 */
export const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
};

export default USER_ROLES;
