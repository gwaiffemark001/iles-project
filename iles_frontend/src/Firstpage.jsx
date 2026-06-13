import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react'
import './Firstpage.css';
import { useAuth } from '@/auth/useAuth'
import { getErrorMessage } from '@/api/api'
import PasswordField from '@/components/PasswordField'
import { roleToHomePath } from './routes/roleRedirect'

function Firstpage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [usernameOrEmail, setUsernameOrEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setSubmitting(true)
        try {
            const profile = await login({ usernameOrEmail, password })
            navigate(roleToHomePath(profile?.role), { replace: true })
        } catch (err) {
            setErrorMessage(getErrorMessage(err, 'Login failed.'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='page_1'>
            <div className='centre_logins'>
                <header className='header'>
                    <h1 className="head">Sign in to ILES</h1>
                    <h2 className="subhead">Secure access to your internship dashboard</h2>
                    <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                </header>

                <form className="logins" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username/Email"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        autoComplete="username"
                        required
                    />
                    <PasswordField
                        id="firstpage-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                    <button className="login-btn" type="submit" disabled={submitting}>
                        {submitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <section className='failed_login'>
                    <p className="signup"><Link to="/signup">Create an account</Link></p>
                    <p className="signup"><Link to="/forgot-password">Forgot Password?</Link></p>
                </section>
                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} ILES</p>
                </footer>
            </div>
        </div>
    )
}

export default Firstpage