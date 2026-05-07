import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { criteriaAPI, evaluationsAPI, getErrorMessage, logsAPI, placementsAPI } from '../../api/api'
import { buildWeeklyEvaluationSummaries } from '../../utils/evaluationSummary'
import { useAuth } from '../../contexts/useAuth'
import SupervisorEvaluationForm from '../components/SupervisorEvaluationForm'
import NotificationPane from '../../components/NotificationPane'
import './WorkplaceSupervisorDashboard.css'

function normalizePlacement(placement, logs, evaluations) {
  const placementId = placement.id
  const internLogs = logs.filter((log) => (log.placement?.id ?? log.placement_id) === placementId)
  const placementEvaluations = evaluations.filter((evaluation) => (evaluation.placement?.id ?? evaluation.placement_id) === placementId)
  const supervisorEvaluation = placementEvaluations.find((evaluation) => evaluation.evaluation_type === 'supervisor')

  return {
    id: placementId,
    placement,
    studentName: placement.student?.full_name || placement.student?.username || 'Unknown Student',
    studentDepartment: placement.student?.department || 'Not specified',
    studentNumber: placement.student?.student_number || 'Not assigned',
    companyName: placement.company_name || 'Not specified',
    companyAddress: placement.company_address || 'Not provided',
    startDate: placement.start_date,
    endDate: placement.end_date,
    status: placement.status || 'pending',
    draftLogs: internLogs.filter((log) => log.status === 'draft').length,
    submittedLogs: internLogs.filter((log) => log.status === 'submitted').length,
    reviewedLogs: internLogs.filter((log) => log.status === 'reviewed').length,
    approvedLogs: internLogs.filter((log) => log.status === 'approved').length,
    totalLogs: internLogs.length,
    evaluationScore: supervisorEvaluation?.weighted_score ?? supervisorEvaluation?.score ?? null,
    evaluatedAt: supervisorEvaluation?.evaluated_at || null,
  }
}

