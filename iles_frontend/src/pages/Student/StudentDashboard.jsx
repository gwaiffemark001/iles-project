import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'

export default function StudentDashboard() {
  const { api } = useAuth()
  const [placement, setPlacement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const placements = await api.get('api/placements/')
        const nextPlacements = Array.isArray(placements) ? placements : []
        const activePlacement =
          nextPlacements.find((p) => p?.status === 'active') || nextPlacements[0] || null
        if (!cancelled) setPlacement(activePlacement)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard.')
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
        <h1 className="iles-title">Student</h1>
        <p className="iles-subtitle">Placements, applications, and weekly logbook.</p>
      </header>

      <div className="iles-grid">
        <section className="iles-card">
          <h2 className="iles-card-title">My placement</h2>
          {loading ? (
            <p className="iles-muted">Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : placement ? (
            <div className="iles-stack">
              <div>
                <div className="iles-strong">{placement.company_name}</div>
                <div className="iles-muted">{placement.company_address || 'Address not set'}</div>
              </div>
              <div className="iles-row">
                <span className={`iles-badge ${placement.status || ''}`}>{placement.status}</span>
                <Link className="iles-link" to="/app/student/logbook">
                  Go to logbook
                </Link>
              </div>
            </div>
          ) : (
            <div className="iles-stack">
              <p className="iles-muted">No active placement assigned yet.</p>
              <Link className="iles-link" to="/app/student/placements">
                Browse placements
              </Link>
            </div>
          )}
        </section>

        <section className="iles-card">
          <h2 className="iles-card-title">Quick actions</h2>
          <div className="iles-stack">
            <Link className="iles-button" to="/app/student/placements">
              Browse placements
            </Link>
            <Link className="iles-button secondary" to="/app/student/applications">
              My applications
            </Link>
            <Link className="iles-button secondary" to="/app/student/logbook/new">
              New weekly log
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

