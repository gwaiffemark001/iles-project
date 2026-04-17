import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import "./Login.css";

const getDashboardRoute = (role) => {
  if (role === "workplace_supervisor") {
    return "/workplace-supervisor/dashboard";
  }

  if (role === "academic_supervisor") {
    return "/academic-supervisor/dashboard";
  }

  if (role === "student") {
    return "/student/dashboard";
  }

  return "/";
};

function Login() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLoginData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(loginData);

    if (!result.success) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.detail || "Login failed";

      setError(errorMessage);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <header className="auth-header">
          <img className="auth-logo" src="/ILES-Logo.png" alt="ILES logo" />
          <p className="auth-eyebrow">Welcome to ILES</p>
          <h1 className="auth-title">Internship Logging and Evaluation System</h1>
          <p className="auth-subtitle">Sign in to continue to your dashboard.</p>
        </header>

        <div className="login-card">
          <h2 className="login-card-title">Login</h2>

          <form className="login-form" onSubmit={handleLogin}>
            {error ? <div className="error-message">{error}</div> : null}

            <label className="form-group">
              <span>Username</span>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-group">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleChange}
                required
              />
            </label>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <p>
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>

        <footer className="auth-footer">
          <p>&copy; {new Date().getFullYear()} ILES</p>
        </footer>
      </div>
    </div>
  );
}

export default Login;
