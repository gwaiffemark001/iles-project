import { useCallback, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

function badgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  if (s === 'withdrawn') return 'withdrawn'
  return 'pending'
}

function statusLabel(status) {
  const s = (status || '').toLowerCase()
  if (s === 'pending') return 'Pending review'
  if (s === 'approved') return 'Approved'
  if (s === 'rejected') return 'Rejected'
  if (s === 'withdrawn') return 'Withdrawn'
  return status || 'Pending'
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return ''
  }
}

function placementLabel(app) {
  const placement = app?.placement
  if (placement && typeof placement === 'object') {
    return placement.company_name || `Placement #${placement.id || ''}`.trim()
  }
  if (placement) return `Placement #${placement}`
  return 'Placement not set'
}

export default function Applications() {
  const { api } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchApplications = useCallback(async (cancelRef) => {
    setLoading(true)
    setError('')
    

      try {
        const {data} = await api.get('api/applications/')
        if (!cancelRef.cancelled) { 
          setApps(Array.isArray(data) ? data : [])
        } 
      }catch (e) {
        if (!cancelRef.cancelled) {
          setError(e?.message || 'Failed to load applications.')
      } 
      }finally {
        if (!cancelRef.cancelled) setLoading(false)
      }
 
   
  }, [api])

  useEffect(() => {
    const cancelRef = { cancelled: false }
    const timer = setTimeout(() => {
      void fetchApplications(cancelRef)
    }, 0)
    return () => {
      cancelRef.cancelled = true
      clearTimeout(timer)
    }
  }, [fetchApplications])

 const renderedApplications = useMemo(() => {
    return apps.map((a) => (
      <div 
        key={a.id} 
        className="iles-card"
        role='article'
        aria-label={`Application for ${placementLabel(a)}`}
      >
       <div className="iles-row">
          <span className={`iles-badge ${badgeClass(a.status)}`}
            aria-label={`Application status: ${statusLabel(a.status)}`} 
          >
          {statusLabel(a.status)}
          </span>
          <span 
          className="iles-muted"
          title={a.created_at || ''}
          >
          {formatDate(a.created_at)}
          </span>
      </div>
      <div className="iles-stack">
        <div className="iles-strong">
          {placementLabel(a)}
        </div>
        {a.note ? (
          <div className="iles-muted">{a.note}</div>
        ) : (
        <div className="iles-muted">No note</div>
        )}
      </div>
    </div>
    ))
  }, [apps])


  return (
    <div className="iles-page"> 
      <header className="iles-header">
        <h1 className="iles-title">My applications</h1>

        <p className="iles-subtitle">
          <Link 
            className="iles-link" 
            to="/app/student/placements"
            aria-label="Browse available placements"
          >
            Browse placements
          </Link>
        </p>
      </header>

      {loading ? (
        <p 
          className="iles-muted"
          aria-live='polite'
        >
          Loading...
        </p>
      ) : null}

      {error ? (
        <p
          className="error-message"
          role='alert'
        >
          {error}
        </p>
      ) : null}

      <div className="iles-grid"
        aria-live='polite'
      >
        {renderedApplications}
      </div>

      {!loading && !error && apps.length === 0 ? (
        <p className="iles-muted">
          No applications yet.
        </p>
      ) : null}
    </div>
  )
}




