import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/useAuth";
import { evaluationsAPI, getErrorMessage, logsAPI, placementsAPI } from "../../api/api";
import SupervisorEvaluationForm from "../components/SupervisorEvaluationForm";
import "./AcademicSupervisorDashboard.css";

const AcademicSupervisorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showEvalEditor, setShowEvalEditor] = useState(false);
  const [evalPlacement, setEvalPlacement] = useState(null);
  const [editingEvaluation, setEditingEvaluation] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [placementsRes, logsRes, evaluationsRes] = await Promise.all([
        placementsAPI.getPlacements(),
        logsAPI.getLogs(),
        evaluationsAPI.getEvaluations(),
      ]);

      setPlacements(Array.isArray(placementsRes.data) ? placementsRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setEvaluations(Array.isArray(evaluationsRes.data) ? evaluationsRes.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load academic dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchData();
    }
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const getStudentsData = () => {
    return placements.map((placement) => {
      const placementId = placement.id;
      const placementLogs = logs.filter((log) => (log.placement?.id ?? log.placement_id) === placementId);
      const pendingLogs = placementLogs.filter((log) => log.status === "submitted").length;
      const reviewedLogs = placementLogs.filter((log) => log.status === "reviewed").length;
      const approvedLogs = placementLogs.filter((log) => log.status === "approved").length;
      const totalLogs = placementLogs.length;

      let status = "No Logs";
      if (pendingLogs > 0) status = "Pending";
      else if (reviewedLogs > 0) status = "Reviewed";
      else if (approvedLogs > 0) status = "Approved";
      else if (totalLogs > 0) status = "Active";

      return {
        id: placement.id,
        studentId: placement.student?.id ?? placement.student,
        name:
          placement.student?.full_name ||
          placement.student?.username ||
          placement.student_name ||
          "Unknown Student",
        placementName: placement.company_name || "Unknown placement",
        companyAddress: placement.company_address || "Not provided",
        startDate: placement.start_date,
        endDate: placement.end_date,
        logs: totalLogs,
        logsData: placementLogs,
        pendingLogs,
        reviewedLogs,
        approvedLogs,
        status,
        statusLabel: status,
        placement,
      };
    });
  };

  const getStats = () => {
    const students = getStudentsData();
    return {
      assignedStudents: students.length,
      logsSubmitted: students.reduce((acc, student) => acc + student.logs, 0),
      evaluationsCompleted: evaluations.length,
      pendingReviews: students.reduce((acc, student) => acc + student.pendingLogs, 0),
      reviewedLogs: students.reduce((acc, student) => acc + student.reviewedLogs, 0),
      approvedLogs: students.reduce((acc, student) => acc + student.approvedLogs, 0),
    };
  };

  const getStatusClass = (status) => {
    if (status === "Pending") return "status-pending";
    if (status === "Reviewed") return "status-reviewed";
    if (status === "Approved") return "status-reviewed";
    if (status === "Active") return "status-active";
    return "status-overdue";
  };

  const formatDate = (value) => {
    if (!value) return "Not available";

    return new Intl.DateTimeFormat("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  };

  const openStudentPanel = (studentId) => {
    setSelectedStudentId(studentId);
    setActionError("");
    setActiveSection("students");
  };

  const openEvalEditor = (placement) => {
    setEvalPlacement(placement);
    setEditingEvaluation(null);
    setShowEvalEditor(true);
  };

  const closeEvalEditor = () => {
    setShowEvalEditor(false);
    setEvalPlacement(null);
    setEditingEvaluation(null);
  };

  const closeStudentPanel = () => {
    setSelectedStudentId(null);
    setActionError("");
  };

  const handleReviewLog = async (log) => {
    const comment = window.prompt(
      "Enter a review comment for this log:",
      log.supervisor_comment || "Reviewed by academic supervisor",
    );

    if (comment === null) {
      return;
    }

    try {
      setActionError("");
      setActionLoadingId(log.id);
      await logsAPI.reviewLog(log.id, { comment });
      await fetchData();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to review this log."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveLog = async (log) => {
    try {
      setActionError("");
      setActionLoadingId(log.id);
      await logsAPI.approveLog(log.id, {});
      await fetchData();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to approve this log."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviseLog = async (log) => {
    const comment = window.prompt(
      "Enter a revision note for this log:",
      "Please revise and resubmit.",
    );

    if (comment === null) {
      return;
    }

    try {
      setActionError("");
      setActionLoadingId(log.id);
      await logsAPI.reviseLog(log.id, { comment });
      await fetchData();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to send this log back for revision."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const stats = getStats();
  const students = getStudentsData();
  const selectedStudent = students.find((student) => student.id === selectedStudentId) || null;
  const selectedStudentLogs = selectedStudent ? selectedStudent.logsData : [];
  const recentEvaluations = [...evaluations].slice(0, 6);
  const reportRows = [
    { label: "Submitted logs", value: stats.logsSubmitted },
    { label: "Reviewed logs", value: stats.reviewedLogs },
    { label: "Approved logs", value: stats.approvedLogs },
    { label: "Evaluations recorded", value: stats.evaluationsCompleted },
  ];

  if (loading) {
    return (
      <div className="dashboard-wrap">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrap">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  const renderStudentTable = (showActionButton = true) => (
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
          <div style={{ gridColumn: "1 / -1" }}>No students assigned yet</div>
        </div>
      ) : (
        students.map((student) => (
          <div className="table-row" key={student.id}>
            <div>{student.name}</div>
            <div>{student.placementName}</div>
            <div>{student.logs}</div>
            <div>
              <span className={getStatusClass(student.status)}>{student.statusLabel}</span>
            </div>
            <div>
              {showActionButton ? (
                <button className="eval-btn" onClick={() => openStudentPanel(student.id)}>
                  {student.status === "Reviewed" || student.status === "Approved" ? "View" : "Evaluate"}
                </button>
              ) : (
                <button className="eval-btn" onClick={() => openStudentPanel(student.id)}>
                  Open logs
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderStudentPanel = () => {
    if (!selectedStudent) {
      return null;
    }

    return (
      <div style={studentPanelStyle}>
        <div style={studentPanelHeaderStyle}>
          <div>
            <h3 style={{ margin: "0 0 6px 0", color: "#0A1D37" }}>{selectedStudent.name}</h3>
            <p style={{ margin: 0, color: "#64748B" }}>{selectedStudent.placementName}</p>
          </div>
          <button className="nav-item" style={closeButtonStyle} onClick={closeStudentPanel}>
            Close
          </button>
        </div>

        {actionError ? <div className="error" style={{ marginBottom: "16px" }}>{actionError}</div> : null}

        {selectedStudentLogs.length === 0 ? (
          <p style={{ color: "#64748B" }}>No logs found for this student.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {selectedStudentLogs.map((log) => {
              const displayStatus = log.status === "submitted"
                ? "Pending"
                : log.status === "reviewed"
                  ? "Reviewed"
                  : log.status === "approved"
                    ? "Approved"
                    : "Active";

              return (
                <div key={log.id} style={studentLogCardStyle}>
                  <div style={studentLogHeaderStyle}>
                    <strong>Week {log.week_number}</strong>
                    <span className={getStatusClass(displayStatus)}>{log.status}</span>
                  </div>
                  <p style={studentLogTextStyle}><strong>Activities:</strong> {log.activities}</p>
                  <p style={studentLogTextStyle}><strong>Challenges:</strong> {log.challenges || "No challenges recorded."}</p>
                  <p style={studentLogTextStyle}><strong>Learning:</strong> {log.learning || "No learning notes recorded."}</p>
                  <p style={studentLogTextStyle}><strong>Supervisor Comment:</strong> {log.supervisor_comment || "No comment yet."}</p>
                  <p style={studentLogTextStyle}><strong>Deadline:</strong> {formatDate(log.deadline)}</p>
                  <div style={studentActionRowStyle}>
                    {log.status === "submitted" && (
                      <>
                        <button className="eval-btn" disabled={actionLoadingId === log.id} onClick={() => handleReviewLog(log)}>
                          {actionLoadingId === log.id ? "Saving..." : "Review"}
                        </button>
                        <button className="nav-item" style={secondaryActionButtonStyle} disabled={actionLoadingId === log.id} onClick={() => handleReviseLog(log)}>
                          Request Revision
                        </button>
                      </>
                    )}
                    {log.status === "reviewed" && (
                      <>
                        <button className="eval-btn" disabled={actionLoadingId === log.id} onClick={() => handleApproveLog(log)}>
                          {actionLoadingId === log.id ? "Saving..." : "Approve"}
                        </button>
                        <button className="nav-item" style={secondaryActionButtonStyle} disabled={actionLoadingId === log.id} onClick={() => handleReviseLog(log)}>
                          Request Revision
                        </button>
                      </>
                    )}
                    {log.status === "approved" && <span style={{ color: "#64748B" }}>Already approved</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button className="eval-btn" onClick={() => openEvalEditor(selectedStudent.placement)}>
            Evaluate Student
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrap">
      <div className="sidebar">
        <div className="sidebar-logo">ILES</div>
        <div className="sidebar-role">Academic Supervisor</div>
        <div className="sidebar-divider" />
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeSection === "overview" ? "active" : ""}`} onClick={() => setActiveSection("overview")}>
            Dashboard
          </button>
          <button className={`nav-item ${activeSection === "students" ? "active" : ""}`} onClick={() => setActiveSection("students")}>
            Assigned Students
          </button>
          <button className={`nav-item ${activeSection === "evaluations" ? "active" : ""}`} onClick={() => setActiveSection("evaluations")}>
            View Evaluations
          </button>
          <button className={`nav-item ${activeSection === "reports" ? "active" : ""}`} onClick={() => setActiveSection("reports")}>
            Reports
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item logout" onClick={() => navigate("/")}>Logout</button>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div>
            <h1>Welcome back, {user?.username || "Dr. Susan"}</h1>
            <p>Academic Supervisor - Internship Logging & Evaluation System</p>
          </div>
          <div className="avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : "DS"}
          </div>
        </div>

        {activeSection === "overview" && (
          <>
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

            <div className="section-title">Assigned Students</div>
            {renderStudentTable(true)}
          </>
        )}

        {activeSection === "students" && (
          <>
            <div className="section-title">Assigned Students</div>
            {renderStudentTable(false)}
            {renderStudentPanel()}
            {showEvalEditor && evalPlacement ? (
              <div style={{ padding: 16 }}>
                <SupervisorEvaluationForm
                  placementId={evalPlacement.id}
                  evaluatorId={user?.id}
                  evaluationType="academic"
                  existingEvaluation={editingEvaluation}
                  studentName={evalPlacement.student?.full_name || evalPlacement.student_name || 'Student'}
                  onSaved={() => {
                    toast.success('Evaluation saved successfully');
                    closeEvalEditor();
                    fetchData();
                  }}
                  onCancel={closeEvalEditor}
                />
              </div>
            ) : null}
          </>
        )}

        {activeSection === "evaluations" && (
          <>
            <div className="section-title">Evaluations</div>
            {recentEvaluations.length === 0 ? (
              <div className="intern-table">
                <div className="table-row">
                  <div style={{ gridColumn: "1 / -1" }}>No evaluations recorded yet.</div>
                </div>
              </div>
            ) : (
              <div className="intern-table">
                <div className="table-header">
                  <div>Student</div>
                  <div>Placement</div>
                  <div>Type</div>
                  <div>Score</div>
                  <div>Date</div>
                </div>
                {recentEvaluations.map((evaluation) => (
                  <div className="table-row" key={evaluation.id}>
                    <div>{evaluation.student?.full_name || evaluation.student?.username || "Unknown Student"}</div>
                    <div>{evaluation.placement?.company_name || "Unknown placement"}</div>
                    <div>{evaluation.evaluation_type}</div>
                    <div>{evaluation.score}</div>
                    <div>{formatDate(evaluation.evaluated_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === "reports" && (
          <>
            <div className="section-title">Reports</div>
            <div className="stats" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {reportRows.map((item) => (
                <div className="stat-card" key={item.label}>
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-num blue">{item.value}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicSupervisorDashboard

const studentPanelStyle = {
  marginTop: "24px",
  backgroundColor: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "20px",
};

const studentPanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  marginBottom: "16px",
};

const closeButtonStyle = {
  color: "#0A1D37",
  backgroundColor: "#EEF2FF",
  width: "auto",
};

const studentLogCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "14px",
  backgroundColor: "#f8fafc",
};

const studentLogHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "10px",
};

const studentLogTextStyle = {
  margin: "0 0 8px 0",
};

const studentActionRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const secondaryActionButtonStyle = {
  color: "#0A1D37",
  backgroundColor: "#EEF2FF",
  width: "auto",
};