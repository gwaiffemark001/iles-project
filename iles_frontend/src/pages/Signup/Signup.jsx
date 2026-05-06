import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import '../Login/Login.css';

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');

    const navigate = useNavigate();
    const { register } = useAuth();
    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const username = email.includes('@') ? email.split('@')[0] : email;
            const body = {
                username,
                email,
                password,
                role,
                ...(role === 'student'
                    ? {
                        student_number: studentNumber,
                        registration_number: registrationNumber,
                    }
                    : {}),
            };

            const result = await register(body);

            if (!result.success) {
                setErrorMessage(result.error || 'Signup failed.');
                return;
            }

            setSuccessMessage('Account created successfully. Please log in.');
            navigate('/');
        } catch {
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
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="student">Student</option>
                        <option value="workplace_supervisor">Workplace</option>
                        <option value="academic_supervisor">Academic Supervisor</option>
                    </select>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {role === 'student' && (
                        <div className="extra-fields">
                            <p className='student_detected'>Student account detected! Please fill in the additional fields</p>
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
                    <section className="failed_login" style={{width: "400px"}}>
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
