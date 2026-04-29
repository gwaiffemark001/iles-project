export function roleToHomePath(role) {
  switch (role) {
    case 'admin':
    case 'program_admin':
      return '/app/admin'
    case 'academic_supervisor':
    case 'academic':
      return '/app/academic'
    case 'workplace_supervisor':
    case 'workplace':
      return '/app/workplace'
    case 'student':
    default:
      return '/app/student'
  }
}

