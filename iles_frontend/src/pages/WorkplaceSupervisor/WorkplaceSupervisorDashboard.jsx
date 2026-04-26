import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";
import { logsAPI, placementsAPI, evaluationsAPI } from "../../api/api";
import { getErrorMessage } from "../../api/api";
import "./WorkplaceSupervisorDashboard.css";

const WorkplaceSupervisorDashboard = () => {
  const { user } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');

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

  const handlePlacementSelect = (placement) => {
    setSelectedPlacement(placement);
  };

  const handleReviewLog = async (logId, comment) => {
    try {
      await logsAPI.reviewLog(logId, { supervisor_comment: comment });
      fetchLogs(); // Refresh logs
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleApproveLog = async (logId) => {
    try {
      await logsAPI.approveLog(logId, {});
      fetchLogs(); // Refresh logs
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Workplace Supervisor Dashboard</h1>
      <p>Welcome, {user?.username}</p>

      <div className="placements-section">
        <h2>My Placements</h2>
        <div className="placements-list">
          {placements.map(placement => (
            <div
              key={placement.id}
              className={`placement-card ${selectedPlacement?.id === placement.id ? 'selected' : ''}`}
              onClick={() => handlePlacementSelect(placement)}
            >
              <h3>{placement.student.username}</h3>
              <p>{placement.company_name}</p>
              <p>Status: {placement.status}</p>
              <p>{placement.start_date} - {placement.end_date}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedPlacement && (
        <div className="logs-section">
          <h2>Weekly Logs for {selectedPlacement.student.username}</h2>
          <div className="logs-list">
            {logs.filter(log => log.placement.id === selectedPlacement.id).map(log => (
              <div key={log.id} className="log-card">
                <h3>Week {log.week_number}</h3>
                <p><strong>Activities:</strong> {log.activities}</p>
                {log.challenges && <p><strong>Challenges:</strong> {log.challenges}</p>}
                {log.learning && <p><strong>Learning:</strong> {log.learning}</p>}
                <p><strong>Status:</strong> {log.status}</p>
                {log.supervisor_comment && <p><strong>Comment:</strong> {log.supervisor_comment}</p>}

                {log.status === 'submitted' && (
                  <div className="log-actions">
                    <textarea
                      placeholder="Add comment"
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button onClick={() => handleReviewLog(log.id, comment)}>Review</button>
                    <button onClick={() => handleApproveLog(log.id)}>Approve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkplaceSupervisorDashboard;

