import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function PlacementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { api } = useAuth()
  const placementIdNum = Number(id)
  const [placement, setPlacement] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const [data, apps] = await Promise.all([
          api.get(`api/placements/${id}/`),
          api.get('api/applications/'),
        ])
        if (!cancelled) {
          setPlacement(data)
          const nextApps = Array.isArray(apps) ? apps : []
          const applied = nextApps.some(
            (a) => Number(a?.placement) === placementIdNum && ['pending', 'approved'].includes((a?.status || '').toLowerCase()),
          )
          setAlreadyApplied(applied)
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load placement.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [api, id])

  const apply = async () => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      if (!Number.isFinite(placementIdNum)) {
        throw new Error('Invalid placement id.')
      }
      await api.post('api/applications/', { placement: placementIdNum, note })
      setSuccess('Application submitted.')
      setTimeout(() => navigate('/app/student/applications'), 500)
    } catch (e) {
      setError(e?.message || 'Failed to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="iles-page">
      <header className="iles-header">
        <h1 className="iles-title">Placement</h1>
        <p className="iles-subtitle">
          <Link className="iles-link" to="/app/student/placements">
            ← Back to placements
          </Link>
        </p>
      </header>

      {loading ? <p className="iles-muted">Loading...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {placement ? (
        <div className="iles-grid">
          <section className="iles-card">
            <h2 className="iles-card-title">{placement.company_name}</h2>
            <div className="iles-stack">
              <div className="iles-row">
                <span className={`iles-badge ${placement.status || ''}`}>{placement.status}</span>
                <span className="iles-muted">
                  {placement.start_date} → {placement.end_date}
                </span>
              </div>
              <div>
                <div className="iles-strong">Address</div>
                <div className="iles-muted">{placement.company_address || 'Not provided'}</div>
              </div>
            </div>
          </section>

          <section className="iles-card">
            <h2 className="iles-card-title">Apply</h2>
            <div className="iles-stack">
              <textarea
                className="iles-textarea"
                placeholder="Optional note to the admin/supervisor..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
              />
              <button
                className="iles-button"
                onClick={apply}
                disabled={submitting || !Number.isFinite(placementIdNum) || alreadyApplied}
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
              {alreadyApplied ? <p className="iles-muted">You already applied for this placement.</p> : null}
              {success ? <p className="success-message">{success}</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

