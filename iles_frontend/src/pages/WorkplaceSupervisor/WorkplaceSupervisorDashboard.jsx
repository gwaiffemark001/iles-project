import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";
import { logsAPI, placementsAPI, evaluationsAPI } from "../../api/api";
import { getErrorMessage } from "../../api/api";
import { toast } from "react-toastify";
import "./WorkplaceSupervisorDashboard.css";

const WorkplaceSupervisorDashboard = () => {
  const { user } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('placements');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPlacements();
    fetchLogs();
  }, []);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const response = await placementsAPI.getPlacements();
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

  const getInternsData = () => {
    return placements.map((placement) => {
      const internLogs = logs.filter(log => (log.placement?.id ?? log.placement_id) === placement.id);
      const pendingLogs = internLogs.filter(log => log.status === 'submitted').length;
      const approvedLogs = internLogs.filter(log => log.status === 'approved').length;
      const totalLogs = internLogs.length;

      return {
        id: placement.student?.id || placement.id,
        name: placement.student_name || placement.student?.full_name || placement.student?.username || "Unassigned Student",
        email: placement.student?.email || 'N/A',
        department: placement.student?.department || 'N/A',
        company: placement.company_name,
        startDate: placement.start_date,
        endDate: placement.end_date,
        pendingLogs,
        approvedLogs,
        totalLogs,
        status: placement.status,
        statusLabel: pendingLogs > 0 ? 'Pending Review' : totalLogs > 0 ? 'Reviewed' : 'No Logs',
      };
    });
  };

  const getStats = () => {
    const interns = getInternsData();
    return {
      totalInterns: interns.length,
      pendingReviews: interns.reduce((acc, i) => acc + i.pendingLogs, 0),
      approvedLogs: interns.reduce((acc, i) => acc + i.approvedLogs, 0),
      activePlacements: interns.filter(i => i.status === 'active').length,
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

  const filteredLogs = selectedPlacement 
    ? logs.filter(log => (log.placement?.id ?? log.placement_id) === selectedPlacement.id)
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
                  <div className="intern-avatar">{intern.name.charAt(0)}</div>
                  <div className="intern-info">
                    <h3>{intern.name}</h3>
                    <p className="intern-department">{intern.department}</p>
                  </div>
                </div>
                <div className="intern-details">
                  <p><strong>Company:</strong> {intern.company}</p>
                  <p><strong>Period:</strong> {intern.startDate} - {intern.endDate}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${intern.status}`}>{intern.status}</span></p>
                </div>
                <div className="intern-stats">
                  <div className="intern-stat">
                    <span className="stat-number">{intern.totalLogs}</span>
                    <span className="stat-label">Total Logs</span>
                  </div>
                  <div className="intern-stat pending">
                    <span className="stat-number">{intern.pendingLogs}</span>
                    <span className="stat-label">Pending</span>
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
                <h3>Logs for {selectedPlacement.student?.username || 'Intern'}</h3>
                <p>{selectedPlacement.company_name}</p>
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
    </div>
  );
};

export default WorkplaceSupervisorDashboard;

