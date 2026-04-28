import { Navigate, Outlet, useLocation } from 'react-router-dom'

function getToken() {
  return localStorage.getItem('token')
}

export default function ProtectedRoute() {
  const token = getToken()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}

