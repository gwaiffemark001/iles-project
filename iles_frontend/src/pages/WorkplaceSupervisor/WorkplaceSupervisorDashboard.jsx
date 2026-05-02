import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { evaluationsAPI, getErrorMessage, logsAPI, placementsAPI } from '../../api/api'
import { useAuth } from '../../contexts/useAuth'
import './WorkplaceSupervisorDashboard.css'

function normalizePlacement(placement, logs, evaluations) {
  const placementId = placement.id
  const internLogs = logs.filter((log) => (log.placement?.id ?? log.placement_id) === placementId)
  const placementEvaluations = evaluations.filter((evaluation) => (evaluation.placement?.id ?? evaluation.placement_id) === placementId)
  const supervisorEvaluation = placementEvaluations.find((evaluation) => evaluation.evaluation_type === 'supervisor')

  return {
    id: placementId,
    placement,
    studentName: placement.student?.full_name || placement.student?.username || placement.student_name || 'Unknown Student',
    studentDepartment: placement.student?.department || placement.department || 'N/A',
    studentNumber: placement.student?.student_number || 'N/A',
    companyName: placement.company_name,
    companyAddress: placement.company_address || 'N/A',
    startDate: placement.start_date,
    endDate: placement.end_date,
    status: placement.status || 'pending',
    draftLogs: internLogs.filter((log) => log.status === 'draft').length,
    submittedLogs: internLogs.filter((log) => log.status === 'submitted').length,
    reviewedLogs: internLogs.filter((log) => log.status === 'reviewed').length,
    approvedLogs: internLogs.filter((log) => log.status === 'approved').length,
    totalLogs: internLogs.length,
    evaluationScore: supervisorEvaluation?.score || null,
    evaluatedAt: supervisorEvaluation?.evaluated_at || null,
  }
}

export default function WorkplaceSupervisorDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [placements, setPlacements] = useState([])
  const [logs, setLogs] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [selectedPlacement, setSelectedPlacement] = useState(null)
  const [activeTab, setActiveTab] = useState('placements')
  const [filterStatus, setFilterStatus] = useState('all')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [placementsResponse, logsResponse, evaluationsResponse] = await Promise.all([
        placementsAPI.getPlacements(),
        logsAPI.getLogs(),
        evaluationsAPI.getEvaluations(),
      ])
      setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : [])
      setLogs(Array.isArray(logsResponse.data) ? logsResponse.data : [])
      setEvaluations(Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load workplace dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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

  const filteredLogs = selectedPlacement
    ? logs.filter((log) => (log.placement?.id ?? log.placement_id) === selectedPlacement.id)
    : []

  const handlePlacementSelect = (placement) => {
    setSelectedPlacement(placement)
    setActiveTab('logs')
  }

  const handleReviewLog = async (logId, supervisorComment) => {
    try {
      await logsAPI.reviewLog(logId, { supervisor_comment: supervisorComment })
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

  const handleRejectLog = async (logId, supervisorComment) => {
    try {
      await logsAPI.updateLog(logId, { status: 'rejected', supervisor_comment: supervisorComment })
      toast.success('Log rejected')
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
        </div>
        <div className="workplace-sidebar-bottom">
          <div className="workplace-sidebar-user">{user?.username}</div>
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
                        {log.status === 'submitted' && (
                          <div className="workplace-log-actions">
                            <textarea placeholder="Add your comment..." value={comment} onChange={(event) => setComment(event.target.value)} className="workplace-comment-input" />
                            <div className="workplace-action-buttons">
                              <button type="button" className="workplace-btn-review" onClick={() => handleReviewLog(log.id, comment)}>Review</button>
                              <button type="button" className="workplace-btn-approve" onClick={() => handleApproveLog(log.id)}>Approve</button>
                              <button type="button" className="workplace-btn-reject" onClick={() => handleRejectLog(log.id, comment)}>Reject</button>
                            </div>
                          </div>
                        )}
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
            <div className="workplace-section-header"><h2>Intern Evaluations</h2></div>
            <div className="workplace-evaluations-grid">
              {interns.map((intern) => (
                <div key={intern.id} className="workplace-evaluation-card">
                  <div className="workplace-evaluation-header">
                    <h3>{intern.studentName}</h3>
                    <span className={`workplace-status-badge ${intern.status}`}>{intern.status}</span>
                  </div>
                  <div className="workplace-evaluation-details">
                    <p><strong>Company:</strong> {intern.companyName}</p>
                    <p><strong>Period:</strong> {intern.startDate} - {intern.endDate}</p>
                  </div>
                  <div className="workplace-evaluation-score">
                    <p><strong>Supervisor Evaluation:</strong></p>
                    {intern.evaluationScore ? (
                      <div className="workplace-score-display">
                        <span className="workplace-score-value">{intern.evaluationScore}</span>
                        <span className="workplace-score-date">Evaluated: {new Date(intern.evaluatedAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <p className="workplace-no-evaluation">Not evaluated yet</p>
                    )}
                  </div>
                  <div className="workplace-log-summary">
                    <p><strong>Log Summary:</strong></p>
                    <div className="workplace-log-stats">
                      <span>Draft: {intern.draftLogs}</span>
                      <span>Submitted: {intern.submittedLogs}</span>
                      <span>Reviewed: {intern.reviewedLogs}</span>
                      <span>Approved: {intern.approvedLogs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

