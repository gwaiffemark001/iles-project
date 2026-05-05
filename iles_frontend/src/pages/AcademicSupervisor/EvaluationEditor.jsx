import { useEffect, useState } from 'react';
import { evaluationsAPI, criteriaAPI, getErrorMessage } from '../../api/api';

export default function EvaluationEditor({
  placementId,
  evaluatorId,
  existingEvaluation = null,
  onSaved = () => {},
  onCancel = () => {},
}) {
  const [criteria, setCriteria] = useState([]);
  const [items, setItems] = useState([]);
  const [evaluationType, setEvaluationType] = useState(existingEvaluation?.evaluation_type || 'academic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await criteriaAPI.getCriteria();
        setCriteria(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load criteria'));
      }
    };
    load();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && existingEvaluation && Array.isArray(existingEvaluation.items)) {
      setItems(
        criteria.map((c) => {
          const found = existingEvaluation.items.find((it) => it.criteria?.id === c.id || it.criteria_id === c.id);
          return {
            criteria_id: c.id,
            score: found ? found.score : 0,
          };
        })
      );
    } else if (isMounted && criteria.length > 0 && !existingEvaluation) {
      setItems(criteria.map((c) => ({ criteria_id: c.id, score: 0 })));
    }
    return () => {
      isMounted = false;
    };
  }, [criteria, existingEvaluation]);

  const setItemScore = (criteriaId, value) => {
    setItems((prev) => prev.map((it) => (it.criteria_id === criteriaId ? { ...it, score: value } : it)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      placement_id: placementId,
      evaluator_id: evaluatorId,
      evaluation_type: evaluationType,
      items: items.map((i) => ({ criteria_id: i.criteria_id, score: Number(i.score) }))
    };

    try {
      let res;
      if (existingEvaluation && existingEvaluation.id) {
        res = await evaluationsAPI.updateEvaluation(existingEvaluation.id, payload);
      } else {
        res = await evaluationsAPI.createEvaluation(payload);
      }
      onSaved(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: '1px solid #e6eaf0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontWeight: 600 }}>Evaluation Type</label>
        <select value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)}>
          <option value="supervisor">Supervisor</option>
          <option value="academic">Academic</option>
          <option value="logbook">Logbook</option>
        </select>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'grid', gap: 8 }}>
        {criteria.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{c.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                step="0.1"
                min="0"
                max={c.max_score}
                value={(items.find((it) => it.criteria_id === c.id) || {}).score ?? 0}
                onChange={(e) => setItemScore(c.id, e.target.value)}
                style={{ width: 90, padding: '6px 8px' }}
              />
              <div style={{ fontSize: 12, color: '#64748B' }}>{`/ ${c.max_score}`}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="eval-btn" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save Evaluation'}</button>
        <button className="nav-item" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}
