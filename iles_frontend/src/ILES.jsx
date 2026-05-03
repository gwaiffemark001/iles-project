import { useMemo, useState } from 'react'
import './ILES.css'
import { createApiClient } from './api/client'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/Student/StudentDashboard'
import AcademicSupervisorDashboard from './pages/AcademicSupervisor/AcademicSupervisorDashboard'
import WorkplaceSupervisorDashboard from './pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard'

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

export function ILES() {
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
      const payload = await api.post(
        '/api/token/',
        { username: loginUsername, password: loginPassword },
        { auth: false },
      )
      const nextSession = {
        access: payload.access || '',
        refresh: payload.refresh || '',
        user: session.user || '',
      }
      setSession(nextSession)
      localStorage.setItem('access_token', nextSession.access)
      localStorage.setItem('refresh_token', nextSession.refresh)
      await loadProfile(nextSession.access)
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
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setStatus('Logged out.')
    setError('')
  }

  async function loadProfile(accessTokenOverride = '') {
    setError('')
    try {
      const payload = await api.get(
        '/api/profile/',
        accessTokenOverride
          ? { headers: { Authorization: `Bearer ${accessTokenOverride}` } }
          : undefined,
      )
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

  const isStudent = registerData.role === 'student'

  // ── Render role-based dashboard when logged in ──────────────────────────────
  if (session.access && profile) {
    const dashboardProps = { api, profile, token: session.access, onLogout: logout }

    if (profile.role === 'admin') {
      return <AdminDashboard user={profile} token={session.access} onLogout={logout} />
    }
    if (profile.role === 'student') {
      return <StudentDashboard {...dashboardProps} />
    }
    if (profile.role === 'academic_supervisor') {
      return <AcademicSupervisorDashboard {...dashboardProps} />
    }
    if (profile.role === 'workplace_supervisor') {
      return <WorkplaceSupervisorDashboard {...dashboardProps} />
    }
  }

  // Loading state: token exists but profile hasn't loaded yet
  if (session.access && !profile) {
    // Auto-load profile once on mount if token already exists
    if (!loading) {
      loadProfile(session.access)
    }
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
            <p className="muted">Loading your dashboard…</p>
            {error && <p className="error">{error}</p>}
            <button type="button" className="secondary" onClick={logout}>
              Sign out
            </button>
          </section>
        </section>
      </main>
    )
  }

  // ── Auth forms (not logged in) ──────────────────────────────────────────────
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
          <h1>
            {activeForm === FORM_REGISTER ? 'Create your ILES account' : 'Log in to ILES'}
          </h1>
          <p className="muted">Backend: {API_BASE_URL}</p>

          <div className="tab-row">
            <button
              type="button"
              className={`tab-btn ${activeForm === FORM_LOGIN ? 'is-active' : ''}`}
              onClick={() => setActiveForm(FORM_LOGIN)}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`tab-btn ${activeForm === FORM_REGISTER ? 'is-active' : ''}`}
              onClick={() => setActiveForm(FORM_REGISTER)}
            >
              Create account
            </button>
            <button
              type="button"
              className={`tab-btn ${activeForm === FORM_FORGOT ? 'is-active' : ''}`}
              onClick={() => setActiveForm(FORM_FORGOT)}
            >
              Forgot password
            </button>
          </div>

          {activeForm === FORM_LOGIN && (
            <form onSubmit={login} className="stack">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Log in'}
              </button>
            </form>
          )}

          {activeForm === FORM_REGISTER && (
            <form onSubmit={register} className="stack">
              <div className="grid-2">
                <div>
                  <label htmlFor="reg-first-name">First name</label>
                  <input
                    id="reg-first-name"
                    type="text"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="reg-last-name">Last name</label>
                  <input
                    id="reg-last-name"
                    type="text"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <label htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData((p) => ({ ...p, username: e.target.value }))}
                required
              />
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData((p) => ({ ...p, email: e.target.value }))}
              />
              <label htmlFor="reg-role">Role</label>
              <select
                id="reg-role"
                value={registerData.role}
                onChange={(e) => setRegisterData((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="student">Student Intern</option>
                <option value="workplace_supervisor">Workplace Supervisor</option>
                <option value="academic_supervisor">Academic Supervisor</option>
                <option value="admin">Administrator</option>
              </select>
              <label htmlFor="reg-phone">Phone</label>
              <input
                id="reg-phone"
                type="text"
                value={registerData.phone}
                onChange={(e) => setRegisterData((p) => ({ ...p, phone: e.target.value }))}
              />
              <label htmlFor="reg-department">Department</label>
              <input
                id="reg-department"
                type="text"
                value={registerData.department}
                onChange={(e) => setRegisterData((p) => ({ ...p, department: e.target.value }))}
              />
              {isStudent ? (
                <>
                  <label htmlFor="reg-student-number">Student number</label>
                  <input
                    id="reg-student-number"
                    type="text"
                    value={registerData.studentNumber}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, studentNumber: e.target.value }))
                    }
                  />
                  <label htmlFor="reg-registration-number">Registration number</label>
                  <input
                    id="reg-registration-number"
                    type="text"
                    value={registerData.registrationNumber}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, registrationNumber: e.target.value }))
                    }
                  />
                </>
              ) : (
                <>
                  <label htmlFor="reg-staff-number">Staff number</label>
                  <input
                    id="reg-staff-number"
                    type="text"
                    value={registerData.staffNumber}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, staffNumber: e.target.value }))
                    }
                  />
                </>
              )}
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData((p) => ({ ...p, password: e.target.value }))}
                required
              />
              <label htmlFor="reg-confirm-password">Confirm password</label>
              <input
                id="reg-confirm-password"
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) =>
                  setRegisterData((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </form>
          )}

          {activeForm === FORM_FORGOT && (
            <form onSubmit={forgotPassword} className="stack">
              <label htmlFor="fp-identifier">Username or email</label>
              <input
                id="fp-identifier"
                type="text"
                value={forgotData.identifier}
                onChange={(e) => setForgotData((p) => ({ ...p, identifier: e.target.value }))}
                required
              />
              <label htmlFor="fp-email">Email confirmation (optional)</label>
              <input
                id="fp-email"
                type="email"
                value={forgotData.email}
                onChange={(e) => setForgotData((p) => ({ ...p, email: e.target.value }))}
              />
              <label htmlFor="fp-new-password">New password</label>
              <input
                id="fp-new-password"
                type="password"
                value={forgotData.newPassword}
                onChange={(e) => setForgotData((p) => ({ ...p, newPassword: e.target.value }))}
                required
              />
              <label htmlFor="fp-confirm-password">Confirm new password</label>
              <input
                id="fp-confirm-password"
                type="password"
                value={forgotData.confirmPassword}
                onChange={(e) =>
                  setForgotData((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Updating…' : 'Reset password'}
              </button>
            </form>
          )}

          {status && <p className="success">{status}</p>}
          {error && <p className="error">{error}</p>}
        </section>
      </section>
    </main>
  )
}

export default ILES