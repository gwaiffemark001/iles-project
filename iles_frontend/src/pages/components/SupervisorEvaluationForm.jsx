import { useEffect, useState } from 'react';
import { criteriaAPI, evaluationsAPI, getErrorMessage } from '../../api/api';

export default function SupervisorEvaluationForm({
  placementId,
  evaluatorId,
  evaluationType,
  existingEvaluation = null,
  initialWeekNumber = 1,
  studentName = '',
  onSaved = () => {},
  onCancel = () => {},
}) {
  const [weekNumber, setWeekNumber] = useState(existingEvaluation?.week_number || initialWeekNumber || 1);
  const [criteria, setCriteria] = useState([]);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingCriteria, setLoadingCriteria] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadCriteria = async () => {
      try {
        const res = await criteriaAPI.getCriteria();
        if (isMounted) {
          setCriteria(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Unable to load criteria'));
        }
      } finally {
        if (isMounted) {
          setLoadingCriteria(false);
        }
      }
    };
    loadCriteria();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && criteria.length > 0) {
      if (existingEvaluation && Array.isArray(existingEvaluation.items)) {
        setItems(
          criteria.map((c) => {
            const found = existingEvaluation.items.find(
              (it) => it.criteria?.id === c.id || it.criteria_id === c.id
            );
            return {
              criteria_id: c.id,
              score: found ? Number(found.score) : 0,
            };
          })
        );
      } else if (criteria.length > 0) {
        setItems(criteria.map((c) => ({ criteria_id: c.id, score: 0 })));
      }
    }
    return () => {
      isMounted = false;
    };
  }, [criteria, existingEvaluation]);

  useEffect(() => {
    setWeekNumber(existingEvaluation?.week_number || initialWeekNumber || 1);
  }, [existingEvaluation, initialWeekNumber]);

  const setItemScore = (criteriaId, value) => {
    setItems((prev) =>
      prev.map((it) =>
        it.criteria_id === criteriaId ? { ...it, score: Number(value) || 0 } : it
      )
    );
  };

  const calculateTotalScore = () => {
    if (criteria.length === 0 || items.length === 0) return 0;

    let total = 0;
    items.forEach((item) => {
      const crit = criteria.find((c) => c.id === item.criteria_id);
      if (crit && crit.max_score > 0) {
        const contribution = (Number(item.score) / Number(crit.max_score)) * Number(crit.weight_percent);
        total += contribution;
      }
    });
    return Math.round(total * 100) / 100;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    // Validate that all criteria have scores
    if (items.some((it) => it.score === 0 || it.score === '' || it.score === null)) {
      setError('Please provide scores for all criteria');
      setSaving(false);
      return;
    }

    const totalScore = calculateTotalScore();
    const payload = {
      placement_id: placementId,
      evaluator_id: evaluatorId,
      evaluation_type: evaluationType,
      week_number: Number(weekNumber || 1),
      score: totalScore,
      items: items.map((i) => ({ criteria_id: i.criteria_id, score: Number(i.score) })),
    };

    try {
      let res;
      // Check if we're updating an existing evaluation for the same week
      // If week_number changed, create new instead of updating
      const shouldUpdate = existingEvaluation 
        && existingEvaluation.id 
        && Number(existingEvaluation.week_number) === Number(weekNumber);
      
      if (shouldUpdate) {
        res = await evaluationsAPI.updateEvaluation(existingEvaluation.id, payload);
      } else {
        res = await evaluationsAPI.createEvaluation(payload);
      }
      onSaved(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Error saving evaluation'));
    } finally {
      setSaving(false);
    }
  };

  if (loadingCriteria) {
    return <div style={{ padding: '16px', textAlign: 'center' }}>Loading criteria...</div>;
  }

  if (criteria.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#e74c3c' }}>
        No evaluation criteria defined yet. Please contact an administrator to set up criteria.
      </div>
    );
  }

  const totalScore = calculateTotalScore();

  return (
    <div
      style={{
        border: '1px solid #e6eaf0',
        borderRadius: 8,
        padding: 16,
        background: '#fff',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '4px', color: '#0f172a' }}>
          Evaluate: {studentName}
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
          Evaluation Type: {evaluationType}
        </p>
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, color: '#475569' }}>
            Week Number
            <input
              type="number"
              min="1"
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              disabled={saving}
              style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </label>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: '#e74c3c',
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#fee2e2',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
        {criteria.map((c) => {
          const itemScore = items.find((it) => it.criteria_id === c.id)?.score || 0;
          const maxScore = Number(c.max_score);
          const percent = maxScore > 0 ? ((itemScore / maxScore) * 100).toFixed(0) : 0;

          return (
            <div
              key={c.id}
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Weight: {c.weight_percent}%
                  </div>
                </div>
                {c.description && (
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    {c.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={maxScore}
                  value={itemScore}
                  onChange={(e) => setItemScore(c.id, e.target.value)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    maxWidth: '120px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#64748b', minWidth: '80px' }}>
                  {itemScore} / {maxScore}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: percent >= 70 ? '#27ae60' : percent >= 50 ? '#f39c12' : '#e74c3c',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}
                >
                  {percent}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          backgroundColor: '#eef2ff',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 600, color: '#0f172a' }}>Total Score</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
          {totalScore.toFixed(2)} / 100
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="eval-btn"
          disabled={saving}
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : existingEvaluation ? 'Update Evaluation' : 'Save Evaluation'}
        </button>
        <button
          className="nav-item"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '10px 16px',
            backgroundColor: '#e5e7eb',
            color: '#0f172a',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
