const DEFAULT_API_SERVER_URL = 'http://localhost:8000'

function normalizeApiServerUrl(rawUrl) {
  const value = (rawUrl || '').toString().trim()
  if (!value) {
    return DEFAULT_API_SERVER_URL
  }

  if (/^:\d+$/.test(value)) {
    return `http://localhost${value}`
  }

  const prefixed = value.match(/^https?:\/\//i) ? value : `http://${value}`

  try {
    const url = new URL(prefixed)
    return url.origin
  } catch {
    return DEFAULT_API_SERVER_URL
  }
}

export const API_SERVER_URL = normalizeApiServerUrl(import.meta.env.VITE_API_BASE_URL)
export const API_BASE_URL = `${API_SERVER_URL}/api`
export const DEFAULT_DATE_LOCALE = 'en-US'
export const DATE_FORMAT_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}
export const TIME_FORMAT_OPTIONS = {
  hour: '2-digit',
  minute: '2-digit',
}
export const MS_PER_DAY = 24 * 60 * 60 * 1000
export const WEEKS_FACTOR = 7
export const DEFAULT_WEEK_NUMBER = 1
export const PROGRESS_PERCENTAGE_MAX = 100
export const PROGRESS_PERCENTAGE_MIN = 0
export const MAX_SCORE = 100

export const USER_ROLES = {
  STUDENT: 'student',
  WORKPLACE_SUPERVISOR: 'workplace_supervisor',
  ACADEMIC_SUPERVISOR: 'academic_supervisor',
  ADMIN: 'admin',
  PROGRAM_ADMIN: 'program_admin',
}

export const ROLE_OPTIONS = [
  { value: USER_ROLES.STUDENT, label: 'Student' },
  { value: USER_ROLES.WORKPLACE_SUPERVISOR, label: 'Workplace Supervisor' },
  { value: USER_ROLES.ACADEMIC_SUPERVISOR, label: 'Academic Supervisor' },
  { value: USER_ROLES.ADMIN, label: 'Administrator' },
]

export const STATUS_BADGE_CLASSES = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
}

export const APPLICATION_STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}
