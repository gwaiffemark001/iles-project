import { useNavigate } from "react-router-dom";
import "./AcademicSupervisorDashboard.css";

const AcademicSupervisorDashboard = () => {
  const navigate = useNavigate();

    return (
        <div className="dashboard-wrap">

            {/* Sidebar */}
            <div className="sidebar">
                    <div className="sidebar-logo">ILES</div>
                    <div className="sidebar-role">Academic Supervisor</div>
                    <div className="sidebar-divider" />
                    <nav className="sidebar-nav">
                        <button className="nav-item active">Dashboard</button>
                        <button className="nav-item">Assigned Students</button>
                        <button className="nav-item">View Evaluations</button>
                        <button className="nav-item">Reports</button>
                    </nav>
                    <div className="sidebar-bottom">
                        <button className="nav-item logout" onClick={() => navigate("/")}>
                            Logout
                        </button>
                    </div>
            </div>

                {/* Main Content */}
                <div className="main">
                    {/* Top Bar*/}
                    <div className="topbar">
                        <div>
                            <h1>Welcome back, Dr. Susan</h1>
                            <p>Academic Supervisor - Internship Logging & Evaluation System</p>
                        </div>
                        <div className="avatar">DS</div>
                    </div>

                    {/* Stats */}
                    <div className="stats">
                        <div className="stat-card">
                            <div className="stat-label">Assigned Students</div>
                            <div className="stat-num blue">10</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Logs Submitted</div>
                            <div className="stat-num amber">24</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Evaluations Completed</div>
                            <div className="stat-num green">18</div>
                        </div>
                    </div>
                </div>

            </div>
        );
};

export default AcademicSupervisorDashboard; 