import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function LogbookList() {
  const { api } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function formatDate(value) {
    if (!value) return 'Not set'
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return 'Not set'
    }
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const data = await api.get('api/logs/')
        if (!cancelled) setLogs(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load logs.')
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
        <h1 className="iles-title">Weekly logbook</h1>
        <p className="iles-subtitle">Create, edit, and submit your weekly logs.</p>
      </header>

      <div className="iles-row">
        <Link className="iles-button" to="/app/student/logbook/new">
          New log
        </Link>
        <Link className="iles-button secondary" to="/app/student">
          Back to dashboard
        </Link>
      </div>

      {loading ? <p className="iles-muted">Loading...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      <div className="iles-grid">
        {logs.map((l) => (
          <Link key={l.id} to={`/app/student/logbook/${l.id}`} className="iles-card link-card">
            <div className="iles-stack">
              <div className="iles-row">
                <div className="iles-strong">Week {l.week_number}</div>
                <span className={`iles-badge ${l.status || ''}`}>{l.status}</span>
              </div>
              <div className="iles-muted">Deadline: {formatDate(l.deadline)}</div>
              {l.supervisor_comment ? (
                <div className="iles-muted">Comment: {l.supervisor_comment}</div>
              ) : (
                <div className="iles-muted">No supervisor comment</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!loading && !error && logs.length === 0 ? <p className="iles-muted">No logs yet.</p> : null}
    </div>
  )
}

