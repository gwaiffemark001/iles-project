import { useNavigate } from "react-router-dom";
import "./WorkplaceSupervisorDashboard.css";

const WorkplaceSupervisorDashboard = () => {
  const navigate = useNavigate();

  const interns = [
    { name: "Hope Mwelu", department: "Computer Science", logs: 12, status: "Pending" },
    { name: "Grace Ahurira", department: "Information Technology", logs: 8, status: "Reviewed" },
    { name: "Emma Michael", department: "Computer Engineering", logs: 3, status: "Overdue" },
  ];

  const getStatusClass = (status) => {
    if (status === "Pending") return "badge pending";
    if (status === "Reviewed") return "badge reviewed";
    if (status === "Overdue") return "badge overdue";
  };

  return (
    <div className="workplace-supervisor-dashboard">

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">ILES</div>
        <div className="sidebar-role">Workplace Supervisor</div>
        <div className="sidebar-divider" />
        <nav className="sidebar-nav">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">Assigned Interns</button>
          <button className="nav-item">Evaluate Logs</button>
          <button className="nav-item">Evaluation History</button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item logout" onClick={() => navigate("/")}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">

        {/* Top Bar */}
        <div className="topbar">
          <div>
            <h1>Welcome back, Mr. Smith</h1>
            <p>Workplace Supervisor — Internship Logging & Evaluation System</p>
          </div>
          <div className="avatar">MS</div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Assigned Interns</div>
            <div className="stat-num blue">8</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Logs Pending Review</div>
            <div className="stat-num amber">5</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Evaluations Done</div>
            <div className="stat-num green">12</div>
          </div>
        </div>

        {/* Interns Table */}
        <div className="section-title">Assigned Interns</div>
        <div className="intern-table">
          <div className="table-header">
            <div>Intern Name</div>
            <div>Department</div>
            <div>Logs Submitted</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          {interns.map((intern, index) => (
            <div className="table-row" key={index}>
              <div>{intern.name}</div>
              <div>{intern.department}</div>
              <div>{intern.logs}</div>
              <div><span className={getStatusClass(intern.status)}>{intern.status}</span></div>
              <div>
                <button className="eval-btn">
                  {intern.status === "Reviewed" ? "View" : "Evaluate"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default WorkplaceSupervisorDashboard;