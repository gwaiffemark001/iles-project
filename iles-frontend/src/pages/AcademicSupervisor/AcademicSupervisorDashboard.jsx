import { useNavigate } from "react-router-dom";
import "./AcademicSupervisorDashboard.css";

const AcademicSupervisorDashboard = () => {
  const navigate = useNavigate();

    return (
        <div className="dashboard-wrap">

            {/* Sidebar */}
            <div className="sidebar">
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
                    {/* Content coming soon */}
                </div>

            </div>
        );
};

export default AcademicSupervisorDashboard; 