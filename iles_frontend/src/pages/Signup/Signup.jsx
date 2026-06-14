import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { getErrorMessage } from '@/api/api';
import PasswordField from '@/components/PasswordField';
import { ROLE_OPTIONS, USER_ROLES } from '@/constants/appConstants';
import '../Login/Login.css';

function Signup() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(USER_ROLES.STUDENT);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+256');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [staffNumber, setStaffNumber] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const { register } = useAuth();
    const signupRoleOptions = ROLE_OPTIONS.filter(
        (option) => option.value !== USER_ROLES.ADMIN,
    );

    const countryPhoneRules = {
        '+254': { label: 'Kenya', digits: 9 },
        '+256': { label: 'Uganda', digits: 9 },
        '+1': { label: 'USA/Canada', digits: 10 },
        '+44': { label: 'United Kingdom', digits: 10 },
        '+91': { label: 'India', digits: 10 },
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        // Client-side validation
        const cleanedEmail = (email || '').trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(cleanedEmail)) {
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        const cleanedPhone = phone.replace(/\D/g, '');
        const phoneRule = countryPhoneRules[phoneCountryCode];
        if (!phoneRule) {
            setErrorMessage('Please select a valid country code.');
            return;
        }
        if (!cleanedPhone) {
            setErrorMessage('Please enter a phone number.');
            return;
        }
        if (cleanedPhone.length !== phoneRule.digits) {
            setErrorMessage(`Please enter a ${phoneRule.digits}-digit phone number for ${phoneRule.label}.`);
            return;
        }
        const normalizedPhone = `${phoneCountryCode}${cleanedPhone}`;

        if (!username.trim()) {
            setErrorMessage('Username is required.');
            return;
        }

        if (role === 'student') {
            if (!studentNumber || !registrationNumber || !firstName || !lastName || !phone || !department) {
                setErrorMessage('Students must provide: username, first name, last name, phone, department, student number, and registration number.');
                return;
            }
        } else if (role === 'workplace_supervisor' || role === 'academic_supervisor') {
            if (!firstName || !lastName || !phone || !department) {
                setErrorMessage('Supervisors must provide: username, first name, last name, phone, and department. Staff number is optional.');
                return;
            }
        }

        try {
            const usernameValue = username.trim();
            const body = {
                username: usernameValue,
                email: cleanedEmail,
                password,
                confirm_password: password,
                role,
                first_name: firstName,
                last_name: lastName,
                phone: normalizedPhone,
                department,
                ...(role === 'student'
                    ? {
                        student_number: studentNumber,
                        registration_number: registrationNumber,
                    }
                    : role === 'workplace_supervisor' || role === 'academic_supervisor'
                        ? { staff_number: staffNumber || null }
                        : {}),
            };

            await register(body);

            // New flow: account requires email activation. Inform the user and do not auto-login.
            setSuccessMessage('Account created. Please check your email for an activation link before signing in.');
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to reach the server. Please try again later.'));
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
                        className="form-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                    {signupRoleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                    ))}
                    </select>
                    <input className="form-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input className="form-input"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <PasswordField
                        className="form-input"
                        id="signup-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <input className="form-input"
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                    <input className="form-input"
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                    <div className="phone-field-grid">
                        <select
                            className="form-select"
                            value={phoneCountryCode}
                            onChange={(e) => setPhoneCountryCode(e.target.value)}
                            required
                        >
                            {Object.entries(countryPhoneRules).map(([code, info]) => (
                                <option key={code} value={code}>
                                    {code} {info.label}
                                </option>
                            ))}
                        </select>
                        <input className="form-input"
                            type="text"
                            placeholder={`Enter ${countryPhoneRules[phoneCountryCode].digits} digits`}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            required
                        />
                    </div>
                    <input className="form-input"
                        type="text"
                        placeholder="Department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
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

                    {(role === 'workplace_supervisor' || role === 'academic_supervisor') && (
                        <div className="extra-fields">
                            <p className='student_detected'>Supervisor account detected! Staff number is optional</p>
                            <input
                                type="text"
                                placeholder="Staff Number (optional)"
                                value={staffNumber}
                                onChange={(e) => setStaffNumber(e.target.value)}
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
                    <section className="failed_login" style={{width: "480px"}}>
                        <p className="signup">
                            <Link to="/login">Back to Login</Link>
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
