import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Firstpage.css';
import '../../ILES.css'; 

function Firstpage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            // Step 1: Get JWT token
            const tokenResponse = await fetch('/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                setErrorMessage(tokenData.detail || 'Login failed. Please try again.');
                setIsLoading(false);
                return;
            }

            // Store token
            localStorage.setItem('access_token', tokenData.access);
            localStorage.setItem('refresh_token',tokenData.refresh);

            // Step 2: Get user profile with token
            const profileResponse = await fetch('/api/profile/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenData.access}`,
                },
            });

            const profileData = await profileResponse.json();
            const role = profileData.role;

            // Step 3: Redirect based on role
            if (role === 'admin') {
                navigate('/admin-dashboard');
            } else if (role === 'academic_supervisor') {
                navigate('/academic_supervisor-dashboard');
            } else if (role === 'workplace_supervisor') {
                navigate('/workplace_supervisor-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (error) {
            setErrorMessage('Unable to reach the server. Please try again later.');
        } finally {
            setIsLoading(false);
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
                            <input type="text" placeholder="Username/Email" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <button className="login-btn" type="submit" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
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