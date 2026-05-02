import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { logsAPI, placementsAPI, evaluationsAPI } from "../../api/api";
import { getErrorMessage } from "../../api/api";
import { toast } from "react-toastify";
import "./AcademicSupervisorDashboard.css";

const AcademicSupervisorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [placementsRes, logsRes, evaluationsRes] = await Promise.all([
        placementsAPI.getPlacements(),
        logsAPI.getLogs(),
        evaluationsAPI.getEvaluations(),
      ]);
      
      // Backend already filters by logged-in user based on role
      setPlacements(placementsRes.data);
      setLogs(logsRes.data);
      setEvaluations(evaluationsRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Process placements into student data
  const getStudentsData = () => {
    return placements.map((placement) => {
      const placementId = placement.id;
      const placementLogs = logs.filter(log => 
        (log.placement?.id ?? log.placement_id) === placementId
      );
      
      const pendingLogs = placementLogs.filter(log => log.status === 'submitted').length;
      const reviewedLogs = placementLogs.filter(log => log.status === 'reviewed').length;
      const approvedLogs = placementLogs.filter(log => log.status === 'approved').length;
      const totalLogs = placementLogs.length;

      // Determine status based on log states
      let status = "No Logs";
      if (pendingLogs > 0) status = "Pending";
      else if (reviewedLogs > 0) status = "Reviewed";
      else if (approvedLogs > 0) status = "Approved";
      else if (totalLogs > 0) status = "Active";

      return {
        id: placement.id,
        studentId: placement.student?.id ?? placement.student,
        name: placement.student?.full_name || 
              placement.student?.username || 
              placement.student_name || 
              "Unknown Student",
        placement: placement.company_name,
        companyAddress: placement.company_address || 'Not provided',
        startDate: placement.start_date,
        endDate: placement.end_date,
        logs: totalLogs,
        pendingLogs,
        reviewedLogs,
        approvedLogs,
        status,
        statusLabel: status,
        placement: placement,
      };
    });
  };

  const getStats = () => {
    const students = getStudentsData();
    return {
      assignedStudents: students.length,
      logsSubmitted: students.reduce((acc, s) => acc + s.logs, 0),
      evaluationsCompleted: students.filter(s => s.status === 'Approved').length,
      pendingReviews: students.reduce((acc, s) => acc + s.pendingLogs, 0),
    };
  };

  const getStatusClass = (status) => {
    if (status === "Pending") return "status-pending";
    if (status === "Reviewed") return "status-reviewed";
    if (status === "Approved") return "status-reviewed";
    if (status === "Active") return "status-active";
    return "status-overdue";
  };
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
  const handleViewLogs = (placement) => {
    // Navigate to logs view or open modal
    console.log("View logs for placement:", placement.id);
  };

  const stats = getStats();
  const students = getStudentsData();

  if (loading) return (
    <div className="dashboard-wrap">
      <div className="loading">Loading...</div>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-wrap">
      <div className="error">Error: {error}</div>
    </div>
  );

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
            <h1>Welcome back, {user?.username || 'Dr. Susan'}</h1>
            <p>Academic Supervisor - Internship Logging & Evaluation System</p>
          </div>
          <div className="avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'DS'}
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Assigned Students</div>
            <div className="stat-num blue">{stats.assignedStudents}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Logs Submitted</div>
            <div className="stat-num amber">{stats.logsSubmitted}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Evaluations Completed</div>
            <div className="stat-num green">{stats.evaluationsCompleted}</div>
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
          {students.length === 0 ? (
            <div className="table-row">
              <div colSpan="5">No students assigned yet</div>
            </div>
          ) : (
            students.map((student) => (
              <div className="table-row" key={student.id}>
                <div>{student.name}</div>
                <div>{student.placement}</div>
                <div>{student.logs}</div>
                <div><span className={getStatusClass(student.status)}>{student.statusLabel}</span></div>
                <div>
                  <button className="eval-btn" onClick={() => handleViewLogs(student.placement)}>
                    {student.status === "Reviewed" || student.status === "Approved" ? "View" : "Evaluate"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default AcademicSupervisorDashboard; 