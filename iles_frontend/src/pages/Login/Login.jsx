import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Login.css';
import '@/ILES.css'; 

function Login() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);

        try {
            const tokenResponse = await fetch('/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: identifier,
                    password,
                }),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                const detail = tokenData.detail || 'Invalid username/email or password.';
                setErrorMessage(detail);
                return;
            }

            localStorage.setItem('access_token', tokenData.access);
            localStorage.setItem('refresh_token', tokenData.refresh);

            const profileResponse = await fetch('/api/profile/', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${tokenData.access}`,
                },
            });

            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                setErrorMessage(profileData.detail || 'Login succeeded, but profile fetch failed.');
                return;
            }

            const role = profileData.role;

            if (role === 'academic_supervisor') {
                navigate('/academic-supervisor/dashboard');
            } else if (role === 'workplace_supervisor') {
                navigate('/workplace-supervisor/dashboard');
            } else {
                navigate('/weekly-log');
            }
        } catch (error) {
            setErrorMessage('Unable to reach the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

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
                        <form className="logins" onSubmit={handleLogin}>
                            <input
                                type="text"
                                placeholder="Username/Email"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button className="login-btn" type="submit" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
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

export default Login;