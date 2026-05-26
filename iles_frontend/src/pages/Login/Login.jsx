import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import './Login.css'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleLogin = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setIsLoading(true)
        try {
            const result = await login({ usernameOrEmail: username, password })
            if (!result?.success) {
                setErrorMessage(result?.error || 'Login failed')
                return
            }
            const role = result.user?.role
            switch (role) {
                case 'admin':
                    navigate('/app/admin/dashboard')
                    break
                case 'academic_supervisor':
                    navigate('/app/academic/dashboard')
                    break
                case 'workplace_supervisor':
                    navigate('/app/workplace/dashboard')
                    break
                default:
                    navigate('/app/student/dashboard')
            }
        } catch (err) {
            setErrorMessage(err?.message || 'Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="page_1">
            <div className="centre_logins">
                <header className="header">
                    <h1 className="head">WELCOME TO ILES</h1>
                    <h2 className="subhead">Login to continue</h2>
                    <img className="logo" src="/ILES-Logo.png" alt="ILES logo" onError={(e) => (e.target.style.display = 'none')} />
                </header>
                <div>
                    <form className="logins" onSubmit={handleLogin}>
                        <input type="text" placeholder="Username/Email" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button className="login-btn" type="submit" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <section className="failed_login">
                        <p className="signup"><Link to="/signup">Sign up</Link></p>
                        <p className="signup"><Link to="/forgot-password">Forgot Password?</Link></p>
                    </section>
                </div>
            </div>
            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} ILES</p>
            </footer>
        </div>
    )
}

export default Login
 
