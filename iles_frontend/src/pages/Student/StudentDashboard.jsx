import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { logsAPI, placementsAPI, evaluationsAPI } from '@/api/api';
import { getErrorMessage } from '@/api/api';
import './StudentDashboard.css';

const createInitialLogForm = (defaultPlacementId = '') => ({
  placement_id: defaultPlacementId ? String(defaultPlacementId) : '',
  week_number: '',
  activities: '',
  challenges: '',
  learning: '',
  deadline: '',
});

const getPlacementId = (log) => log.placement?.id ?? log.placement_id ?? '';

const formatDisplayDate = (value) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
};

const getUserInitials = (user) => {
  const firstInitial = user?.first_name?.[0] || '';
  const lastInitial = user?.last_name?.[0] || '';
  return `${firstInitial}${lastInitial}` || user?.username?.slice(0, 2)?.toUpperCase() || 'IL';
};

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');
  const [formData, setFormData] = useState(createInitialLogForm());
  const [editingLogId, setEditingLogId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setPageError('');
      const [logsRes, placementsRes, evaluationsRes] = await Promise.all([
        logsAPI.getLogs(),
        placementsAPI.getPlacements(),
        evaluationsAPI.getEvaluations(),
      ]);

      const nextPlacements = placementsRes.data;
      const nextLogs = [...logsRes.data].sort((firstLog, secondLog) => secondLog.week_number - firstLog.week_number);

      setLogs(nextLogs);
      setPlacements(nextPlacements);
      setEvaluations(evaluationsRes.data);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Unable to load your dashboard right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchData();
    };

    initializeDashboard();
  }, []);

  useEffect(() => {
    if (!placements.length) {
      return;
    }

    const updateFormData = () => {
      setFormData((currentData) => {
        if (currentData.placement_id) {
          return currentData;
        }

        const activePlacement = placements.find((placement) => placement.status === 'active') || placements[0];
        return createInitialLogForm(activePlacement.id);
      });
    };

    updateFormData();
  }, [placements]);

  const resetForm = () => {
    const activePlacement = placements.find((placement) => placement.status === 'active') || placements[0];
    setEditingLogId(null);
    setFormData(createInitialLogForm(activePlacement?.id));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSaveLog = async (nextStatus) => {
    if (!formData.placement_id) {
      setFormError('You need an assigned placement before creating a log.');
      return;
    }

    if (!formData.week_number || Number(formData.week_number) < 1) {
      setFormError('Enter a valid week number before saving your log.');
      return;
    }

    if (!formData.activities.trim()) {
      setFormError('Activities are required for each weekly log.');
      return;
    }

    if (!formData.deadline) {
      setFormError('Choose a deadline for this weekly log.');
      return;
    }

    // Enhanced validation for CSC 1202 requirements
    const today = new Date();
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate < today && nextStatus === 'submitted') {
      setFormError('Cannot submit log with past deadline. Choose a future date.');
      return;
    }

    setSaving(true);
    setFormError('');
    setFormSuccess('');

    const payload = {
      placement_id: Number(formData.placement_id),
      week_number: Number(formData.week_number),
      activities: formData.activities.trim(),
      challenges: formData.challenges.trim(),
      learning: formData.learning.trim(),
      deadline: formData.deadline,
      status: nextStatus,
    };

    try {
      if (editingLogId) {
        // Check if log can be edited based on CSC 1202 workflow rules
        const currentLog = logs.find(log => log.id === editingLogId);
        if (currentLog && !['draft', 'submitted'].includes(currentLog.status)) {
          setFormError('Cannot edit log that has been reviewed or approved.');
          return;
        }
        
        await logsAPI.updateLog(editingLogId, payload);
      } else {
        await logsAPI.createLog(payload);
      }

      setFormSuccess(
        nextStatus === 'submitted'
          ? 'Log submitted successfully! Your supervisor will review it soon.'
          : 'Log saved as draft. You can edit it until submission.'
      );
      resetForm();
      await fetchData();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to save your weekly log.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditLog = (log) => {
    if (log.status !== 'draft') {
      return;
    }

    setActiveTab('logs');
    setEditingLogId(log.id);
    setFormError('');
    setFormSuccess('');
    setFormData({
      placement_id: String(getPlacementId(log)),
      week_number: String(log.week_number ?? ''),
      activities: log.activities ?? '',
      challenges: log.challenges ?? '',
      learning: log.learning ?? '',
      deadline: log.deadline ?? '',
    });
  };

  const handleDeleteLog = async (logId) => {
    setFormError('');
    setFormSuccess('');

    try {
      await logsAPI.deleteLog(logId);
      setFormSuccess('Draft deleted successfully.');

      if (editingLogId === logId) {
        resetForm();
      }

      await fetchData();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to delete this draft.'));
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
          <div className="avatar">{getUserInitials(user)}</div>
        </div>

        <div className="content">
          {pageError ? <div className="error-message page-alert">{pageError}</div> : null}

          {activeTab === 'logs' && (
            <div className="logs-section">
              <div className="section-header">
                <div>
                  <h2>My Weekly Logs</h2>
                  <p>Capture each week of your internship and submit it for supervisor review.</p>
                </div>
              </div>

              <div className="log-editor-card">
                <div className="log-editor-header">
                  <h3>{editingLogId ? 'Edit Draft Log' : 'New Weekly Log'}</h3>
                  {editingLogId ? (
                    <button type="button" className="ghost-btn" onClick={resetForm}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>

                {formError ? <div className="error-message">{formError}</div> : null}
                {formSuccess ? <div className="success-message">{formSuccess}</div> : null}

                {placements.length ? (
                  <form className="log-form-grid" onSubmit={(event) => event.preventDefault()}>
                    <div className="form-row">
                      <label className="form-field">
                        <span>Placement</span>
                        <select
                          name="placement_id"
                          value={formData.placement_id}
                          onChange={handleFormChange}
                          disabled={saving}
                        >
                          {placements.map((placement) => (
                            <option key={placement.id} value={placement.id}>
                              {placement.company_name} ({placement.status})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-field">
                        <span>Week Number</span>
                        <input
                          type="number"
                          min="1"
                          name="week_number"
                          value={formData.week_number}
                          onChange={handleFormChange}
                          placeholder="e.g. 4"
                          disabled={saving}
                        />
                      </label>

                      <label className="form-field">
                        <span>Deadline</span>
                        <input
                          type="date"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleFormChange}
                          disabled={saving}
                        />
                      </label>
                    </div>

                    <label className="form-field">
                      <span>Activities</span>
                      <textarea
                        name="activities"
                        value={formData.activities}
                        onChange={handleFormChange}
                        placeholder="What did you work on this week?"
                        rows="4"
                        disabled={saving}
                      />
                    </label>

                    <div className="form-row form-row-double">
                      <label className="form-field">
                        <span>Challenges</span>
                        <textarea
                          name="challenges"
                          value={formData.challenges}
                          onChange={handleFormChange}
                          placeholder="What obstacles came up?"
                          rows="4"
                          disabled={saving}
                        />
                      </label>

                      <label className="form-field">
                        <span>Learning</span>
                        <textarea
                          name="learning"
                          value={formData.learning}
                          onChange={handleFormChange}
                          placeholder="What did you learn this week?"
                          rows="4"
                          disabled={saving}
                        />
                      </label>
                    </div>

                    <div className="log-form-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleSaveLog('draft')}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : editingLogId ? 'Update Draft' : 'Save Draft'}
                      </button>
                      <button
                        type="button"
                        className="btn-primary-action"
                        onClick={() => handleSaveLog('submitted')}
                        disabled={saving}
                      >
                        {saving ? 'Submitting...' : editingLogId ? 'Update and Submit' : 'Submit Log'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="empty-state">
                    <p>You do not have an assigned placement yet, so log submission is not available.</p>
                  </div>
                )}
              </div>

              <div className="logs-list">
                {logs.length ? (
                  logs.map((log) => (
                    <div key={log.id} className="log-card">
                      <div className="log-card-header">
                        <div>
                          <h3>Week {log.week_number}</h3>
                          <p className="log-company">{log.placement?.company_name || 'Company information not available'}</p>
                        </div>
                        <span className={`status ${log.status}`}>{log.status}</span>
                      </div>

                      <div className="log-card-grid">
                        <p><strong>Deadline:</strong> {formatDisplayDate(log.deadline)}</p>
                        <p><strong>Submitted:</strong> {log.submitted_at ? formatDisplayDate(log.submitted_at) : 'Not submitted yet'}</p>
                      </div>

                      <p><strong>Activities:</strong> {log.activities}</p>
                      <p><strong>Challenges:</strong> {log.challenges || 'No challenges recorded.'}</p>
                      <p><strong>Learning:</strong> {log.learning || 'No learning notes recorded.'}</p>
                      <p><strong>Supervisor Comment:</strong> {log.supervisor_comment || 'No comment yet.'}</p>

                      {log.status === 'draft' ? (
                        <div className="log-card-actions">
                          <button type="button" className="ghost-btn" onClick={() => handleEditLog(log)}>
                            Edit Draft
                          </button>
                          <button type="button" className="danger-btn" onClick={() => handleDeleteLog(log.id)}>
                            Delete Draft
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No weekly logs yet. Start with your first draft above.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'placements' && (
            <div className="placements-section">
              <h2>My Internship Placement</h2>
              {placements.length ? (
                placements.map((placement) => (
                  <div key={placement.id} className="placement-card">
                    <h3>{placement.company_name}</h3>
                    <p>Status: <span className={`status ${placement.status}`}>{placement.status}</span></p>
                    <p>Period: {formatDisplayDate(placement.start_date)} to {formatDisplayDate(placement.end_date)}</p>
                    <p>Workplace Supervisor: {placement.workplace_supervisor_name || placement.workplace_supervisor?.full_name || 'Not assigned'}</p>
                    <p>Academic Supervisor: {placement.academic_supervisor_name || placement.academic_supervisor?.full_name || 'Not assigned'}</p>
                    <p>Address: {placement.company_address || 'Not provided yet.'}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No placement has been assigned to your account yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="evaluations-section">
              <h2>My Evaluations</h2>
              <div className="evaluations-list">
                {evaluations.length ? (
                  evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="evaluation-card">
                      <h3>{evaluation.evaluation_type} Assessment</h3>
                      <p>Placement: {evaluation.placement?.company_name || 'Placement not available'}</p>
                      <p>Score: {evaluation.score}</p>
                      <p>Evaluator: {evaluation.evaluator_name || evaluation.evaluator?.full_name || 'Not available'}</p>
                      <p>Date: {formatDisplayDate(evaluation.evaluated_at)}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No evaluations have been recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
