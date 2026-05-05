import { Link } from 'react-router-dom'
import './Login.css'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'

function ForgotPassword() {
    const { api } = useAuth()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)
        try {
            await api.post('api/forgot-password/', { email }, { auth: false })
            setMessage('If an account exists, a password reset link has been sent to the email.')
        } catch (err) {
            setError(err?.message || 'Failed to send reset link.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="page_1" style={{ height: '100vh' }}>
                <div className="centre_logins">
                    <header className="header_1">
                        <h1 className="head">RESET PASSWORD</h1>
                        <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                    </header>
                    <form className="logins" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <section className="failed_login" style={{ width: '400px' }}>
                        <p className="signup">
                            <Link to="/">Back to Login</Link>
                        </p>
                        <p className="signup">
                            <Link to="/signup">Sign up</Link>
                        </p>
                    </section>
                </div>
            </div>
        </>
    )
}

export default ForgotPassword
