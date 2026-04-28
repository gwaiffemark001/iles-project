import { Navigate } from 'react-router-dom'
import { roleToHomePath } from './roleRedirect'

function getRole() {
  return localStorage.getItem('role') || localStorage.getItem('userRole') || 'student'
}

export default function AppLanding() {
  return <Navigate to={roleToHomePath(getRole())} replace />
}

