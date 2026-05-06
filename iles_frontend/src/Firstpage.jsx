import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react'
import './Firstpage.css';
import { useAuth } from './auth/useAuth'
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
            setErrorMessage(err?.message || 'Login failed.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>

            <div className='page_1'>
                <div className='centre_logins'>
                    <header className='header'>
                        <h1 className="head">WELCOME TO ILES</h1>
                        <h2 className="subhead">Login to continue</h2>
                        <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                    </header>
                    <div >
                        <form className="logins" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Username/Email"
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                autoComplete="username"
                                required
                            />
                            <input
                                type="password"
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
                            <p className="signup"><Link to="/signup">Sign up</Link></p>
                            <p className="signup"><Link to="/forgot-password">Forgot Password?</Link></p>
                        </section>
                    </div>
                </div>
                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} ILES</p>
                </footer>
                
            </div>
        </>

    );
}

export default Firstpage