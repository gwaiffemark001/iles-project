import { useEffect, useState } from 'react';
import { criteriaAPI, evaluationsAPI, getErrorMessage } from '../../api/api';
import { useAuth } from '@/auth/useAuth';

const WORKPLACE_REQUIREMENTS = [
  { key: 'technical', label: 'Technical Skills', weight: 40 },
  { key: 'communication', label: 'Communication', weight: 30 },
  { key: 'professionalism', label: 'Professionalism', weight: 30 },
];

export default function SupervisorEvaluationForm({
  placementId,
  evaluatorId,
  evaluationType,
  existingEvaluation = null,
  studentName = '',
  initialWeekNumber = 1,
  onSaved = () => {},
  onCancel = () => {},
}) {
  const { user } = useAuth();
  
  // Auto-determine evaluation type based on user role
  const determinedEvaluationType = user?.role === 'academic_supervisor' 
    ? 'academic' 
    : user?.role === 'workplace_supervisor' 
      ? 'supervisor' 
      : evaluationType;
  const [criteria, setCriteria] = useState([]);
  const [items, setItems] = useState([]);
  const [workplaceScores, setWorkplaceScores] = useState({});
  const [selectedCriteriaId, setSelectedCriteriaId] = useState(null);
  const [lockedCriteriaId, setLockedCriteriaId] = useState(null);
  const [lockedCriteriaName, setLockedCriteriaName] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const activeCriteriaId = lockedCriteriaId ?? selectedCriteriaId;

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
        const selectedId = existingEvaluation.items[0]?.criteria?.id || existingEvaluation.items[0]?.criteria_id || null;
        setSelectedCriteriaId(selectedId);
        setItems(
          criteria.map((c) => {
            const found = existingEvaluation.items.find(
              (it) => it.criteria?.id === c.id || it.criteria_id === c.id
            );
            return {
              criteria_id: c.id,
              score: found ? Number(found.score) : '',
            };
          })
        );

        // Pre-fill workplace inputs so an existing weighted score remains stable when editing.
        if (determinedEvaluationType === 'supervisor' && selectedId) {
          const found = existingEvaluation.items.find(
            (it) => it.criteria?.id === selectedId || it.criteria_id === selectedId
          );
          const existingScore = found ? Number(found.score) : '';
          const selectedCriterion = criteria.find((c) => c.id === selectedId);
          const roleShare = Number(selectedCriterion?.supervisor_share || 0);
          const normalizedSeed = existingScore !== '' && !Number.isNaN(existingScore) && roleShare > 0
            ? Math.min(100, Math.max(0, existingScore / (roleShare / 100)))
            : existingScore;
          if (existingScore !== '' && !Number.isNaN(existingScore)) {
            setWorkplaceScores((prev) => ({
              ...prev,
              [selectedId]: {
                technical: normalizedSeed,
                communication: normalizedSeed,
                professionalism: normalizedSeed,
              },
            }));
          }
        }
      } else if (criteria.length > 0 && !existingEvaluation) {
        setItems(criteria.map((c) => ({ criteria_id: c.id, score: '' })));
        setSelectedCriteriaId(null);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [criteria, existingEvaluation, determinedEvaluationType]);

  // Check for other supervisor's evaluation to enforce same criteria
  useEffect(() => {
    let isMounted = true;
    const checkOtherEvaluation = async () => {
      try {
        const otherEvaluationType = determinedEvaluationType === 'academic' ? 'supervisor' : 'academic';
        const weekNum = existingEvaluation?.week_number || initialWeekNumber;
        
        const allEvaluations = await evaluationsAPI.getEvaluations();
        const otherEval = Array.isArray(allEvaluations.data) 
          ? allEvaluations.data.find(e => 
              Number(e.placement?.id ?? e.placement_id) === Number(placementId)
              && Number(e.week_number) === Number(weekNum)
              && e.evaluation_type === otherEvaluationType
            )
          : null;

        if (isMounted && otherEval && Array.isArray(otherEval.items) && otherEval.items.length > 0) {
          const otherCriteriaId = otherEval.items[0]?.criteria?.id || otherEval.items[0]?.criteria_id;
          const otherCriteria = criteria.find(c => c.id === otherCriteriaId);
          if (otherCriteriaId && otherCriteria) {
            setLockedCriteriaId(otherCriteriaId);
            setLockedCriteriaName(otherCriteria.name);
            setSelectedCriteriaId(otherCriteriaId);
          }
        }
      } catch {
        // Silently fail, this is optional enforcement
      }
    };

    if (criteria.length > 0) {
      checkOtherEvaluation();
    }
    return () => {
      isMounted = false;
    };
  }, [criteria, placementId, initialWeekNumber, determinedEvaluationType, existingEvaluation?.week_number]);

  const setItemScore = (criteriaId, value) => {
    // Enforce max score of 100
    let numericValue = value === '' ? '' : Number(value) || 0;
    if (numericValue > 100) {
      numericValue = 100;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.criteria_id === criteriaId ? { ...it, score: numericValue } : it
      )
    );
  };

  const setWorkplaceRequirementScore = (criteriaId, key, value) => {
    let numericValue = value === '' ? '' : Number(value);
    if (numericValue !== '' && Number.isNaN(numericValue)) {
      numericValue = '';
    }
    if (numericValue !== '' && numericValue > 100) {
      numericValue = 100;
    }
    if (numericValue !== '' && numericValue < 0) {
      numericValue = 0;
    }

    setWorkplaceScores((prev) => ({
      ...prev,
      [criteriaId]: {
        technical: prev[criteriaId]?.technical ?? '',
        communication: prev[criteriaId]?.communication ?? '',
        professionalism: prev[criteriaId]?.professionalism ?? '',
        [key]: numericValue,
      },
    }));
  };

  const calculateWorkplaceWeightedScore = (criteriaId) => {
    const selected = workplaceScores[criteriaId] || {};
    const criterion = criteria.find((c) => c.id === criteriaId);
    const roleShare = Number(criterion?.supervisor_share || 0);
    const baseScore = WORKPLACE_REQUIREMENTS.reduce((sum, req) => {
      const raw = selected[req.key] === '' || selected[req.key] == null ? 0 : Number(selected[req.key]);
      const safe = Number.isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
      return sum + (safe * (req.weight / 100));
    }, 0);

    return baseScore * (roleShare / 100);
  };

  const toggleCriteriaSelection = (criteriaId) => {
    // If criteria is locked, don't allow changing it
    if (lockedCriteriaId && criteriaId !== lockedCriteriaId) {
      return;
    }
    // select a single criterion (no multi-select)
    setSelectedCriteriaId(criteriaId);
  };

  const calculateTotalScore = () => {
    if (criteria.length === 0 || items.length === 0 || !activeCriteriaId) return 0;

    if (determinedEvaluationType === 'supervisor') {
      const weighted = calculateWorkplaceWeightedScore(activeCriteriaId);
      return Math.round(weighted * 100) / 100;
    }

    const selectedItem = items.find((item) => item.criteria_id === activeCriteriaId);
    const crit = criteria.find((c) => c.id === activeCriteriaId);
    if (!selectedItem || !crit) return 0;

    const score = selectedItem.score === '' ? 0 : Number(selectedItem.score);
    const maxScore = Number(crit.max_score || 100);
    const roleShare = determinedEvaluationType === 'academic'
      ? Number(crit.academic_share || 0)
      : Number(crit.supervisor_share || 0);
    if (maxScore <= 0) return 0;

    const weightedTotal = (score / maxScore) * roleShare;
    return Math.round(weightedTotal * 100) / 100;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (!activeCriteriaId) {
      setError('Select a criterion before saving.');
      setSaving(false);
      return;
    }

    const selectedItem = items.find((item) => item.criteria_id === activeCriteriaId);
    const selectedCriterion = criteria.find((c) => c.id === activeCriteriaId);
    let scoreToSave = 0;

    if (determinedEvaluationType === 'supervisor') {
      const selected = workplaceScores[activeCriteriaId] || {};
      const missingRequirement = WORKPLACE_REQUIREMENTS.find((req) => selected[req.key] === '' || selected[req.key] == null);
      if (missingRequirement) {
        setError(`Please enter a score for ${missingRequirement.label}.`);
        setSaving(false);
        return;
      }

      const invalidRequirement = WORKPLACE_REQUIREMENTS.find((req) => {
        const numeric = Number(selected[req.key]);
        return Number.isNaN(numeric) || numeric < 0 || numeric > 100;
      });

      if (invalidRequirement) {
        setError(`Please provide a valid ${invalidRequirement.label} score between 0 and 100.`);
        setSaving(false);
        return;
      }

      scoreToSave = Math.round(calculateWorkplaceWeightedScore(activeCriteriaId) * 100) / 100;
    } else {
      const numericScore = Number(selectedItem?.score);
      const maxScore = Number(selectedCriterion?.max_score || 100);
      const hasInvalidScore =
        !selectedItem || Number.isNaN(numericScore) || numericScore < 0 || numericScore > maxScore;

      if (hasInvalidScore) {
        setError(`Please provide a valid score for ${selectedCriterion?.name || 'the selected'} criteria.`);
        setSaving(false);
        return;
      }

      scoreToSave = Math.round(calculateTotalScore() * 100) / 100;
    }

    const payload = {
      placement_id: placementId,
      evaluator_id: evaluatorId,
      evaluation_type: determinedEvaluationType,
      week_number: existingEvaluation?.week_number || initialWeekNumber,
      items: [{ criteria_id: activeCriteriaId, score: scoreToSave }],
    };

    try {
      let res;
      // Update existing evaluation if it exists, otherwise create new
      if (existingEvaluation && existingEvaluation.id) {
        res = await evaluationsAPI.updateEvaluation(existingEvaluation.id, payload);
      } else {
        res = await evaluationsAPI.createEvaluation(payload);
      }
      onSaved(res.data);
    } catch (err) {
      // Prefer explicit API validation messages for 'items' when available
      const apiItems = err?.response?.data?.items;
      if (apiItems && Array.isArray(apiItems) && apiItems.length > 0) {
        setError(apiItems[0]);
      } else {
        setError(getErrorMessage(err, 'Error saving evaluation'));
      }
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
          {existingEvaluation ? `Edit Week ${existingEvaluation.week_number ?? initialWeekNumber}` : `Create Evaluation for Week ${initialWeekNumber}`}: {studentName}
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
          Evaluation Type: <strong>{determinedEvaluationType === 'academic' ? 'Academic Supervisor' : 'Workplace Supervisor'}</strong>
        </p>
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

      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          backgroundColor: lockedCriteriaId ? '#fef3c7' : '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>Select Criterion to Evaluate</div>
          {lockedCriteriaId && (
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>
              Locked to: <strong>{lockedCriteriaName}</strong>
            </div>
          )}
        </div>
        {lockedCriteriaId && (
          <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px', padding: '8px', backgroundColor: '#fef08a', borderRadius: '4px' }}>
            The other supervisor has already chosen this criteria for this week. You must use the same criteria to ensure consistency.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {criteria.map((c) => (
            <label
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                border: lockedCriteriaId && c.id !== lockedCriteriaId ? '1px solid #ccc' : '1px solid #e2e8f0',
                backgroundColor: lockedCriteriaId && c.id !== lockedCriteriaId ? '#f3f4f6' : '#fff',
                fontSize: '13px',
                color: lockedCriteriaId && c.id !== lockedCriteriaId ? '#9ca3af' : '#0f172a',
                cursor: lockedCriteriaId && c.id !== lockedCriteriaId ? 'not-allowed' : saving ? 'not-allowed' : 'pointer',
                opacity: lockedCriteriaId && c.id !== lockedCriteriaId ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name="selectedCriterion"
                checked={activeCriteriaId === c.id}
                onChange={() => toggleCriteriaSelection(c.id)}
                disabled={saving || (lockedCriteriaId && c.id !== lockedCriteriaId)}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
        {activeCriteriaId ? (() => {
          const c = criteria.find((criterion) => criterion.id === activeCriteriaId);
          if (!c) return null;

          const itemScore = items.find((it) => it.criteria_id === c.id)?.score || '';
          const maxScore = 100;
          const roleShare = determinedEvaluationType === 'academic'
            ? Number(c.academic_share || 0)
            : Number(c.supervisor_share || 0);
          const selectedWorkplaceScores = workplaceScores[c.id] || {};

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
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name} criteria</div>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                  Role share from admin criteria: <strong>{roleShare.toFixed(2)}%</strong>
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

              {determinedEvaluationType === 'supervisor' ? (
                <>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                    Enter all three requirement scores (0 to 100). The weighted sum is saved for this selected admin criterion.
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {WORKPLACE_REQUIREMENTS.map((req) => {
                      const rawValue = selectedWorkplaceScores[req.key] ?? '';
                      const numericValue = rawValue === '' ? '' : Number(rawValue);
                      const appliedRoleShare = roleShare / 100;
                      const contribution = rawValue === '' || Number.isNaN(numericValue)
                        ? 0
                        : (Math.max(0, Math.min(100, numericValue)) * (req.weight / 100) * appliedRoleShare);

                      return (
                        <div key={req.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 120px 80px 120px', gap: '10px', alignItems: 'center' }}>
                          <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{req.label} - {req.weight}%</div>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={rawValue}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v !== '' && Number(v) > 100) {
                                v = '100';
                              }
                              setWorkplaceRequirementScore(c.id, req.key, v);
                            }}
                            disabled={saving}
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '14px',
                            }}
                          />
                          <div style={{ fontSize: '12px', color: '#64748b' }}>/ 100</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                            {contribution.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={itemScore}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (v !== '' && Number(v) > 100) {
                        v = '100';
                      }
                      setItemScore(c.id, v);
                    }}
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
                  <div style={{ fontSize: '12px', color: '#64748b', minWidth: '80px' }}>{itemScore === '' ? '-' : itemScore} / {maxScore}</div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: totalScore >= 70 ? '#27ae60' : totalScore >= 50 ? '#f39c12' : '#e74c3c',
                      minWidth: '50px',
                      textAlign: 'right',
                    }}
                  >
                    {totalScore.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          );
        })() : (
          <div style={{ padding: '12px', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
            Select a criterion above to enter its score.
          </div>
        )}
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
