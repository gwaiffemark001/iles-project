//ProtectedRoute.jsx - A component to protect routes that require authentication
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}

