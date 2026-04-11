import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login:", loginData);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="brand-icon">📝</div>
          <h2 className="brand-title">Internship Logging and Evaluation System</h2>
          <div className="login-card">
            <h3>Login</h3>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input type="email" name="email" placeholder="Email Address" value={loginData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="password" name="password" placeholder="Password" value={loginData.password} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn-primary">Login</button>
            </form>
            <p className="auth-link"><a href="#">Forgot Password?</a></p>
            <p className="auth-link">
              Don't have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/signup"); }}>
                Signup
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;