import { useEffect, useState , useCallback, useMemo} from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { formatDate } from '@/utils/dateUtils'

export default function LogbookList() {
  const { api } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const formatDateValue = useCallback((value) => {
    if (!value) return 'Not set'
    return formatDate(value)
  }, [])

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

  const renderedLogs = useMemo(() => {
    return logs.map((l) => (
      <Link 
        key={l.id} 
        to={`/app/student/logbook/${l.id}`} 
        className="iles-card link-card"
        aria-label={`View log for week ${l.week_number}`} 
      >
        <div className="iles-stack">
          <div className="iles-row">
            <div className="iles-strong">
              Week {l.week_number?? 'N/A'}
            </div>
            <span className={`iles-badge ${l.status || ''}`}>
              {l.status || 'draft'}
            </span>
          </div>
          <div className="iles-muted">
            Deadline: {formatDateValue(l.deadline)}
          </div>

          {l.supervisor_comment ? (
            <div className="iles-muted">
              Comment: {l.supervisor_comment}
            </div>
          ) : (
            <div className="iles-muted">
              No supervisor comment
            </div>
          )}
          {l.submitted_at ? (
            <div className="iles-muted">
              Submitted: {formatDateValue(l.submitted_at)}
            </div>
          ) : (
            <div className="iles-muted">
              Not submitted yet
            </div>
          )}
        </div>
      </Link>
    ))

  }, [logs, formatDateValue])

  return (
    <div className="iles-page" aria-busy={loading}>
      <header className="iles-header">
        <h1 className="iles-title">Weekly Logs</h1>
        <p className="iles-subtitle">
          Create, edit, and submit your weekly logs here.
        </p>
      </header>
      
      <div className="iles-row">
        <Link to="/app/student/logbook/new" className="iles-button">
          Add New Log
        </Link>
        <Link className='iles-button secondary' to="/app/student">
          Back to Dashboard
        </Link>
      </div>

      {loading ? <p className='iles-muted'>Loading...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}
      <div className="iles-grid">
        {renderedLogs}
      </div>
      {!loading && !error && logs.length === 0 ? (
        <p className="iles-muted">No logs found. </p>
        ) : null}
    </div>
  )
}    
