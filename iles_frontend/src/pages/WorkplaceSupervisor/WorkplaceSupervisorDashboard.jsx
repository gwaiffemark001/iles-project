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

  if (loading) return <div className="workplace-dashboard"><div className="workplace-loading">Loading...</div></div>;
  if (error) return <div className="workplace-dashboard"><div className="workplace-error">Error: {error}</div></div>;

  return (
    <div className="workplace-dashboard">
      {/* Sidebar */}
        <div className="workplace-sidebar">
          <div className="workplace-brand">ILES</div>
          <div className="workplace-role">Workplace Supervisor</div>
          <div className="workplace-sidebar-divider"></div>
          
          <div className="workplace-sidebar-nav">
            <button 
              className={`workplace-nav-item ${activeTab === 'placements' ? 'active' : ''}`}
              onClick={() => setActiveTab('placements')}
            >
              My Interns
            </button>
            <button 
              className={`workplace-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              Weekly Logs
            </button>
            <button 
              className={`workplace-nav-item ${activeTab === 'evaluations' ? 'active' : ''}`}
              onClick={() => setActiveTab('evaluations')}
            >
              Evaluations
            </button>
          </div>
          
          <div className="workplace-sidebar-bottom">
            <div className="workplace-sidebar-user">
              {user?.username}
            </div>
            <button className="workplace-nav-item logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="workplace-main">
          {/* Top Bar */}
          <div className="workplace-topbar">
            <div>
              <span className="workplace-kicker">Dashboard</span>
              <h1>Workplace Supervisor</h1>
              <span className="workplace-subtitle">Welcome back, {user?.username}</span>
            </div>
            
            <div className="workplace-profile">
              <button className="workplace-profile-trigger">
                <div className="workplace-profile-copy">
                  <strong>{user?.username}</strong>
                  <span>Workplace Supervisor</span>
                </div>
                <div className="workplace-avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
          </div>

        {/* Statistics Cards */}
        <div className="workplace-stat-grid">
          <div className="workplace-stat-card blue">
            <span className="workplace-stat-label">Total Interns</span>
            <span className="workplace-stat-value">{stats.totalInterns}</span>
            <span className="workplace-stat-hint">Assigned to you</span>
          </div>
          <div className="workplace-stat-card amber">
            <span className="workplace-stat-label">Pending Reviews</span>
            <span className="workplace-stat-value">{stats.pendingReviews}</span>
            <span className="workplace-stat-hint">Awaiting review</span>
          </div>
          <div className="workplace-stat-card green">
            <span className="workplace-stat-label">Approved Logs</span>
            <span className="workplace-stat-value">{stats.approvedLogs}</span>
            <span className="workplace-stat-hint">This period</span>
          </div>
          <div className="workplace-stat-card violet">
            <span className="workplace-stat-label">Active Placements</span>
            <span className="workplace-stat-value">{stats.activePlacements}</span>
            <span className="workplace-stat-hint">Currently active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="workplace-tabs">
          <button 
            className={`workplace-tab ${activeTab === 'placements' ? 'active' : ''}`}
            onClick={() => setActiveTab('placements')}
          >
            My Interns
          </button>
          <button 
            className={`workplace-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Weekly Logs
          </button>
          <button 
            className={`workplace-tab ${activeTab === 'evaluations' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluations')}
          >
            Evaluations
          </button>
        </div>

        {/* Placements Tab */}
        {activeTab === 'placements' && (
          <div className="workplace-placements-section">
            <div className="workplace-section-header">
              <h2>My Placements</h2>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="workplace-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="workplace-interns-grid">
              {getInternsData()
                .filter(intern => filterStatus === 'all' || intern.status === filterStatus)
                .map(intern => (
                <div 
                  key={intern.id} 
                  className={`workplace-intern-card ${selectedPlacement?.id === intern.id ? 'selected' : ''}`}
                  onClick={() => handlePlacementSelect(intern.placement)}
                >
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
                    {intern.studentNumber && (
                      <p><strong>Student No:</strong> {intern.studentNumber}</p>
                    )}
                  </div>
                  <div className="workplace-intern-stats">
                    <div className="workplace-intern-stat">
                      <span className="stat-number">{intern.totalLogs}</span>
                      <span className="stat-label">Total</span>
                    </div>
                    <div className="workplace-intern-stat pending">
                      <span className="stat-number">{intern.submittedLogs}</span>
                      <span className="stat-label">Submitted</span>
                    </div>
                    <div className="workplace-intern-stat approved">
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
          <div className="workplace-logs-section">
            <div className="workplace-section-header">
              <h2>Weekly Logs Review</h2>
              {selectedPlacement && (
                <button 
                  className="workplace-back-button"
                  onClick={() => setSelectedPlacement(null)}
                >
                  ← Back to Interns
                </button>
              )}
            </div>
            
            {!selectedPlacement ? (
              <div className="workplace-no-selection">
                <p>Select an intern from the "My Interns" tab to view their logs</p>
              </div>
            ) : (
              <div className="workplace-logs-container">
                <div className="workplace-selected-intern-header">
                  <h3>Logs for {selectedPlacement.student?.full_name || selectedPlacement.student?.username || 'Intern'}</h3>
                  <p>{selectedPlacement.company_name}</p>
                  <p className="workplace-log-period">Period: {selectedPlacement.start_date} - {selectedPlacement.end_date}</p>
                </div>
                
                {filteredLogs.length === 0 ? (
                  <div className="workplace-no-logs">
                    <p>No logs submitted yet</p>
                  </div>
                ) : (
                  <div className="workplace-logs-list">
                    {filteredLogs.map(log => (
                      <div key={log.id} className={`workplace-log-card ${log.status}`}>
                        <div className="workplace-log-header">
                          <h3>Week {log.week_number}</h3>
                          <span className={`workplace-log-status ${log.status}`}>{log.status}</span>
                        </div>
                        <div className="workplace-log-content">
                          <div className="workplace-log-field">
                            <strong>Activities:</strong>
                            <p>{log.activities}</p>
                          </div>
                          {log.challenges && (
                            <div className="workplace-log-field">
                              <strong>Challenges:</strong>
                              <p>{log.challenges}</p>
                            </div>
                          )}
                          {log.learning && (
                            <div className="workplace-log-field">
                              <strong>Learning:</strong>
                              <p>{log.learning}</p>
                            </div>
                          )}
                          {log.deadline && (
                            <div className="workplace-log-field">
                              <strong>Deadline:</strong>
                              <p>{log.deadline}</p>
                            </div>
                          )}
                          {log.submitted_at && (
                            <div className="workplace-log-field">
                              <strong>Submitted:</strong>
                              <p>{new Date(log.submitted_at).toLocaleString()}</p>
                            </div>
                          )}
                          {log.supervisor_comment && (
                            <div className="workplace-log-field supervisor-comment">
                              <strong>Your Comment:</strong>
                              <p>{log.supervisor_comment}</p>
                            </div>
                          )}
                        </div>
                        {log.status === 'submitted' && (
                          <div className="workplace-log-actions">
                            <textarea
                              placeholder="Add your comment..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="workplace-comment-input"
                            />
                            <div className="workplace-action-buttons">
                              <button 
                                className="workplace-btn-review"
                                onClick={() => handleReviewLog(log.id, comment)}
                              >
                                Review
                              </button>
                              <button 
                                className="workplace-btn-approve"
                                onClick={() => handleApproveLog(log.id)}
                              >
                                Approve
                              </button>
                              <button 
                                className="workplace-btn-reject"
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
          <div className="workplace-evaluations-section">
            <div className="workplace-section-header">
              <h2>Intern Evaluations</h2>
            </div>
            <div className="workplace-evaluations-grid">
              {getInternsData().map(intern => (
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
                        <span className="workplace-score-date">
                          Evaluated: {new Date(intern.evaluatedAt).toLocaleDateString()}
                        </span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkplaceSupervisorDashboard;

