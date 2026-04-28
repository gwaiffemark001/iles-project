import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function PlacementsList() {
  const { api } = useAuth()
  const [placements, setPlacements] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const data = await api.get('api/placements/available/')
        if (!cancelled) setPlacements(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load placements.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [api])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return placements
    return placements.filter((p) => {
      const name = (p.company_name || '').toLowerCase()
      const addr = (p.company_address || '').toLowerCase()
      return name.includes(q) || addr.includes(q)
    })
  }, [placements, query])

  return (
    <div className="iles-page">
      <header className="iles-header">
        <h1 className="iles-title">Browse placements</h1>
        <p className="iles-subtitle">Find available internship placements and apply.</p>
      </header>

      <div className="iles-row">
        <input
          className="iles-input"
          placeholder="Search by company or address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link className="iles-button secondary" to="/app/student/applications">
          My applications
        </Link>
      </div>

      {loading ? <p className="iles-muted">Loading...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      <div className="iles-grid">
        {filtered.map((p) => (
          <Link key={p.id} to={`/app/student/placements/${p.id}`} className="iles-card link-card">
            <div className="iles-stack">
              <div className="iles-strong">{p.company_name}</div>
              <div className="iles-muted">{p.company_address || 'Address not set'}</div>
              <div className="iles-row">
                <span className={`iles-badge ${p.status || ''}`}>{p.status}</span>
                <span className="iles-muted">
                  {p.start_date} → {p.end_date}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!loading && !error && filtered.length === 0 ? (
        <p className="iles-muted">No available placements found.</p>
      ) : null}
    </div>
  )
}

