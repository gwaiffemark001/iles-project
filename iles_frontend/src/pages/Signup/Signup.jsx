import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "./Signup.css";
import "../../ILES.css";

const initialFormData = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  role: "student",
  department: "",
  student_number: "",
  staff_number: "",
  password: "",
  confirmPassword: "",
};

function Signup() {
  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      department: formData.department.trim(),
      student_number: formData.role === "student" ? formData.student_number.trim() : "",
      staff_number: formData.role !== "student" ? formData.staff_number.trim() : "",
      password: formData.password,
    };

    const result = await register(payload);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || "Registration failed.");
      return;
    }

    navigate("/", {
      replace: true,
      state: {
        registrationSuccess: "Account created successfully. Sign in to continue.",
        suggestedUsername: payload.username,
      },
    });
  };

  const isStudent = formData.role === "student";

  return (
    <div className="page_1">
      <div className="centre_logins">
        <header className="header_1">
          <h1 className="head">Create an ILES account</h1>
          <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
          <p className="subhead">Set up your role and login details to access the platform.</p>
        </header>

        <form className="logins signup-form" onSubmit={handleSignup}>
          {errorMessage ? <div className="error-message">{errorMessage}</div> : null}

          <div className="signup-grid">
            <input
              type="text"
              name="first_name"
              placeholder="First name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="last_name"
              placeholder="Last name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-grid">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-grid">
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
            />
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="student">Student Intern</option>
              <option value="workplace_supervisor">Workplace Supervisor</option>
              <option value="academic_supervisor">Academic Supervisor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
          />

          {isStudent ? (
            <input
              type="text"
              name="student_number"
              placeholder="Student number"
              value={formData.student_number}
              onChange={handleChange}
            />
          ) : (
            <input
              type="text"
              name="staff_number"
              placeholder="Staff number"
              value={formData.staff_number}
              onChange={handleChange}
            />
          )}

          <div className="signup-grid">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

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
  );
}

export default Signup;
