import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Signup.css';
import './ILES.css';

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [extraFields, setExtraFields] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');

    const navigate = useNavigate();
    // student email domains are put here
    const universityDomains = ['@students.mak.ac.ug'];

    // Show extra fields for students//
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        const isUniversityEmail = universityDomains.some((domain) => value.endsWith(domain));
        setExtraFields(isUniversityEmail);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const username = email.includes('@') ? email.split('@')[0] : email;
            let body = { username, email, password };
            if (extraFields) {
                body.studentNumber = studentNumber;
                body.registrationNumber = registrationNumber;
            }

            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.message || 'Signup failed.');
                return;
            }

            setSuccessMessage('Account created successfully. Please log in.');

            // Store JWT token in localStorage
            localStorage.setItem('token', data.token);

            // Get profile
            const profileResponse = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                },
            });

            const profileData = await profileResponse.json();
            const role = profileData.role;

            // Redirect based on role
            if (role === 'admin') {
                navigate('/admin-dashboard');
            } else if (role === 'academic_supervisor') {
                navigate('/academic_supervisor-dashboard');
            } else if (role === 'workplace_supervisor') {
                navigate('/workplace_supervisor-dashboard');
            } else {
                navigate('/student-dashboard'); // Default dashboard for other roles
            }
        } catch (error) {
            setErrorMessage('Unable to reach the server. Please try again later.');
        }
    };

    return (
        <div className="page_1">
            <div className="centre_logins">
                <header className="header_1">
                    <h1 className="head">create an ILES account</h1>
                    <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                </header>

                <form className="logins" onSubmit={handleSignup}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {extraFields && (
                        <div className="extra-fields">
                            <p className='student_detected'>Student email detected! Please fill in the additional fields</p>
                            <input
                                type="text"
                                placeholder="Student Number"
                                value={studentNumber}
                                onChange={(e) => setStudentNumber(e.target.value)}
                                required
                            />

                            <input
                                type="text"
                                placeholder="Registration Number"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                required
                            />

                        </div>
                    )}

                    <button type="submit" className="login-btn">
                        Create an Account
                    </button>
                </form>

                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <div >
                    <section className="failed_login">
                        <p className="signup">
                            <Link to="/">Back to Login</Link>
                        </p>
                        <p className="signup">
                            <Link to="/forgot-password">Forgot Password</Link>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Signup