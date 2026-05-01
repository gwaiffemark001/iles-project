import { useMemo, useState } from 'react'
import './ILES.css'
import { createApiClient } from './api/client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FORM_LOGIN = 'login'
const FORM_REGISTER = 'register'
const FORM_FORGOT = 'forgot'

function getStoredSession() {
  return {
    access: localStorage.getItem('access_token') || '',
    refresh: localStorage.getItem('refresh_token') || '',
    user: localStorage.getItem('user') || '',
  }
}

function emptyRegister() {
  return {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'student',
    phone: '',
    department: '',
    studentNumber: '',
    registrationNumber: '',
    staffNumber: '',
  }
}

export default function ILES() {
  const initial = useMemo(() => getStoredSession(), [])
  const [session, setSession] = useState(initial)
  const [activeForm, setActiveForm] = useState(FORM_LOGIN)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerData, setRegisterData] = useState(emptyRegister())
  const [forgotData, setForgotData] = useState({
    identifier: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profile, setProfile] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE_URL,
        getAccessToken: () => session.access,
        getRefreshToken: () => session.refresh,
        setTokens: ({ access, refresh }) => {
          const nextAccess = access || ''
          const nextRefresh = refresh || ''
          setSession((prev) => ({ ...prev, access: nextAccess, refresh: nextRefresh }))
          localStorage.setItem('access_token', nextAccess)
          localStorage.setItem('refresh_token', nextRefresh)
        },
        clearTokens: () => {
          setSession({ access: '', refresh: '', user: '' })
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
        },
      }),
    [session],
  )

  async function login(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    setLoading(true)
    try {
      const payload = await api.post('/api/token/', { username: loginUsername, password: loginPassword }, { auth: false })
      const nextSession = { access: payload.access || '', refresh: payload.refresh || '', user: session.user || '' }
      setSession(nextSession)
      localStorage.setItem('access_token', nextSession.access)
      localStorage.setItem('refresh_token', nextSession.refresh)
      const nextProfile = await loadProfile(nextSession.access)
      if (nextProfile) await loadDashboard(nextProfile, nextSession.access)
      setStatus('Signed in successfully.')
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  async function register(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    setLoading(true)
    try {
      await api.post(
        '/api/register/',
        {
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          confirm_password: registerData.confirmPassword,
          first_name: registerData.firstName,
          last_name: registerData.lastName,
          role: registerData.role,
          phone: registerData.phone,
          department: registerData.department,
          student_number: registerData.studentNumber,
          registration_number: registerData.registrationNumber,
          staff_number: registerData.staffNumber,
        },
        { auth: false },
      )
      setStatus('Account created. Sign in with your username and password.')
      setActiveForm(FORM_LOGIN)
      setLoginUsername(registerData.username)
      setRegisterData(emptyRegister())
    } catch (err) {
      setError(err.message || 'Account creation failed')
    } finally {
      setLoading(false)
    }
  }

  async function forgotPassword(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    setLoading(true)
    try {
      await api.post(
        '/api/forgot-password/',
        {
          identifier: forgotData.identifier,
          email: forgotData.email,
          new_password: forgotData.newPassword,
          confirm_password: forgotData.confirmPassword,
        },
        { auth: false },
      )
      setStatus('Password changed successfully. You can sign in now.')
      setActiveForm(FORM_LOGIN)
      setForgotData({ identifier: '', email: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setSession({ access: '', refresh: '', user: '' })
    setProfile(null)
    setDashboardData(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setStatus('Logged out.')
    setError('')
  }

  async function loadProfile(accessTokenOverride = '') {
    setError('')
    try {
      const payload = await api.get('/api/profile/', accessTokenOverride
        ? { headers: { Authorization: `Bearer ${accessTokenOverride}` } }
        : undefined)
      const displayName = payload?.username || payload?.email || ''
      setSession((prev) => ({ ...prev, user: displayName }))
      if (displayName) localStorage.setItem('user', displayName)
      setProfile(payload)
      return payload
    } catch (err) {
      setError(err.message || 'Failed to load profile')
      return null
    }
  }

  async function loadDashboard(profileOverride = null, accessTokenOverride = '') {
    const userProfile = profileOverride || profile
    if (!userProfile?.role) return

    const requestOptions = accessTokenOverride
      ? { headers: { Authorization: `Bearer ${accessTokenOverride}` } }
      : undefined

    try {
      if (userProfile.role === 'admin') {
        const stats = await api.get('/api/admin/statistics/', requestOptions)
        setDashboardData({ type: 'admin', stats })
        return
      }

      if (userProfile.role === 'student') {
        const [placements, logs] = await Promise.all([
          api.get('/api/placements/', requestOptions),
          api.get('/api/logs/', requestOptions),
        ])
        setDashboardData({
          type: 'student',
          placements: Array.isArray(placements) ? placements : [],
          logs: Array.isArray(logs) ? logs : [],
        })
        return
      }

      if (userProfile.role === 'academic_supervisor') {
        const [placements, logs] = await Promise.all([
          api.get('/api/placements/', requestOptions),
          api.get('/api/logs/', requestOptions),
        ])
        setDashboardData({
          type: 'academic_supervisor',
          placements: Array.isArray(placements) ? placements : [],
          logs: Array.isArray(logs) ? logs : [],
        })
        return
      }

      if (userProfile.role === 'workplace_supervisor') {
        const [placements, logs] = await Promise.all([
          api.get('/api/placements/', requestOptions),
          api.get('/api/logs/', requestOptions),
        ])
        setDashboardData({
          type: 'workplace_supervisor',
          placements: Array.isArray(placements) ? placements : [],
          logs: Array.isArray(logs) ? logs : [],
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    }
  }

  const isStudent = registerData.role === 'student'

  return (
    <main className="auth-shell">
      <header className="top-nav">
        <div className="brand">
          <img src="/ILES-Logo.png" alt="ILES logo" />
          <div>
            <p className="brand-title">Makerere University</p>
            <p className="brand-subtitle">Internship Learning Environment System</p>
          </div>
        </div>
      </header>

      <section className="auth-stage">
        <section className="auth-card">
          <h1>{activeForm === FORM_REGISTER ? 'Create your ILES account' : 'Log in to ILES'}</h1>
          <p className="muted">Backend: {API_BASE_URL}</p>

          {!session.access ? (
            <>
              <div className="tab-row">
                <button type="button" className={`tab-btn ${activeForm === FORM_LOGIN ? 'is-active' : ''}`} onClick={() => setActiveForm(FORM_LOGIN)}>Sign in</button>
                <button type="button" className={`tab-btn ${activeForm === FORM_REGISTER ? 'is-active' : ''}`} onClick={() => setActiveForm(FORM_REGISTER)}>Create account</button>
                <button type="button" className={`tab-btn ${activeForm === FORM_FORGOT ? 'is-active' : ''}`} onClick={() => setActiveForm(FORM_FORGOT)}>Forgot password</button>
              </div>

              {activeForm === FORM_LOGIN && (
                <form onSubmit={login} className="stack">
                  <label htmlFor="login-username">Username</label>
                  <input id="login-username" type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
                  <label htmlFor="login-password">Password</label>
                  <input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Log in'}</button>
                </form>
              )}

              {activeForm === FORM_REGISTER && (
                <form onSubmit={register} className="stack">
                  <div className="grid-2">
                    <div>
                      <label htmlFor="reg-first-name">First name</label>
                      <input id="reg-first-name" type="text" value={registerData.firstName} onChange={(e) => setRegisterData((p) => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label htmlFor="reg-last-name">Last name</label>
                      <input id="reg-last-name" type="text" value={registerData.lastName} onChange={(e) => setRegisterData((p) => ({ ...p, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <label htmlFor="reg-username">Username</label>
                  <input id="reg-username" type="text" value={registerData.username} onChange={(e) => setRegisterData((p) => ({ ...p, username: e.target.value }))} required />
                  <label htmlFor="reg-email">Email</label>
                  <input id="reg-email" type="email" value={registerData.email} onChange={(e) => setRegisterData((p) => ({ ...p, email: e.target.value }))} />
                  <label htmlFor="reg-role">Role</label>
                  <select id="reg-role" value={registerData.role} onChange={(e) => setRegisterData((p) => ({ ...p, role: e.target.value }))}>
                    <option value="student">Student Intern</option>
                    <option value="workplace_supervisor">Workplace Supervisor</option>
                    <option value="academic_supervisor">Academic Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <label htmlFor="reg-phone">Phone</label>
                  <input id="reg-phone" type="text" value={registerData.phone} onChange={(e) => setRegisterData((p) => ({ ...p, phone: e.target.value }))} />
                  <label htmlFor="reg-department">Department</label>
                  <input id="reg-department" type="text" value={registerData.department} onChange={(e) => setRegisterData((p) => ({ ...p, department: e.target.value }))} />
                  {isStudent ? (
                    <>
                      <label htmlFor="reg-student-number">Student number</label>
                      <input id="reg-student-number" type="text" value={registerData.studentNumber} onChange={(e) => setRegisterData((p) => ({ ...p, studentNumber: e.target.value }))} />
                      <label htmlFor="reg-registration-number">Registration number</label>
                      <input id="reg-registration-number" type="text" value={registerData.registrationNumber} onChange={(e) => setRegisterData((p) => ({ ...p, registrationNumber: e.target.value }))} />
                    </>
                  ) : (
                    <>
                      <label htmlFor="reg-staff-number">Staff number</label>
                      <input id="reg-staff-number" type="text" value={registerData.staffNumber} onChange={(e) => setRegisterData((p) => ({ ...p, staffNumber: e.target.value }))} />
                    </>
                  )}
                  <label htmlFor="reg-password">Password</label>
                  <input id="reg-password" type="password" value={registerData.password} onChange={(e) => setRegisterData((p) => ({ ...p, password: e.target.value }))} required />
                  <label htmlFor="reg-confirm-password">Confirm password</label>
                  <input id="reg-confirm-password" type="password" value={registerData.confirmPassword} onChange={(e) => setRegisterData((p) => ({ ...p, confirmPassword: e.target.value }))} required />
                  <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
                </form>
              )}

              {activeForm === FORM_FORGOT && (
                <form onSubmit={forgotPassword} className="stack">
                  <label htmlFor="fp-identifier">Username or email</label>
                  <input id="fp-identifier" type="text" value={forgotData.identifier} onChange={(e) => setForgotData((p) => ({ ...p, identifier: e.target.value }))} required />
                  <label htmlFor="fp-email">Email confirmation (optional)</label>
                  <input id="fp-email" type="email" value={forgotData.email} onChange={(e) => setForgotData((p) => ({ ...p, email: e.target.value }))} />
                  <label htmlFor="fp-new-password">New password</label>
                  <input id="fp-new-password" type="password" value={forgotData.newPassword} onChange={(e) => setForgotData((p) => ({ ...p, newPassword: e.target.value }))} required />
                  <label htmlFor="fp-confirm-password">Confirm new password</label>
                  <input id="fp-confirm-password" type="password" value={forgotData.confirmPassword} onChange={(e) => setForgotData((p) => ({ ...p, confirmPassword: e.target.value }))} required />
                  <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Reset password'}</button>
                </form>
              )}
            </>
          ) : (
            <div className="stack">
              <p className="welcome">Welcome <strong>{session.user || 'user'}</strong></p>
              <div className="row">
                <button type="button" onClick={loadProfile}>Refresh profile</button>
                <button type="button" onClick={() => loadDashboard()}>Refresh dashboard</button>
                <button type="button" className="secondary" onClick={logout}>Sign out</button>
              </div>
              <div className="profile-box">
                {profile ? (
                  <>
                    <p><strong>Role:</strong> {profile.role}</p>
                    <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
                    <p><strong>Student No:</strong> {profile.student_number || 'N/A'}</p>
                    <p><strong>Staff No:</strong> {profile.staff_number || 'N/A'}</p>
                  </>
                ) : (
                  <p className="muted">Profile not loaded.</p>
                )}
              </div>
              <div className="profile-box">
                <p><strong>Dashboard:</strong> {profile?.role || 'N/A'}</p>
                {dashboardData?.type === 'admin' && (
                  <>
                    <p><strong>Total students:</strong> {dashboardData.stats?.total_students ?? 0}</p>
                    <p><strong>Total placements:</strong> {dashboardData.stats?.total_placements ?? 0}</p>
                    <p><strong>Active placements:</strong> {dashboardData.stats?.active_placements ?? 0}</p>
                    <p><strong>Pending logs:</strong> {dashboardData.stats?.pending_logs ?? 0}</p>
                  </>
                )}
                {dashboardData?.type === 'student' && (
                  <>
                    <p><strong>Your placements:</strong> {dashboardData.placements.length}</p>
                    <p><strong>Your logs:</strong> {dashboardData.logs.length}</p>
                  </>
                )}
                {dashboardData?.type === 'academic_supervisor' && (
                  <>
                    <p><strong>Assigned placements:</strong> {dashboardData.placements.length}</p>
                    <p><strong>Student logs to review:</strong> {dashboardData.logs.length}</p>
                  </>
                )}
                {dashboardData?.type === 'workplace_supervisor' && (
                  <>
                    <p><strong>Supervised placements:</strong> {dashboardData.placements.length}</p>
                    <p><strong>Logs in workflow:</strong> {dashboardData.logs.length}</p>
                  </>
                )}
                {!dashboardData && <p className="muted">No dashboard data loaded yet.</p>}
              </div>
            </div>
          )}

          {status && <p className="success">{status}</p>}
          {error && <p className="error">{error}</p>}
        </section>
      </section>
    </main>
  )
}
=======
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import Login from './pages/Login/Login'
import ForgotPassword from './pages/Login/ForgotPassword'
import Signup from './pages/Signup/Signup'
import AcademicSupervisorDashboard from './pages/AcademicSupervisor/AcademicSupervisorDashboard'
import StudentDashboard from './pages/Student/StudentDashboard'
import WorkplaceSupervisorDashboard from './pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard'
import AdminDashboard from './pages/AdminDashboard'

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { loading, user } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function ILES() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/academic_supervisor-dashboard" element={<Navigate to="/academic-supervisor/dashboard" replace />} />
        <Route path="/workplace_supervisor-dashboard" element={<Navigate to="/workplace-supervisor/dashboard" replace />} />
        <Route path="/student-dashboard" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/studentdashboard" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/app/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/app/academic" element={<Navigate to="/academic-supervisor/dashboard" replace />} />
        <Route path="/app/workplace" element={<Navigate to="/workplace-supervisor/dashboard" replace />} />
        <Route path="/app/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route
          path="/workplace-supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['workplace_supervisor']}>
              <WorkplaceSupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['academic_supervisor']}>
              <AcademicSupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default ILES
>>>>>>> b32a542b9577844056e014ac6e7e79c36470e350
