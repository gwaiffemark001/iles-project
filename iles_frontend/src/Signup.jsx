import { Link } from 'react-router-dom';
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
            let body = { email, password };
            if (extraFields) {
                body.studentNumber = studentNumber;
                body.registrationNumber = registrationNumber;
            }

            const response = await fetch('http://localhost:8080/api/auth/signup', {
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
        } catch (error) {
            setErrorMessage('Unable to reach the server. Please try again later.');
        }
    };

    return (
        <div className="page_1">
            <header className="header_1">
                <h1 className="head">create an ILES account</h1>
                <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
            </header>

            <section className="logins" onSubmit={handleSignup}>
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
                        <p>Student email detected. Additional student fields can go here.</p>
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
            </section>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <section className="failed_login">
                <p className="signup">
                    <Link to="/">Back to Login</Link>
                </p>
                <p className="signup">
                    <Link to="/forgot-password">Forgot Password</Link>
                </p>
            </section>
        </div>
    );
}

export default Signup