import { useState } from "react";
import "./Login.css";

const Login = () => {
  const [role, setRole = useState("Student");
  const [formData, setFormData] = useState({ id: "", password: "" });

  const roles = ["Student", "Supervisor", "Admin"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in as:", role, formData);
    // Backend login logic goes here
  };

  return (
    <div className="Login-wrap">
      <div className="login-left">
        <div className="login-logo">Internship Logging & Evaluation System</div>
        <div className="login-hero">
          <h1>Track your Internship Journey</h1>
          <p>Log weekly activities, receive evaluations and monitor your progress - all in one place.</p>
        </div>
        <div className="login-stats">
          <div className="stat-item"><span className="stat-num">120+</span><span className="stat-label">Active interns</span></div>
          <div className="stat-item"><span className="stat-num">40+</span><span className="stat-label">Supervisors</span></div>
          </div>
        </div>
   
      <div className="login-right">
        <h2 className="form-title">Welcome back!</h2>
        <p className="form-subtitle">Sign in to your account</p>

        <p className="role-label">Select your role:</p>
        <div className="role-options">
          {roles.map((r) => (
            <button
              key={r} className={'role-btn ' + (role === r ? "active" : "")} onClick={() => setRole(r)}>
                {r}
              </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student ID / Email</label>
            <input type="text" name="id" placeholder="Enter your Student Number" value={formData.id} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="forgot-password"><a href= "#">Forgot your password?</a></p>
      </div>
    </div>
  );
};

export default Login;