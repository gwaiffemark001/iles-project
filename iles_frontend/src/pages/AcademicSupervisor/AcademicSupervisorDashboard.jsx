import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/useAuth";
import { criteriaAPI, evaluationsAPI, getErrorMessage, logsAPI, placementsAPI } from "../../api/api";
import { buildWeeklyEvaluationSummaries } from "../../utils/evaluationSummary";
import SupervisorEvaluationForm from "../components/SupervisorEvaluationForm";
import NotificationPane from "../../components/NotificationPane";
import "./AcademicSupervisorDashboard.css";

const AcademicSupervisorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showEvalEditor, setShowEvalEditor] = useState(false);
  const [evalPlacement, setEvalPlacement] = useState(null);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(1);
  const [evaluatingLogId, setEvaluatingLogId] = useState(null);

  const fetchData = useCallback(async () => {

    try {
      setLoading(true);
      setError(null);

      const [placementsRes, logsRes, evaluationsRes, criteriaRes] = await Promise.all([
        placementsAPI.getPlacements(),
        logsAPI.getLogs(),
        evaluationsAPI.getEvaluations(),
        criteriaAPI.getCriteria(),
      ]);

      setPlacements(Array.isArray(placementsRes.data) ? placementsRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setEvaluations(Array.isArray(evaluationsRes.data) ? evaluationsRes.data : []);
      setCriteria(Array.isArray(criteriaRes.data) ? criteriaRes.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load academic dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await fetchData();
    };

    initializeData();
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
      evaluationsCompleted: evaluations.filter(
        (evaluation) =>
          evaluation.evaluation_type === 'academic'
          && Number(evaluation.evaluator?.id ?? evaluation.evaluator_id) === Number(user?.id),
      ).length,
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

  const openEvalEditor = (placement, weekNumber = 1, evaluation = null) => {
    setEvalPlacement(placement);
    setEditingEvaluation(evaluation);
    setSelectedWeekNumber(weekNumber);
    setShowEvalEditor(true);
  };

  useEffect(() => {
    if (evaluatingLogId) {
      const target = document.getElementById(`academic-inline-eval-${evaluatingLogId}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (showEvalEditor && evalPlacement) {
      const target = document.getElementById('academic-eval-editor-form');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [evaluatingLogId, showEvalEditor, evalPlacement]);

  const getExistingEvaluationForLog = (log) => evaluations.find(
    (evaluation) => (
      Number(evaluation.placement?.id ?? evaluation.placement_id) === Number(log.placement?.id ?? log.placement_id)
      && evaluation.evaluation_type === 'academic'
      && Number(evaluation.evaluator?.id ?? evaluation.evaluator_id) === Number(user?.id)
      && Number(evaluation.week_number) === Number(log.week_number)
    ),
  );

  const academicEvaluations = useMemo(() => {
    return evaluations.filter(
      (evaluation) => (
        evaluation.evaluation_type === 'academic'
        && Number(evaluation.evaluator?.id ?? evaluation.evaluator_id) === Number(user?.id)
      ),
    );
  }, [evaluations, user?.id]);

  const getNextAcademicWeek = useCallback((placementId) => {
    const placementLogWeeks = logs
      .filter((log) => Number(log.placement?.id ?? log.placement_id) === Number(placementId))
      .map((log) => Number(log.week_number || 1))
      .filter((weekNumber, index, array) => array.indexOf(weekNumber) === index)
      .sort((left, right) => left - right);

    const evaluatedWeeks = new Set(
      academicEvaluations
        .filter((evaluation) => Number(evaluation.placement?.id ?? evaluation.placement_id) === Number(placementId))
        .map((evaluation) => Number(evaluation.week_number || 1))
        .filter((weekNumber) => !Number.isNaN(weekNumber)),
    );

    const maxKnownWeek = Math.max(1, ...placementLogWeeks, ...Array.from(evaluatedWeeks));
    let nextWeekNumber = 1;
    while (evaluatedWeeks.has(nextWeekNumber) && nextWeekNumber <= maxKnownWeek + 1) {
      nextWeekNumber += 1;
    }
    return nextWeekNumber;
  }, [logs, academicEvaluations]);

  const { weeklySummaries: allWeeklySummaries } = useMemo(
    () => buildWeeklyEvaluationSummaries(evaluations, placements, logs, criteria),
    [evaluations, placements, logs, criteria]
  );

  const groupedSummaries = useMemo(() => {
    const groups = new Map();
    allWeeklySummaries.forEach((summary) => {
      const placementId = Number(summary.placementId);
      if (Number.isNaN(placementId)) return;
      if (!groups.has(placementId)) {
        groups.set(placementId, {
          placementId,
          placementName: summary.placementName || 'Unknown Placement',
          weeks: [],
          placementAverageScore: null,
          placementAverageGPA: null,
        });
      }
      groups.get(placementId).weeks.push(summary);
    });

    // Include all tracked weeks so missed-log weeks still count as zero.
    const results = Array.from(groups.values());
    results.forEach((g) => {
      if (g.weeks.length > 0) {
        g.placementAverageScore = Number((g.weeks.reduce((t, w) => t + Number(w.combined_score || 0), 0) / g.weeks.length).toFixed(2));
        g.placementAverageGPA = Number((g.weeks.reduce((t, w) => t + Number(w.grade_weight || 0), 0) / g.weeks.length).toFixed(2));
      }
    });
    return results;
  }, [allWeeklySummaries]);

  const academicStudentCards = useMemo(() => {
    return placements.map((placement) => {
      const placementId = placement.id;
      const placementSummary = groupedSummaries.find((group) => Number(group.placementId) === Number(placementId));
      const placementWeeks = placementSummary?.weeks || [];
      const placementLogWeeks = logs
        .filter((log) => Number(log.placement?.id ?? log.placement_id) === Number(placementId))
        .map((log) => Number(log.week_number || 1))
        .filter((weekNumber, index, array) => array.indexOf(weekNumber) === index)
        .sort((left, right) => left - right);
      const evaluatedWeeks = new Set(
        academicEvaluations
          .filter((evaluation) => Number(evaluation.placement?.id ?? evaluation.placement_id) === Number(placementId))
          .map((evaluation) => Number(evaluation.week_number || 1))
          .filter((weekNumber) => !Number.isNaN(weekNumber)),
      );
      const maxKnownWeek = Math.max(1, ...placementLogWeeks, ...Array.from(evaluatedWeeks));
      let nextWeekNumber = 1;
      while (evaluatedWeeks.has(nextWeekNumber) && nextWeekNumber <= maxKnownWeek + 1) {
        nextWeekNumber += 1;
      }
      const canAddEvaluation = placementLogWeeks.includes(nextWeekNumber);
      
      // Check if the log for nextWeekNumber is in draft status - if so, disable evaluation
      const nextWeekLog = logs.find(
        (log) => Number(log.placement?.id ?? log.placement_id) === Number(placementId) &&
                 Number(log.week_number) === Number(nextWeekNumber)
      );
      const canAddEvaluationFinal = canAddEvaluation && nextWeekLog && nextWeekLog.status !== 'draft';

      return {
        placement,
        placementId,
        placementName: placement.company_name || 'Unknown Placement',
        studentName:
          placement.student?.full_name ||
          placement.student?.username ||
          placement.student_name ||
          'Unknown Student',
        weeks: placementWeeks,
        placementAverageScore: placementSummary?.placementAverageScore ?? null,
        placementAverageGPA: placementSummary?.placementAverageGPA ?? null,
        nextWeekNumber,
        canAddEvaluation: canAddEvaluationFinal,
      };
    });
  }, [placements, groupedSummaries, logs, academicEvaluations]);

  const closeEvalEditor = () => {
    setShowEvalEditor(false);
    setEvalPlacement(null);
    setEditingEvaluation(null);
    setSelectedWeekNumber(1);
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
              const nextWeekNumber = getNextAcademicWeek(log.placement?.id ?? log.placement_id);
              const canEvaluateThisLog = Number(log.week_number) === Number(nextWeekNumber);
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
                  {log.status === 'submitted' ? (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        className="eval-btn"
                        disabled={!canEvaluateThisLog}
                        onClick={() => {
                          if (canEvaluateThisLog) {
                            setEvaluatingLogId(log.id);
                          } else {
                            toast.error(`Week ${nextWeekNumber} must be evaluated first`);
                          }
                        }}
                        title={canEvaluateThisLog ? 'Evaluate this week' : `Week ${nextWeekNumber} must be evaluated first`}
                      >
                        {getExistingEvaluationForLog(log) ? 'Edit Weekly Evaluation' : 'Evaluate This Week'}
                      </button>
                    </div>
                  ) : log.status === 'draft' ? (
                    <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#FEF3C7', borderRadius: '4px', color: '#92400E', fontSize: '13px' }}>
                      ⚠️ This log is still in draft status. The student must submit it before you can evaluate.
                    </div>
                  ) : null}
                  {evaluatingLogId === log.id ? (
                    <div id={`academic-inline-eval-${log.id}`} style={{ marginTop: '16px' }}>
                      <SupervisorEvaluationForm
                        placementId={log.placement?.id ?? log.placement_id}
                        evaluatorId={user?.id}
                        evaluationType="academic"
                        existingEvaluation={getExistingEvaluationForLog(log)}
                        initialWeekNumber={log.week_number}
                        studentName={selectedStudent.name}
                        onSaved={() => {
                          toast.success('Evaluation saved successfully');
                          setEvaluatingLogId(null);
                          fetchData();
                        }}
                        onCancel={() => setEvaluatingLogId(null)}
                      />
                    </div>
                  ) : null}
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
          <button className="eval-btn" onClick={() => openEvalEditor(selectedStudent.placement, (selectedStudentLogs.find((log) => !getExistingEvaluationForLog(log))?.week_number) || (selectedStudentLogs.length ? Math.max(...selectedStudentLogs.map((log) => Number(log.week_number || 1))) + 1 : 1))}>
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
          <button className={`nav-item ${activeSection === "notifications" ? "active" : ""}`} onClick={() => setActiveSection("notifications")}>
            Notifications
          </button>
           <button className={`nav-item ${activeSection === "criteria" ? "active" : ""}`} onClick={() => setActiveSection("criteria")}>
             Criteria
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
        {activeSection === 'notifications' && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Notifications</div>
            <NotificationPane title="Notifications" subtitle="Log and evaluation updates" limit={8} />
          </div>
        )}

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
                  initialWeekNumber={selectedWeekNumber}
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
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Evaluations</span>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Use each student card to add or edit weekly evaluations.</span>
            </div>
            
            {academicStudentCards.length === 0 ? (
              <div className="intern-table">
                <div className="table-row">
                  <div style={{ gridColumn: "1 / -1" }}>No evaluations recorded yet.</div>
                </div>
              </div>
            ) : (
              academicStudentCards.map((group) => {
                return (
                  <div key={group.placementId} style={{ marginBottom: '18px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{group.placementName}</h3>
                        <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                          <strong>Student:</strong> {group.studentName}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="eval-btn"
                        disabled={!group.canAddEvaluation}
                        onClick={() => {
                          if (group.canAddEvaluation) {
                            openEvalEditor(group.placement, group.nextWeekNumber, null);
                          } else {
                            toast.error(`Week ${group.nextWeekNumber} must have a submitted log before adding an evaluation`);
                          }
                        }}
                        title={group.canAddEvaluation ? `Add evaluation for Week ${group.nextWeekNumber}` : `Week ${group.nextWeekNumber} log is required before evaluating`}
                      >
                        Add Evaluation
                      </button>
                    </div>
                    {group.weeks.length === 0 ? (
                      <p style={{ color: '#64748b', margin: 0 }}>No evaluations recorded yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                        {group.weeks.map((w) => {
                          const evalToEdit = academicEvaluations.find(
                            (evaluation) => Number(evaluation.placement?.id ?? evaluation.placement_id) === Number(group.placementId)
                              && Number(evaluation.week_number) === Number(w.week_number)
                              && evaluation.evaluation_type === 'academic'
                          );
                          const otherSupervisorSubmitted = w.supervisor_score !== null && w.supervisor_score !== undefined;
                          const supervisorCriteria = w.supervisorEvaluation?.items?.[0]?.criteria?.name || 'Not specified';
                          const academicCriteria = w.academicEvaluation?.items?.[0]?.criteria?.name || 'Not specified';

                          return (
                            <div
                              key={w.key}
                              style={{
                                padding: '12px',
                                background: '#f7f9fc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Week {w.week_number}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                    Workplace: <strong>{w.log_status === 'missing' ? 0 : (w.supervisor_score ?? 'N/A')}</strong>
                                    {w.supervisorEvaluation && <span style={{ fontSize: '11px', color: '#7c3aed', marginLeft: '6px' }}>({supervisorCriteria})</span>}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                    Academic: <strong>{w.log_status === 'missing' ? 0 : (w.academic_score ?? 'N/A')}</strong>
                                    {w.academicEvaluation && <span style={{ fontSize: '11px', color: '#7c3aed', marginLeft: '6px' }}>({academicCriteria})</span>}
                                  </div>
                                  {w.log_status === 'missing' ? (
                                    <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>No log submitted for this week. Scores are zero.</div>
                                  ) : null}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                <div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total Score</div>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{w.combined_score ?? 'N/A'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>GPA</div>
                                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>{w.grade_weight ?? 'N/A'}</div>
                                </div>
                              </div>
                              {w.log_status !== 'missing' && evalToEdit ? (
                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="eval-btn"
                                    onClick={() => openEvalEditor(group.placement, w.week_number, evalToEdit || null)}
                                  >
                                    Edit Evaluation
                                  </button>
                                </div>
                              ) : null}
                              {w.log_status !== 'missing' && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                                  <div><strong>Your evaluation:</strong> {evalToEdit ? 'Edit' : 'Add'}</div>
                                  <div><strong>Other evaluation:</strong> {otherSupervisorSubmitted ? 'Already submitted' : 'Not yet submitted'}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ marginTop: '12px', textAlign: 'right', color: '#475569' }}>
                      <strong>Average Score:</strong> {group.placementAverageScore != null ? group.placementAverageScore.toFixed(2) : '0.00'}
                      <span style={{ marginLeft: '12px' }}><strong>Average GPA:</strong> {group.placementAverageGPA != null ? group.placementAverageGPA.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                );
              })
            )}
            
            {showEvalEditor && evalPlacement ? (
              <div id="academic-eval-editor-form" style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>
                  {editingEvaluation ? `Edit Week ${editingEvaluation.week_number} Evaluation` : 'Create New Evaluation'}
                </h3>
                <SupervisorEvaluationForm
                  placementId={evalPlacement.id}
                  evaluatorId={user?.id}
                  evaluationType="academic"
                  existingEvaluation={editingEvaluation}
                  initialWeekNumber={selectedWeekNumber}
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

        {activeSection === "criteria" && (
          <>
            <div className="section-title">Evaluation Criteria</div>
            {criteria.length === 0 ? (
              <div className="intern-table">
                <div className="table-row">
                  <div style={{ gridColumn: "1 / -1" }}>No criteria defined yet.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {criteria.map((crit) => (
                  <div key={crit.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{crit.name}</div>
                    {crit.description && <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{crit.description}</p>}
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}><strong>Max Score:</strong> {crit.max_score}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}><strong>Workplace Share:</strong> {crit.supervisor_share}%</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}><strong>Academic Share:</strong> {crit.academic_share}%</div>
                  </div>
                ))}
              </div>
            )}
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