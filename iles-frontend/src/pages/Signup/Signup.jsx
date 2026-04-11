import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const [role, setRole] = useState("Student");
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const roles = [
    { label: "Student", icon: "🎓" },
    { label: "Workplace Supervisor", icon: "👨‍💼" },
    { label: "Academic Supervisor", icon: "👨‍💻" },
  ];

  const handleChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("Signup as:", role, signupData);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-right">
        <div className="auth-right-inner">
          <h2 className="signup-title">System Signup</h2>
          <p className="signup-sub">I am a...</p>
          <div className="role-grid">
            {roles.map((r) => (
              <button key={r.label} className={`role-card ${role === r.label ? "active" : ""}`} onClick={() => setRole(r.label)}>
                <span className="role-icon">{r.icon}</span>
                <span className="role-name">{r.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <input type="text" name="name" placeholder="Full Name" value={signupData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <input type="email" name="email" placeholder="Institutional Email" value={signupData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <input type="password" name="password" placeholder="Choose Password" value={signupData.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary">Create Account</button>
          </form>
          <p className="auth-link">
            Already have an account?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;