export default function WorkplaceSupervisorDashboard() {
  const { user, logout } = useAuth()
  const [placements, setPlacements] = useState([])
  const [logs, setLogs] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [criteria, setCriteria] = useState([])
  const [selectedPlacement, setSelectedPlacement] = useState(null)
  const [activeTab, setActiveTab] = useState('placements')
  const [filterStatus, setFilterStatus] = useState('all')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEvalEditor, setShowEvalEditor] = useState(false)
  const [evalPlacement, setEvalPlacement] = useState(null)
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(1)
  const [evaluatingLogId, setEvaluatingLogId] = useState(null)
  const [editingEvaluation, setEditingEvaluation] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [placementsResponse, logsResponse, evaluationsResponse, criteriaResponse] = await Promise.all([
        placementsAPI.getPlacements(),
        logsAPI.getLogs(),
        evaluationsAPI.getEvaluations(),
        criteriaAPI.getCriteria(),
      ])
      setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : [])
      setLogs(Array.isArray(logsResponse.data) ? logsResponse.data : [])
      setEvaluations(Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : [])
      setCriteria(Array.isArray(criteriaResponse.data) ? criteriaResponse.data : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load workplace dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData();
  }, [loadData])

  const interns = useMemo(
    () => placements.map((placement) => normalizePlacement(placement, logs, evaluations)),
    [placements, logs, evaluations],
  )

  const stats = useMemo(() => ({
    totalInterns: interns.length,
    pendingReviews: interns.reduce((total, intern) => total + intern.submittedLogs, 0),
    approvedLogs: interns.reduce((total, intern) => total + intern.approvedLogs, 0),
    activePlacements: interns.filter((intern) => intern.status === 'active').length,
  }), [interns])

  // Get evaluations filtered for workplace supervisors (evaluation_type = 'supervisor')
  const supervisorEvaluations = useMemo(() => {
    return evaluations.filter(e => e.evaluation_type === 'supervisor');
  }, [evaluations]);

  const getNextSupervisorWeek = useCallback((placementId) => {
    const placementLogWeeks = logs
      .filter((log) => Number(log.placement?.id ?? log.placement_id) === Number(placementId))
      .map((log) => Number(log.week_number || 1))
      .filter((weekNumber, index, array) => array.indexOf(weekNumber) === index)
      .sort((left, right) => left - right);

    const evaluatedWeeks = new Set(
      supervisorEvaluations
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
  }, [logs, supervisorEvaluations]);

  // Build weekly summaries from all evaluation types so both scores appear on each card.
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

  const workplaceStudentCards = useMemo(() => {
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
        supervisorEvaluations
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
          placement.student?.full_name
          || placement.student?.username
          || placement.student_name
          || 'Unknown Student',
        weeks: placementWeeks,
        placementAverageScore: placementSummary?.placementAverageScore ?? null,
        placementAverageGPA: placementSummary?.placementAverageGPA ?? null,
        nextWeekNumber,
        canAddEvaluation: canAddEvaluationFinal,
      };
    });
  }, [placements, groupedSummaries, logs, supervisorEvaluations]);

  const filteredLogs = selectedPlacement
    ? logs.filter((log) => (log.placement?.id ?? log.placement_id) === selectedPlacement.id)
    : []

  const handlePlacementSelect = (placement) => {
    setSelectedPlacement(placement)
    setActiveTab('logs')
  }

  const openEvaluationEditor = (placement, weekNumber = 1, evaluation = null) => {
    setEvalPlacement(placement)
    setSelectedWeekNumber(weekNumber)
    setEditingEvaluation(evaluation)
    setShowEvalEditor(true)
  }

  useEffect(() => {
    if (evaluatingLogId) {
      const target = document.getElementById(`workplace-inline-eval-${evaluatingLogId}`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (showEvalEditor && evalPlacement) {
      const target = document.getElementById('workplace-eval-editor-form')
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [evaluatingLogId, showEvalEditor, evalPlacement])

  const closeEvaluationEditor = () => {
    setShowEvalEditor(false)
    setEvalPlacement(null)
    setSelectedWeekNumber(1)
    setEditingEvaluation(null)
  }

  const handleReviewLog = async (logId, supervisorComment) => {
    try {
      await logsAPI.reviewLog(logId, { comment: supervisorComment })
      toast.success('Log reviewed successfully')
      setComment('')
      await loadData()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    }
  }

  const handleApproveLog = async (logId) => {
    try {
      await logsAPI.approveLog(logId, {})
      toast.success('Log approved successfully')
      setComment('')
      await loadData()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    }
  }

  const getExistingEvaluationForLog = (log) => evaluations.find(
    (evaluation) => (
      Number(evaluation.placement?.id ?? evaluation.placement_id) === Number(log.placement?.id ?? log.placement_id)
      && evaluation.evaluation_type === 'supervisor'
      && Number(evaluation.week_number) === Number(log.week_number)
    ),
  )

  const handleRejectLog = async (logId, supervisorComment) => {
    try {
      // Send to revise endpoint (supervisor requests revision)
      await logsAPI.reviseLog(logId, { comment: supervisorComment })
      toast.success('Revision requested (sent back to draft)')
      setComment('')
      await loadData()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    }
  }

  if (loading) {
    return <div className="workplace-dashboard"><div className="workplace-loading">Loading...</div></div>
  }

  if (error) {
    return <div className="workplace-dashboard"><div className="workplace-error">Error: {error}</div></div>
  }

  return (
    <div className="workplace-dashboard">
      <aside className="workplace-sidebar">
        <div className="workplace-brand">ILES</div>
        <div className="workplace-role">Workplace Supervisor</div>
        <div className="workplace-sidebar-divider" />
        <div className="workplace-sidebar-nav">
          <button className={`workplace-nav-item ${activeTab === 'placements' ? 'active' : ''}`} onClick={() => setActiveTab('placements')}>My Interns</button>
          <button className={`workplace-nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Weekly Logs</button>
          <button className={`workplace-nav-item ${activeTab === 'evaluations' ? 'active' : ''}`} onClick={() => setActiveTab('evaluations')}>Evaluations</button>
          <button className={`workplace-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
           <button className={`workplace-nav-item ${activeTab === 'criteria' ? 'active' : ''}`} onClick={() => setActiveTab('criteria')}>Criteria</button>
        </div>
        <div className="workplace-sidebar-bottom">
          <button className="workplace-nav-item logout" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="workplace-main">
        <header className="workplace-topbar">
          <div>
            <span className="workplace-kicker">Dashboard</span>
            <h1>Workplace Supervisor</h1>
            <span className="workplace-subtitle">Welcome back, {user?.username}</span>
          </div>
          <div className="workplace-profile">
            <div className="workplace-profile-copy">
              <strong>{user?.username}</strong>
              <span>Workplace Supervisor</span>
            </div>
            <div className="workplace-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        

        <section className="workplace-stat-grid">
          <div className="workplace-stat-card blue"><span className="workplace-stat-label">Total Interns</span><span className="workplace-stat-value">{stats.totalInterns}</span><span className="workplace-stat-hint">Assigned to you</span></div>
          <div className="workplace-stat-card amber"><span className="workplace-stat-label">Pending Reviews</span><span className="workplace-stat-value">{stats.pendingReviews}</span><span className="workplace-stat-hint">Awaiting review</span></div>
          <div className="workplace-stat-card green"><span className="workplace-stat-label">Approved Logs</span><span className="workplace-stat-value">{stats.approvedLogs}</span><span className="workplace-stat-hint">This period</span></div>
          <div className="workplace-stat-card violet"><span className="workplace-stat-label">Active Placements</span><span className="workplace-stat-value">{stats.activePlacements}</span><span className="workplace-stat-hint">Currently active</span></div>
        </section>

        <nav className="workplace-tabs">
          <button className={`workplace-tab ${activeTab === 'placements' ? 'active' : ''}`} onClick={() => setActiveTab('placements')}>My Interns</button>
          <button className={`workplace-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Weekly Logs</button>
          <button className={`workplace-tab ${activeTab === 'evaluations' ? 'active' : ''}`} onClick={() => setActiveTab('evaluations')}>Evaluations</button>
        </nav>

        {activeTab === 'notifications' && (
          <section className="workplace-notifications-section">
            <div className="section-title">Notifications</div>
            <NotificationPane title="Notifications" subtitle="Log and evaluation updates" limit={8} />
          </section>
        )}

        {activeTab === 'placements' && (
          <section className="workplace-placements-section">
            <div className="workplace-section-header">
              <h2>My Placements</h2>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="workplace-filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="workplace-interns-grid">
              {interns.filter((intern) => filterStatus === 'all' || intern.status === filterStatus).map((intern) => (
                <button key={intern.id} type="button" className={`workplace-intern-card ${selectedPlacement?.id === intern.id ? 'selected' : ''}`} onClick={() => handlePlacementSelect(intern.placement)}>
                  <div className="workplace-intern-header">
                    <div className="workplace-intern-avatar">{intern.studentName.charAt(0)}</div>
                    <div className="workplace-intern-info">
                      <h3>{intern.studentName}</h3>
                      <p className="workplace-intern-department">{intern.studentDepartment}</p>
                    </div>
                  </div>
                  <div className="workplace-intern-details">
                    <p><strong>Company:</strong> {intern.companyName}</p>
                    <p><strong>Period:</strong> {intern.startDate} - {intern.endDate}</p>
                    <p><strong>Status:</strong> <span className={`workplace-status-badge ${intern.status}`}>{intern.status}</span></p>
                    {intern.studentNumber ? <p><strong>Student No:</strong> {intern.studentNumber}</p> : null}
                  </div>
                  <div className="workplace-intern-stats">
                    <div className="workplace-intern-stat"><span className="stat-number">{intern.totalLogs}</span><span className="stat-label">Total</span></div>
                    <div className="workplace-intern-stat pending"><span className="stat-number">{intern.submittedLogs}</span><span className="stat-label">Submitted</span></div>
                    <div className="workplace-intern-stat approved"><span className="stat-number">{intern.approvedLogs}</span><span className="stat-label">Approved</span></div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'logs' && (
          <section className="workplace-logs-section">
            <div className="workplace-section-header">
              <h2>Weekly Logs Review</h2>
              {selectedPlacement ? <button type="button" className="workplace-back-button" onClick={() => setSelectedPlacement(null)}>Back to Interns</button> : null}
            </div>

            {!selectedPlacement ? (
              <div className="workplace-no-selection">
                <p>Select an intern from the My Interns tab to view their logs</p>
              </div>
            ) : (
              <div className="workplace-logs-container">
                <div className="workplace-selected-intern-header">
                  <h3>Logs for {selectedPlacement.student?.full_name || selectedPlacement.student?.username || 'Intern'}</h3>
                  <p>{selectedPlacement.company_name}</p>
                  <p className="workplace-log-period">Period: {selectedPlacement.start_date} - {selectedPlacement.end_date}</p>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="workplace-no-logs"><p>No logs submitted yet</p></div>
                ) : (
                  <div className="workplace-logs-list">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className={`workplace-log-card ${log.status}`}>
                        {(() => {
                          const nextWeekNumber = getNextSupervisorWeek(log.placement?.id ?? log.placement_id)
                          const canEvaluateThisLog = Number(log.week_number) === Number(nextWeekNumber)
                          return (
                            <>
                        <div className="workplace-log-header">
                          <h3>Week {log.week_number}</h3>
                          <span className={`workplace-log-status ${log.status}`}>{log.status}</span>
                        </div>
                        <div className="workplace-log-content">
                          <div className="workplace-log-field"><strong>Activities:</strong><p>{log.activities}</p></div>
                          {log.challenges ? <div className="workplace-log-field"><strong>Challenges:</strong><p>{log.challenges}</p></div> : null}
                          {log.learning ? <div className="workplace-log-field"><strong>Learning:</strong><p>{log.learning}</p></div> : null}
                          {log.deadline ? <div className="workplace-log-field"><strong>Deadline:</strong><p>{log.deadline}</p></div> : null}
                          {log.submitted_at ? <div className="workplace-log-field"><strong>Submitted:</strong><p>{new Date(log.submitted_at).toLocaleString()}</p></div> : null}
                          {log.supervisor_comment ? <div className="workplace-log-field supervisor-comment"><strong>Your Comment:</strong><p>{log.supervisor_comment}</p></div> : null}
                        </div>
                        {(log.status === 'submitted' || log.status === 'reviewed') && (
                          <div className="workplace-log-actions">
                            <textarea placeholder="Add your comment..." value={comment} onChange={(event) => setComment(event.target.value)} className="workplace-comment-input" />
                            <div className="workplace-action-buttons">
                              {log.status === 'submitted' && (
                                <button type="button" className="workplace-btn-review" onClick={() => handleReviewLog(log.id, comment)}>Review</button>
                              )}
                              {log.status === 'reviewed' && (
                                <button type="button" className="workplace-btn-approve" onClick={() => handleApproveLog(log.id)}>Approve</button>
                              )}
                              <button type="button" className="workplace-btn-reject" onClick={() => handleRejectLog(log.id, comment)}>Request Revision</button>
                            </div>
                            <div style={{ marginTop: '12px' }}>
                              <button
                                type="button"
                                className="workplace-btn-review"
                                disabled={!canEvaluateThisLog}
                                onClick={() => {
                                  if (canEvaluateThisLog) {
                                    setEvaluatingLogId(log.id)
                                  } else {
                                    toast.error(`Week ${nextWeekNumber} must be evaluated first`)
                                  }
                                }}
                                title={canEvaluateThisLog ? 'Evaluate this week' : `Week ${nextWeekNumber} must be evaluated first`}
                              >
                                {getExistingEvaluationForLog(log) ? 'Edit Weekly Evaluation' : 'Evaluate This Week'}
                              </button>
                            </div>
                          </div>
                        )}
                        {log.status === 'draft' && (
                          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#FEF3C7', borderRadius: '4px', color: '#92400E', fontSize: '13px' }}>
                            ⚠️ This log is still in draft status. The student must submit it before you can evaluate.
                          </div>
                        )}
                        {evaluatingLogId === log.id ? (
                          <div id={`workplace-inline-eval-${log.id}`} style={{ marginTop: '16px' }}>
                            <SupervisorEvaluationForm
                              placementId={log.placement?.id ?? log.placement_id}
                              evaluatorId={user?.id}
                              evaluationType="supervisor"
                              existingEvaluation={getExistingEvaluationForLog(log)}
                              initialWeekNumber={log.week_number}
                              studentName={log.placement?.student?.full_name || log.placement?.student?.username || 'Student'}
                              onSaved={() => {
                                toast.success('Evaluation saved successfully')
                                setEvaluatingLogId(null)
                                loadData()
                              }}
                              onCancel={() => setEvaluatingLogId(null)}
                            />
                          </div>
                        ) : null}
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'evaluations' && (
          <section className="workplace-evaluations-section">
            <div className="workplace-section-header">
              <h2>Intern Evaluations</h2>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Use each intern card to add or edit weekly evaluations.</span>
            </div>

            {workplaceStudentCards.length === 0 ? (
              <p>No placements assigned yet.</p>
            ) : (
              workplaceStudentCards.map((group) => {
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
                            openEvaluationEditor(group.placement, group.nextWeekNumber, null);
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
                        const evalToEdit = supervisorEvaluations.find(
                          e => Number(e.placement?.id ?? e.placement_id) === Number(group.placementId)
                            && Number(e.week_number) === Number(w.week_number)
                        );
                        const otherSupervisorSubmitted = w.academic_score !== null && w.academic_score !== undefined;
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
                                  onClick={() => openEvaluationEditor(group.placement, w.week_number, evalToEdit || null)}
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

                    {group.weeks.length ? (
                      <div style={{ marginTop: '12px', textAlign: 'right', color: '#475569' }}>
                        <strong>Average Score:</strong> {group.placementAverageScore != null ? group.placementAverageScore.toFixed(2) : '0.00'}
                        <span style={{ marginLeft: '12px' }}><strong>Average GPA:</strong> {group.placementAverageGPA != null ? group.placementAverageGPA.toFixed(2) : '0.00'}</span>
                      </div>
                    ) : null}
                    </div>
                  );
                })
              )}
              
              {showEvalEditor && evalPlacement ? (
                <div id="workplace-eval-editor-form" style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>
                    {editingEvaluation ? `Edit Week ${editingEvaluation.week_number} Evaluation` : 'Create New Evaluation'}
                  </h3>
                  <SupervisorEvaluationForm
                    placementId={evalPlacement.id}
                    evaluatorId={user?.id}
                    evaluationType="supervisor"
                    existingEvaluation={editingEvaluation}
                    initialWeekNumber={editingEvaluation?.week_number || selectedWeekNumber}
                    studentName={evalPlacement.student?.full_name || evalPlacement.student_name || 'Student'}
                    onSaved={() => {
                      toast.success('Evaluation saved successfully');
                      closeEvaluationEditor();
                      loadData();
                    }}
                    onCancel={closeEvaluationEditor}
                  />
                </div>
              ) : null}
            </section>
          )}
           {activeTab === 'criteria' && (
             <section className='workplace-evaluations-section'>
               <div className='workplace-section-header'>
                 <h2>Evaluation Criteria</h2>
               </div>
               {criteria && criteria.length === 0 ? (
                 <p>No criteria defined yet.</p>
               ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                   {(criteria || []).map((crit) => (
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
             </section>
           )}
      </main>
    </div>
  )
}

