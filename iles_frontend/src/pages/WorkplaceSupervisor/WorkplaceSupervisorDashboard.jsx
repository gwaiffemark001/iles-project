import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";
import { logsAPI, placementsAPI, evaluationsAPI } from "../../api/api";
import { getErrorMessage } from "../../api/api";
import { toast } from "react-toastify";
import "./WorkplaceSupervisorDashboard.css";

const WorkplaceSupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [logs, setLogs] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('placements');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPlacements();
    fetchLogs();
    fetchEvaluations();
  }, []);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const response = await placementsAPI.getPlacements();
      // Backend already filters by logged-in user based on role
      // Just use the data directly without additional filtering
      setPlacements(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await logsAPI.getLogs();
      setLogs(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await evaluationsAPI.getEvaluations();
      setEvaluations(response.data);
    } catch (err) {
      // Evaluations may not be available for all users
      console.log('Evaluations not available');
    }
  };

  // Match backend model fields
  const getInternsData = () => {
    return placements.map((placement) => {
      // Handle both possible field names from API
      const placementId = placement.id;
      const internLogs = logs.filter(log => 
        (log.placement?.id ?? log.placement_id) === placementId
      );
      
      // Count logs by status (matching WeeklyLog.STATUS_CHOICES)
      const draftLogs = internLogs.filter(log => log.status === 'draft').length;
      const submittedLogs = internLogs.filter(log => log.status === 'submitted').length;
      const reviewedLogs = internLogs.filter(log => log.status === 'reviewed').length;
      const approvedLogs = internLogs.filter(log => log.status === 'approved').length;
      const totalLogs = internLogs.length;

      // Get evaluation score for this placement
      const placementEvaluations = evaluations.filter(e => 
        (e.placement?.id ?? e.placement_id) === placementId
      );
      const supervisorEvaluation = placementEvaluations.find(e => 
        e.evaluation_type === 'supervisor'
      );

      return {
        id: placement.id,
        // Student info - handle both nested and flat structures
        studentId: placement.student?.id ?? placement.student,
        studentName: placement.student?.full_name || 
                     placement.student?.username || 
                     placement.student_name || 
                     "Unknown Student",
        studentEmail: placement.student?.email || 'N/A',
        studentDepartment: placement.student?.department || 
                          placement.department || 
                          'N/A',
        studentNumber: placement.student?.student_number || 'N/A',
        // Company info
        companyName: placement.company_name,
        companyAddress: placement.company_address || 'N/A',
        // Dates
        startDate: placement.start_date,
        endDate: placement.end_date,
        // Status (matching InternshipPlacement.STATUS_CHOICES)
        status: placement.status || 'pending',
        createdAt: placement.created_at,
        // Log statistics
        draftLogs,
        submittedLogs,
        reviewedLogs,
        approvedLogs,
        totalLogs,
        pendingLogs: submittedLogs, // For backward compatibility
        // Evaluation
        evaluationScore: supervisorEvaluation?.score || null,
        evaluatedAt: supervisorEvaluation?.evaluated_at || null,
        // Store full placement object
        placement: placement,
      };
    });
  };

  const getStats = () => {
    const interns = getInternsData();
    return {
      totalInterns: interns.length,
      pendingReviews: interns.reduce((acc, i) => acc + i.submittedLogs, 0),
      approvedLogs: interns.reduce((acc, i) => acc + i.approvedLogs, 0),
      activePlacements: interns.filter(i => i.status === 'active').length,
      completedPlacements: interns.filter(i => i.status === 'completed').length,
    };
  };

  const handlePlacementSelect = (placement) => {
    setSelectedPlacement(placement);
    setActiveTab('logs');
  };

  const handleReviewLog = async (logId, commentText) => {
    try {
      await logsAPI.reviewLog(logId, { supervisor_comment: commentText });
      toast.success("Log reviewed successfully");
      fetchLogs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleApproveLog = async (logId) => {
    try {
      await logsAPI.approveLog(logId, {});
      toast.success("Log approved successfully");
      fetchLogs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRejectLog = async (logId, commentText) => {
    try {
      await logsAPI.updateLog(logId, { 
        status: 'rejected',
        supervisor_comment: commentText 
      });
      toast.success("Log rejected");
      fetchLogs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSubmitEvaluation = async (placementId, score) => {
    try {
      await evaluationsAPI.createEvaluation({
        placement: placementId,
        score: score,
        evaluation_type: 'supervisor'
      });
      toast.success("Evaluation submitted successfully");
      fetchEvaluations();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Filter logs for selected placement
  const filteredLogs = selectedPlacement 
    ? logs.filter(log => 
        (log.placement?.id ?? log.placement_id) === selectedPlacement.id
      )
    : [];

  const stats = getStats();

  if (loading) return <div className="dashboard"><div className="loading">Loading...</div></div>;
  if (error) return <div className="dashboard"><div className="error">Error: {error}</div></div>;

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="topbar">
        <h1>Workplace Supervisor Dashboard</h1>
        <span className="topbar-user">Welcome back, {user?.username}</span>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalInterns}</h3>
            <p>Total Interns</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.pendingReviews}</h3>
            <p>Pending Reviews</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approvedLogs}</h3>
            <p>Approved Logs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{stats.activePlacements}</h3>
            <p>Active Placements</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'placements' ? 'active' : ''}`}
          onClick={() => setActiveTab('placements')}
        >
          My Interns
        </button>
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Weekly Logs
        </button>
        <button 
          className={`tab ${activeTab === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluations')}
        >
          Evaluations
        </button>
      </div>

      {/* Placements Tab */}
      {activeTab === 'placements' && (
        <div className="placements-section">
          <div className="section-header">
            <h2>My Placements</h2>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="interns-grid">
            {getInternsData()
              .filter(intern => filterStatus === 'all' || intern.status === filterStatus)
              .map(intern => (
              <div 
                key={intern.id} 
                className={`intern-card ${selectedPlacement?.id === intern.id ? 'selected' : ''}`}
                onClick={() => handlePlacementSelect(intern.placement)}
              >
                <div className="intern-header">
                  <div className="intern-avatar">{intern.studentName.charAt(0)}</div>
                  <div className="intern-info">
                    <h3>{intern.studentName}</h3>
                    <p className="intern-department">{intern.studentDepartment}</p>
                  </div>
                </div>
                <div className="intern-details">
                  <p><strong>Company:</strong> {intern.companyName}</p>
                  <p><strong>Period:</strong> {intern.startDate} - {intern.endDate}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${intern.status}`}>{intern.status}</span></p>
                  {intern.studentNumber && (
                    <p><strong>Student No:</strong> {intern.studentNumber}</p>
                  )}
                </div>
                <div className="intern-stats">
                  <div className="intern-stat">
                    <span className="stat-number">{intern.totalLogs}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="intern-stat pending">
                    <span className="stat-number">{intern.submittedLogs}</span>
                    <span className="stat-label">Submitted</span>
                  </div>
                  <div className="intern-stat approved">
                    <span className="stat-number">{intern.approvedLogs}</span>
                    <span className="stat-label">Approved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="logs-section">
          <div className="section-header">
            <h2>Weekly Logs Review</h2>
            {selectedPlacement && (
              <button 
                className="back-button"
                onClick={() => setSelectedPlacement(null)}
              >
                ← Back to Interns
              </button>
            )}
          </div>
          
          {!selectedPlacement ? (
            <div className="no-selection">
              <p>Select an intern from the "My Interns" tab to view their logs</p>
            </div>
          ) : (
            <div className="logs-container">
              <div className="selected-intern-header">
                <h3>Logs for {selectedPlacement.student?.full_name || selectedPlacement.student?.username || 'Intern'}</h3>
                <p>{selectedPlacement.company_name}</p>
                <p className="log-period">Period: {selectedPlacement.start_date} - {selectedPlacement.end_date}</p>
              </div>
              
              {filteredLogs.length === 0 ? (
                <div className="no-logs">
                  <p>No logs submitted yet</p>
                </div>
              ) : (
                <div className="logs-list">
                  {filteredLogs.map(log => (
                    <div key={log.id} className={`log-card ${log.status}`}>
                      <div className="log-header">
                        <h3>Week {log.week_number}</h3>
                        <span className={`log-status ${log.status}`}>{log.status}</span>
                      </div>
                      <div className="log-content">
                        <div className="log-field">
                          <strong>Activities:</strong>
                          <p>{log.activities}</p>
                        </div>
                        {log.challenges && (
                          <div className="log-field">
                            <strong>Challenges:</strong>
                            <p>{log.challenges}</p>
                          </div>
                        )}
                        {log.learning && (
                          <div className="log-field">
                            <strong>Learning:</strong>
                            <p>{log.learning}</p>
                          </div>
                        )}
                        {log.deadline && (
                          <div className="log-field">
                            <strong>Deadline:</strong>
                            <p>{log.deadline}</p>
                          </div>
                        )}
                        {log.submitted_at && (
                          <div className="log-field">
                            <strong>Submitted:</strong>
                            <p>{new Date(log.submitted_at).toLocaleString()}</p>
                          </div>
                        )}
                        {log.supervisor_comment && (
                          <div className="log-field supervisor-comment">
                            <strong>Your Comment:</strong>
                            <p>{log.supervisor_comment}</p>
                          </div>
                        )}
                      </div>
                      {log.status === 'submitted' && (
                        <div className="log-actions">
                          <textarea
                            placeholder="Add your comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="comment-input"
                          />
                          <div className="action-buttons">
                            <button 
                              className="btn-review"
                              onClick={() => handleReviewLog(log.id, comment)}
                            >
                              Review
                            </button>
                            <button 
                              className="btn-approve"
                              onClick={() => handleApproveLog(log.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => handleRejectLog(log.id, comment)}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Evaluations Tab */}
      {activeTab === 'evaluations' && (
        <div className="evaluations-section">
          <div className="section-header">
            <h2>Intern Evaluations</h2>
          </div>
          <div className="evaluations-grid">
            {getInternsData().map(intern => (
              <div key={intern.id} className="evaluation-card">
                <div className="evaluation-header">
                  <h3>{intern.studentName}</h3>
                  <span className={`status-badge ${intern.status}`}>{intern.status}</span>
                </div>
                <div className="evaluation-details">
                  <p><strong>Company:</strong> {intern.companyName}</p>
                  <p><strong>Period:</strong> {intern.startDate} - {intern.endDate}</p>
                </div>
                <div className="evaluation-score">
                  <p><strong>Supervisor Evaluation:</strong></p>
                  {intern.evaluationScore ? (
                    <div className="score-display">
                      <span className="score-value">{intern.evaluationScore}</span>
                      <span className="score-date">
                        Evaluated: {new Date(intern.evaluatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <p className="no-evaluation">Not evaluated yet</p>
                  )}
                </div>
                <div className="log-summary">
                  <p><strong>Log Summary:</strong></p>
                  <div className="log-stats">
                    <span>Draft: {intern.draftLogs}</span>
                    <span>Submitted: {intern.submittedLogs}</span>
                    <span>Reviewed: {intern.reviewedLogs}</span>
                    <span>Approved: {intern.approvedLogs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-logout">
        <button className="nav-item logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default WorkplaceSupervisorDashboard;

