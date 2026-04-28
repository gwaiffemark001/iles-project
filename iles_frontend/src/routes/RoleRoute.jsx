import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { roleToHomePath } from './roleRedirect'

function normalizeRole(role) {
  return (role || '').trim().toLowerCase()
}

function getRole() {
  // Backend profile fetch will eventually be the source of truth.
  // For now, allow either "role" or "userRole".
  return localStorage.getItem('role') || localStorage.getItem('userRole')
}

export default function RoleRoute({ allow }) {
  const role = normalizeRole(getRole())
  const location = useLocation()

  const allowed = (allow || []).map(normalizeRole)
  const isAllowed = allowed.includes(role)

  if (!role) {
    return <Navigate to="/app" replace state={{ from: location }} />
  }

  if (!isAllowed) {
    return <Navigate to={roleToHomePath(role)} replace state={{ from: location }} />
  }

  return <Outlet />
}

