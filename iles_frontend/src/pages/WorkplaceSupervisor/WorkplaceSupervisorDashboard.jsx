import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";
import { logsAPI, placementsAPI } from "@/api/api";
import "./WorkplaceSupervisorDashboard.css";

const WorkplaceSupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [placementsRes, logsRes] = await Promise.all([
        placementsAPI.getPlacements(),
        logsAPI.getLogs(),
      ]);
      setPlacements(placementsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "draft") return "badge draft";
    if (status === "submitted") return "badge submitted";
    if (status === "reviewed") return "badge reviewed";
    if (status === "approved") return "badge approved";
    return "badge";
  };

  const getInternsData = () => {
    return placements.map(placement => {
      const internLogs = logs.filter(log => log.placement === placement.id);
      const pendingLogs = internLogs.filter(log => log.status === 'submitted').length;
      const totalLogs = internLogs.length;

      return {
        id: placement.student.id,
        name: `${placement.student.first_name} ${placement.student.last_name}`,
        department: placement.student.department || 'N/A',
        logs: totalLogs,
        status: pendingLogs > 0 ? 'Pending Review' : totalLogs > 0 ? 'Reviewed' : 'No Logs',
        placement: placement,
      };
    });
  };

  if (loading) return <div>Loading...</div>;

  const interns = getInternsData();
  const pendingReviews = logs.filter(log => log.status === 'submitted').length;
  const completedEvaluations = logs.filter(log => log.status === 'approved').length;

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
          <button className="nav-item logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">

        {/* Top Bar */}
        <div className="topbar">
          <div>
            <h1>Welcome back, {user?.first_name || user?.username}</h1>
            <p>Workplace Supervisor — Internship Logging & Evaluation System</p>
          </div>
          <div className="avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Assigned Interns</div>
            <div className="stat-num blue">{interns.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Logs Pending Review</div>
            <div className="stat-num amber">{pendingReviews}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Evaluations Done</div>
            <div className="stat-num green">{completedEvaluations}</div>
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
          {interns.map((intern) => (
            <div className="table-row" key={intern.id}>
              <div>{intern.name}</div>
              <div>{intern.department}</div>
              <div>{intern.logs}</div>
              <div><span className={getStatusClass(intern.status.toLowerCase().replace(' ', ''))}>{intern.status}</span></div>
              <div>
                <button className="eval-btn">
                  {intern.status === "Pending Review" ? "Review" : "View"}
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
