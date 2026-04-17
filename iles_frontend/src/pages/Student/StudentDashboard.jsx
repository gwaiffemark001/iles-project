import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { logsAPI, placementsAPI, evaluationsAPI } from '@/api/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, placementsRes, evaluationsRes] = await Promise.all([
        logsAPI.getLogs(),
        placementsAPI.getPlacements(),
        evaluationsAPI.getEvaluations(),
      ]);
      setLogs(logsRes.data);
      setPlacements(placementsRes.data);
      setEvaluations(evaluationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="student-dashboard">
      <div className="sidebar">
        <div className="sidebar-logo">ILES</div>
        <div className="sidebar-role">Student Intern</div>
        <div className="sidebar-divider" />
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Weekly Logs
          </button>
          <button
            className={`nav-item ${activeTab === 'placements' ? 'active' : ''}`}
            onClick={() => setActiveTab('placements')}
          >
            My Placement
          </button>
          <button
            className={`nav-item ${activeTab === 'evaluations' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluations')}
          >
            Evaluations
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div>
            <h1>Welcome back, {user?.first_name || user?.username}</h1>
            <p>Student Intern — Internship Logging & Evaluation System</p>
          </div>
          <div className="avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
        </div>

        <div className="content">
          {activeTab === 'logs' && (
            <div className="logs-section">
              <h2>My Weekly Logs</h2>
              <div className="logs-list">
                {logs.map(log => (
                  <div key={log.id} className="log-card">
                    <h3>Week {log.week_number}</h3>
                    <p>Status: <span className={`status ${log.status}`}>{log.status}</span></p>
                    <p>Deadline: {log.deadline}</p>
                    {log.supervisor_comment && (
                      <p>Comment: {log.supervisor_comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'placements' && (
            <div className="placements-section">
              <h2>My Internship Placement</h2>
              {placements.map(placement => (
                <div key={placement.id} className="placement-card">
                  <h3>{placement.company_name}</h3>
                  <p>Status: <span className={`status ${placement.status}`}>{placement.status}</span></p>
                  <p>Period: {placement.start_date} to {placement.end_date}</p>
                  <p>Supervisor: {placement.workplace_supervisor_name}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="evaluations-section">
              <h2>My Evaluations</h2>
              <div className="evaluations-list">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="evaluation-card">
                    <h3>{evaluation.evaluation_type} Assessment</h3>
                    <p>Score: {evaluation.score}</p>
                    <p>Evaluator: {evaluation.evaluator_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
