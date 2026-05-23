import { USER_ROLES } from '@/constants/appConstants'

export function roleToHomePath(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
    case USER_ROLES.PROGRAM_ADMIN:
      return '/app/admin'
    case USER_ROLES.ACADEMIC_SUPERVISOR:
    case 'academic':
      return '/app/academic'
    case USER_ROLES.WORKPLACE_SUPERVISOR:
    case 'workplace':
      return '/app/workplace'
    case USER_ROLES.STUDENT:
    default:
      return '/app/student'
  }
}

