import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

export default function PlacementsList() {
  const { api } = useAuth()
  const [placements, setPlacements] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cancelRef = { cancelled: false }

    const loadPlacements = async () => {
      setError('')

      try {
        const response = await api.get('api/placements/available/')
        const data = response?.data ?? response

        if (!cancelRef.cancelled) {
          setPlacements(Array.isArray(data) ? data : [])
        }
      } catch (requestError) {
        if (!cancelRef.cancelled) {
          setError(requestError?.message || 'Failed to load placements.')
        }
      } finally {
        if (!cancelRef.cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPlacements()

    return () => {
      cancelRef.cancelled = true
    }
  }, [api])

  const filteredPlacements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return placements

    return placements.filter((placement) => {
      const companyName = (placement.company_name || '').toLowerCase()
      const companyAddress = (placement.company_address || '').toLowerCase()
      return companyName.includes(normalizedQuery) || companyAddress.includes(normalizedQuery)
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
          type="text"
          className="iles-input"
          placeholder="Search by company or address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search placements"
          autoComplete="off"
        />
        <Link className="iles-button secondary" to="/app/student/applications">
          My applications
        </Link>
      </div>

      {loading ? (
        <p className="iles-muted" role="status">
          Loading...
        </p>
      ) : null}

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}

      <div className="iles-grid">
        {filteredPlacements.map((placement) => {
          const companyName = placement.company_name || 'Unnamed Company'
          const companyAddress = placement.company_address || 'No address provided'
          const status = placement.status || 'available'

          return (
            <Link
              key={placement.id}
              to={`/app/student/placements/${placement.id}`}
              className="iles-card link-card"
            >
              <div className="iles-stack">
                <div className="iles-strong">{companyName}</div>
                <div className="iles-muted">{companyAddress}</div>
                <div className="iles-row">
                  <span className={`iles-badge ${status}`}>{status}</span>
                  <span className="iles-muted">
                    {placement.start_date || 'N/A'} → {placement.end_date || 'N/A'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {!loading && !error && filteredPlacements.length === 0 ? (
        <p className="iles-muted">No available placements found</p>
      ) : null}
    </div>
  )
}
