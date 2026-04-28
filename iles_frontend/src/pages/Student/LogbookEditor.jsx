import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function LogbookEditor() {
  const { id } = useParams()
  const isNew = id === 'new' || !id
  const navigate = useNavigate()
  const { api } = useAuth()

  const [placementId, setPlacementId] = useState(null)
  const [weekNumber, setWeekNumber] = useState('')
  const [activities, setActivities] = useState('')
  const [challenges, setChallenges] = useState('')
  const [learning, setLearning] = useState('')
  const [deadline, setDeadline] = useState(todayISO())
  const [status, setStatus] = useState('draft')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadPlacementId() {
      const placements = await api.get('api/placements/')
      const first = Array.isArray(placements) ? placements[0] : null
      return first?.id || null
    }

    async function run() {
      setLoading(true)
      setError('')
      try {
        const pid = await loadPlacementId()
        if (!cancelled) setPlacementId(pid)

        if (!isNew) {
          const log = await api.get(`api/logs/${id}/`)
          if (cancelled) return
          setPlacementId(log.placement)
          setWeekNumber(String(log.week_number ?? ''))
          setActivities(log.activities ?? '')
          setChallenges(log.challenges ?? '')
          setLearning(log.learning ?? '')
          setDeadline(log.deadline ?? todayISO())
          setStatus(log.status ?? 'draft')
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load log.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [api, id, isNew])

  const save = async (nextStatus) => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (!placementId) throw new Error('No placement assigned yet. You cannot create a log.')

      const payload = {
        placement: placementId,
        week_number: Number(weekNumber),
        activities,
        challenges,
        learning,
        deadline,
        status: nextStatus || status,
      }

      if (isNew) {
        const created = await api.post('api/logs/', payload)
        setSuccess('Saved.')
        navigate(`/app/student/logbook/${created.id}`, { replace: true })
      } else {
        await api.put(`api/logs/${id}/`, payload)
        setStatus(nextStatus || status)
        setSuccess('Saved.')
      }
    } catch (e) {
      setError(e?.message || 'Failed to save log.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="iles-page"><p className="iles-muted">Loading...</p></div>

  return (
    <div className="iles-page">
      <header className="iles-header">
        <h1 className="iles-title">{isNew ? 'New weekly log' : `Edit log #${id}`}</h1>
        <p className="iles-subtitle">
          <Link className="iles-link" to="/app/student/logbook">
            ← Back to logbook
          </Link>
        </p>
      </header>

      {error ? <p className="error-message">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}

      <div className="iles-grid">
        <section className="iles-card">
          <h2 className="iles-card-title">Details</h2>
          <div className="iles-stack">
            <label className="iles-label">
              Week number
              <input
                className="iles-input"
                type="number"
                min="1"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                required
              />
            </label>

            <label className="iles-label">
              Deadline
              <input
                className="iles-input"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </label>

            <div className="iles-row">
              <span className={`iles-badge ${status || ''}`}>{status}</span>
              <span className="iles-muted">Placement: {placementId || 'none'}</span>
            </div>
          </div>
        </section>

        <section className="iles-card">
          <h2 className="iles-card-title">Content</h2>
          <div className="iles-stack">
            <label className="iles-label">
              Activities
              <textarea
                className="iles-textarea"
                rows={6}
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                required
              />
            </label>
            <label className="iles-label">
              Challenges
              <textarea
                className="iles-textarea"
                rows={4}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
              />
            </label>
            <label className="iles-label">
              Learning
              <textarea
                className="iles-textarea"
                rows={4}
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
              />
            </label>

            <div className="iles-row">
              <button className="iles-button secondary" onClick={() => save('draft')} disabled={saving}>
                {saving ? 'Saving...' : 'Save draft'}
              </button>
              <button className="iles-button" onClick={() => save('submitted')} disabled={saving}>
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

