import { useNavigate } from "react-router-dom";
import "./AcademicSupervisorDashboard.css";

const AcademicSupervisorDashboard = () => {
  const navigate = useNavigate();

    const students = [
        { name: "Hope Mwelu", placement: "MTN Uganda", logs: 12, status: "Pending" },
        { name: "Grace Ahurira", placement: "Stanbic Bank", logs: 15, status: "Reviewed" },
        { name: "Emma Michael", placement: "Airtel Uganda", logs: 10, status: "Overdue" },
    ];

    const getStatusClass = (status) => {
        if (status === "Pending") return "status-pending";
        if (status === "Reviewed") return "status-reviewed";
        if (status === "Overdue") return "status-overdue";
    };

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

                    {/* Assigned Students Table */}
                    <div className="section-title">Assigned Students</div>
                    <div className="intern-table">
                        <div className="table-header">
                            <div>Student Name</div>
                            <div>Place of Internship</div>
                            <div>Logs Submitted</div>
                            <div>Status</div>
                            <div>Action</div>
                        </div>
                        {students.map((student, index) => (
                            <div className="table-row" key={index}>
                                <div>{student.name}</div>
                                <div>{student.placement}</div>
                                <div>{student.logs}</div>
                                <div><span className={getStatusClass(student.status)}>{student.status}</span></div>
                                <div>
                                    <button className="eval-btn" onClick={() => navigate("/academic-supervisor/students")}>
                                        {student.status === "Reviewed" ? "View" : "Evaluate"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        );
};

export default AcademicSupervisorDashboard; 