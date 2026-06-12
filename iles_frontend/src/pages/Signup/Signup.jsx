import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import PasswordField from '@/components/PasswordField';
import { roleToHomePath } from '../../routes/roleRedirect';
import { ROLE_OPTIONS, USER_ROLES } from '@/constants/appConstants';
import '../Login/Login.css';

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(USER_ROLES.STUDENT);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [staffNumber, setStaffNumber] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const navigate = useNavigate();
    const { register, login } = useAuth();
    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        // Role-specific validation
        if (role === 'student') {
            if (!studentNumber || !registrationNumber || !firstName || !lastName || !phone || !department) {
                setErrorMessage('Students must provide: first name, last name, phone, department, student number, and registration number.');
                return;
            }
        } else if (role === 'workplace_supervisor' || role === 'academic_supervisor') {
            if (!firstName || !lastName || !phone || !department) {
                setErrorMessage('Supervisors must provide: first name, last name, phone, and department. Staff number is optional.');
                return;
            }
        }

        try {
            const username = email.includes('@') ? email.split('@')[0] : email;
            const body = {
                username,
                email,
                password,
                role,
                first_name: firstName,
                last_name: lastName,
                phone,
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

            const result = await register(body);

            if (!result.success) {
                setErrorMessage(result.error || 'Signup failed.');
                return;
            }

            const loginResult = await login({ usernameOrEmail: username, password });

            if (!loginResult.success) {
                setErrorMessage(loginResult.error || 'Account created, but sign-in failed.');
                return;
            }

            setSuccessMessage('Account created successfully. Redirecting to your dashboard.');
            navigate(roleToHomePath(loginResult.user?.role), { replace: true });
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
                        className="form-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                    {ROLE_OPTIONS.map((option) => (
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
                    <input className="form-input"
                        type="tel"
                        placeholder="Phone (e.g. +256787870644 or 0787870644)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
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
