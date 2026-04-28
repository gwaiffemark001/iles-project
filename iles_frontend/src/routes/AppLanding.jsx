import { Navigate } from 'react-router-dom'
import { roleToHomePath } from './roleRedirect'
import { useAuth } from '../auth/useAuth'

export default function AppLanding() {
  const { role, loading } = useAuth()
  if (loading) return null
  return <Navigate to={roleToHomePath(role || 'student')} replace />
}

