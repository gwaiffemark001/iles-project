import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { logsAPI, placementsAPI, evaluationsAPI, criteriaAPI } from '@/api/api';
import { getErrorMessage } from '@/api/api';
import { buildWeeklyEvaluationSummaries } from '@/utils/evaluationSummary';
import './StudentDashboard.css';

const createInitialLogForm = (defaultPlacementId = '') => ({
  placement_id: defaultPlacementId ? String(defaultPlacementId) : '',
  week_number: '',
  activities: '',
  challenges: '',
  learning: '',
});

const getPlacementId = (log) => log.placement?.id ?? log.placement_id ?? '';

const formatDisplayDate = (value) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
};

const MS_PER_DAY = 24 * 60 * 60 * 1000

const computeCurrentWeekForPlacement = (placement, today = new Date()) => {
  if (!placement || !placement.start_date) return 1
  const start = new Date(placement.start_date)
  if (Number.isNaN(start.getTime())) return 1

  const end = placement.end_date ? new Date(placement.end_date) : null
  const effectiveDate = end && end < today ? end : today
  const elapsedDays = Math.max(0, Math.floor((effectiveDate.getTime() - start.getTime()) / MS_PER_DAY))
  return Math.max(1, Math.floor(elapsedDays / 7) + 1)
}

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
  const [criteria, setCriteria] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');
  const [formData, setFormData] = useState(createInitialLogForm());
  const [editingLogId, setEditingLogId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(true);
  const weeklyEvaluationSummaries = useMemo(
    () => buildWeeklyEvaluationSummaries(evaluations, placements, logs).weeklySummaries,
    [evaluations, placements, logs],
  );
  const loggablePlacements = useMemo(
    () => placements.filter((placement) => placement.status !== 'completed'),
    [placements],
  );
  const selectedPlacement = useMemo(
    () => placements.find((placement) => String(placement.id) === String(formData.placement_id)),
    [placements, formData.placement_id],
  );
  const isCompletedPlacementSelected = selectedPlacement?.status === 'completed';

  const fetchData = async () => {
    try {
      setPageError('');
      const [logsRes, placementsRes, evaluationsRes, criteriaRes] = await Promise.all([
        logsAPI.getLogs(),
        placementsAPI.getPlacements(),
        evaluationsAPI.getEvaluations(),
        criteriaAPI.getCriteria(),
      ]);

      const nextPlacements = placementsRes.data;
      const nextLogs = [...logsRes.data].sort((firstLog, secondLog) => secondLog.week_number - firstLog.week_number);

      setLogs(nextLogs);
      setPlacements(nextPlacements);
      setEvaluations(evaluationsRes.data);
      setCriteria(Array.isArray(criteriaRes.data) ? criteriaRes.data : []);
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
    if (!loggablePlacements.length) {
      return;
    }

    const updateFormData = () => {
      setFormData((currentData) => {
        const currentlySelectedPlacement = loggablePlacements.find(
          (placement) => String(placement.id) === String(currentData.placement_id),
        );

        if (currentlySelectedPlacement) {
          return currentData;
        }

        const activePlacement = loggablePlacements.find((placement) => placement.status === 'active') || loggablePlacements[0];
        const currentWeek = computeCurrentWeekForPlacement(activePlacement)
        return { ...createInitialLogForm(activePlacement.id), week_number: String(currentWeek) };
      });
    };

    updateFormData();
  }, [loggablePlacements, logs]);

  const resetForm = () => {
    const activePlacement = loggablePlacements.find((placement) => placement.status === 'active') || loggablePlacements[0];
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

    if (isCompletedPlacementSelected) {
      setFormError('You cannot create or submit logs for a completed placement.');
      return;
    }

    if (!formData.week_number || Number(formData.week_number) < 1) {
      setFormError('Enter a valid week number before saving your log.');
      return;
    }

      // Enforce week boundaries based on placement timeline
      const selectedPlacementObj = placements.find((p) => String(p.id) === String(formData.placement_id));
      const currentWeekForPlacement = computeCurrentWeekForPlacement(selectedPlacementObj);
      const submittedWeek = Number(formData.week_number);

      if (submittedWeek > currentWeekForPlacement) {
        setFormError('Cannot submit a log for a future week. The week counter is enforced automatically.');
        return;
      }

      if (nextStatus === 'submitted' && submittedWeek < currentWeekForPlacement) {
        setFormError('Cannot submit a log for a previous week; missed weeks are recorded automatically as zero.');
        return;
      }

    if (!formData.activities.trim()) {
      setFormError('Activities are required for each weekly log.');
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

    if (log.placement?.status === 'completed') {
      setFormError('You cannot edit logs for a completed placement.');
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
           <button
             className={`nav-item ${activeTab === 'criteria' ? 'active' : ''}`}
             onClick={() => setActiveTab('criteria')}
           >
             Criteria
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
                {isCompletedPlacementSelected ? (
                  <div className="error-message">This placement is completed. New logs and submissions are disabled.</div>
                ) : null}

                {loggablePlacements.length ? (
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
                          {loggablePlacements.map((placement) => (
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
                            disabled={saving || !editingLogId}
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
                        disabled={saving || isCompletedPlacementSelected}
                      >
                        {saving ? 'Saving...' : editingLogId ? 'Update Draft' : 'Save Draft'}
                      </button>
                      <button
                        type="button"
                        className="btn-primary-action"
                        onClick={() => handleSaveLog('submitted')}
                        disabled={saving || isCompletedPlacementSelected}
                      >
                        {saving ? 'Submitting...' : editingLogId ? 'Update and Submit' : 'Submit Log'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="empty-state">
                    <p>You have no active or pending placements available for log creation.</p>
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
              {weeklyEvaluationSummaries.length ? (
                <>
                  <div className="evaluations-list" style={{ marginBottom: '24px' }}>
                    {[...weeklyEvaluationSummaries].sort((a, b) => a.week_number - b.week_number).map((summary) => {
                      const supervisorCriteria = summary.supervisorEvaluation?.items?.[0]?.criteria?.name || 'Not specified';
                      const academicCriteria = summary.academicEvaluation?.items?.[0]?.criteria?.name || 'Not specified';
                      return (
                        <div
                          key={summary.key}
                          style={{
                            padding: '16px',
                            background: '#f7f9fc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Week {summary.week_number}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                              Placement: <strong>{summary.placementName}</strong>
                            </div>
                            {summary.log_status === 'missing' ? (
                              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
                                <strong>No log submitted for this week.</strong> Scores are zero.
                              </div>
                            ) : null}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Workplace Supervisor</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '2px' }}>
                                {summary.log_status === 'missing' ? 0 : (summary.supervisor_score ?? 'Not yet submitted')}
                              </div>
                              {summary.supervisorEvaluation && (
                                <div style={{ fontSize: '11px', color: '#7c3aed' }}>({supervisorCriteria})</div>
                              )}
                            </div>

                            <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Academic Supervisor</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '2px' }}>
                                {summary.log_status === 'missing' ? 0 : (summary.academic_score ?? 'Not yet submitted')}
                              </div>
                              {summary.academicEvaluation && (
                                <div style={{ fontSize: '11px', color: '#7c3aed' }}>({academicCriteria})</div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>Combined Score</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{summary.combined_score ?? 'N/A'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>Weight</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{summary.grade_weight ?? 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {weeklyEvaluationSummaries.length > 0 && (
                    <div style={{ paddingTop: '16px', borderTop: '2px solid #e2e8f0', textAlign: 'right', color: '#475569' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Average Score:</strong> {(weeklyEvaluationSummaries.reduce((total, week) => total + Number(week.combined_score || 0), 0) / weeklyEvaluationSummaries.length).toFixed(2)}
                      </div>
                      <div>
                        <strong>Average Weight:</strong> {(weeklyEvaluationSummaries.reduce((total, week) => total + Number(week.grade_weight || 0), 0) / weeklyEvaluationSummaries.length).toFixed(2)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>No evaluations have been recorded yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'criteria' && (
            <div className="evaluations-section">
              <h2>Evaluation Criteria</h2>
              {criteria.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {criteria.map((crit) => (
                    <div key={crit.id} className="evaluation-card" style={{ border: '1px solid #e2e8f0' }}>
                      <h3>{crit.name}</h3>
                      {crit.description ? <p>{crit.description}</p> : null}
                      <p><strong>Max Score:</strong> {crit.max_score}</p>
                      <p><strong>Workplace Share:</strong> {crit.supervisor_share}%</p>
                      <p><strong>Academic Share:</strong> {crit.academic_share}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No criteria have been defined yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
