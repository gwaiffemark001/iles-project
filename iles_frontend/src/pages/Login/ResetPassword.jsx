import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import './Login.css'
import { useAuth } from '../../auth/useAuth'

export default function ResetPassword() {
  const { api } = useAuth()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!uid || !token) {
      setError('Missing reset token. Use link from your email.')
      return
    }
    if (!newPassword) {
      setError('Password is required.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post(
        'api/forgot-password-confirm/',
        { uid, token, new_password: newPassword, confirm_password: confirmPassword },
        { auth: false },
      )
      setMessage('Password reset successful. Redirecting to login...')
      setTimeout(() => navigate('/'), 1800)
    } catch (err) {
      setError(err?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page_1" style={{ height: '100vh' }}>
      <div className="centre_logins">
        <header className="header_1">
          <h1 className="head">SET NEW PASSWORD</h1>
          <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
        </header>

        <form className="logins" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Set Password'}
          </button>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <section className="failed_login" style={{ width: '400px' }}>
          <p className="signup">
            <Link to="/">Back to Login</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
