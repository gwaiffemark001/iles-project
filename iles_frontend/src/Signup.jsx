import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Signup.css';
import './ILES.css';
import { useAuth } from './auth/useAuth'
import { roleToHomePath } from './routes/roleRedirect'

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [extraFields, setExtraFields] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [submitting, setSubmitting] = useState(false)

    const navigate = useNavigate();
    const { register, login } = useAuth()
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
        setSubmitting(true)

        try {
            const profile = await register({
                email,
                password,
                ...(extraFields
                    ? {
                        student_number: studentNumber,
                        registration_number: registrationNumber,
                    }
                    : {}),
            })

            if (!profile.success) {
                setErrorMessage(profile.error || 'Unable to create your account.')
                return
            }

            const username = email.includes('@') ? email.split('@')[0] : email
            const loginResult = await login({ usernameOrEmail: username, password })

            if (!loginResult.success) {
                setErrorMessage(loginResult.error || 'Account created, but sign-in failed.')
                return
            }

            setSuccessMessage('Account created successfully.')
            navigate(roleToHomePath(loginResult.user?.role), { replace: true })
        } catch (error) {
            setErrorMessage(error?.message || 'Unable to reach the server. Please try again later.');
        } finally {
            setSubmitting(false)
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

                    <button type="submit" className="login-btn" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create an Account'}
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