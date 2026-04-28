import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

function badgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  if (s === 'withdrawn') return 'withdrawn'
  return 'pending'
}

export default function Applications() {
  const { api } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const data = await api.get('api/applications/')
        if (!cancelled) setApps(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load applications.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [api])

  return (
    <div className="iles-page">
      <header className="iles-header">
        <h1 className="iles-title">My applications</h1>
        <p className="iles-subtitle">
          <Link className="iles-link" to="/app/student/placements">
            Browse placements
          </Link>
        </p>
      </header>

      {loading ? <p className="iles-muted">Loading...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      <div className="iles-grid">
        {apps.map((a) => (
          <div key={a.id} className="iles-card">
            <div className="iles-row">
              <span className={`iles-badge ${badgeClass(a.status)}`}>{a.status}</span>
              <span className="iles-muted">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
            </div>
            <div className="iles-stack">
              <div className="iles-strong">Placement #{a.placement}</div>
              {a.note ? <div className="iles-muted">{a.note}</div> : <div className="iles-muted">No note</div>}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && apps.length === 0 ? <p className="iles-muted">No applications yet.</p> : null}
    </div>
  )
}

