import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { roleToHomePath } from './roleRedirect'
import { useAuth } from '../auth/useAuth'

function normalizeRole(role) {
  return (role || '').trim().toLowerCase()
}

export default function RoleRoute({ allow }) {
  const { role: rawRole, loading } = useAuth()
  const role = normalizeRole(rawRole)
  const location = useLocation()

  const allowed = (allow || []).map(normalizeRole)
  const isAllowed = allowed.includes(role)

  if (loading) return null

  if (!role) {
    return <Navigate to="/app" replace state={{ from: location }} />
  }

  if (!isAllowed) {
    return <Navigate to={roleToHomePath(role)} replace state={{ from: location }} />
  }

  return <Outlet />
}