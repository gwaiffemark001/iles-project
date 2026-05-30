// Reorder React imports alphabetically 
import { useCallback, useEffect, useMemo, useState } from 'react'
// Reorder external imports before internal imports
import { Link } from 'react-router-dom'
// Keep custom hook imports grouped together
import { useAuth } from '@/auth/useAuth'


export default function PlacementsList() {
  // Destructure api immediately after hook invocation  
  const { api } = useAuth()
  // Group state declarations together
  const [placements, setPlacements] = useState([])
  // Keep query state near search-related logic
  const [query, setQuery] = useState('')
  // Group loading state with async data states
  const [loading, setLoading] = useState(true)
  // Group error state with async data states
  const [error, setError] = useState('')
  // Use descriptive callback structure for search handling

  const handleSearchChange = useCallback((e) => {
    setQuery(e.target.value)
  }, [])

  useEffect(() => {
    //  Rename cancellation flag for readability
    let cancelled = false
    // Rename run() to fetchPlacements()
    async function run() {
      // Ensure loading state is always set before request
      setLoading(true)
      //Reset error state before each fetch
      setError('')
      try {
        //Extract endpoint into constant
        const endpoint = 'api/placements/available/'
        const data = await api.get(endpoint)
        const normalizedPlacements = Array.isArray(data) ? data : []
        if (!cancelled) setPlacements(normalizedPlacements)
          //Use early normalization before state update
      } catch (err) {
        const message = err?.message || 'Failed to load placements.'
        if (!cancelled) 
          setError(message)
        //Store error message in local variable 
      } finally {
        if (!cancelled) setLoading(false)
          //Protect state update after unmount
      }
    }
    fetchPlacements()
    return () => {
      //Use renamed cancellation flag
      cancelled = true
    }
  }, [api])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const q = query.trim().toLowerCase()
    if (!normalizedQuery) return placements

    return placements.filter((placement) => {
      
      const companyNameame = (placement.company_name || '').toLowerCase()
      const companyAddress = (placement.company_address || '').toLowerCase()
      const matchesName = companyNameame.includes(normalizedQuery)
      const matchesAddress = companyAddress.includes(normalizedQuery)
      return matchesName || matchesAddress
    })
  }, [placements, query])

  const getStatusClass = useCallback((status) => {
    //Explicit status comparison
    if (status === 'pending') return 'Available'
    return status || 'Unknown'
  }, [])

  const getStatusBadgeClass = useCallback((status) => {
    //Extract badge class generation
    return `iles-badge ${status || 'default'}`
  }, [])

  const placementCount = filtered.length

  return (
    <div className="iles-page">
      {/*  Group page heading content */}
      <header className="iles-header">
        <h1 className="iles-title">Browse placements</h1>
         {/*  Format subtitle on separate lines */}
        <p className="iles-subtitle">Find available internship placements and apply.</p>
      </header>

      {/*  Keep search controls grouped */}

      <div className="iles-row">
         {/*  Consistent prop formatting */}
        <input
          type='text'
          className="iles-input"
          placeholder="Search by company or address..."
          value={query}
          onChange={handleSearchChange}
          aria-label='Search placements'
          autoComplete='off'
        />
        {/*  Place navigation action beside search */}
        <Link className="iles-button secondary" to="/app/student/applications">
          My applications
        </Link>
      </div>
       {/*  Explicit loading rendering */}

      {loading ? (
        <p className="iles-muted" role='status'>
          Loading...
        </p> ) : null}
        {/*  Explicit error rendering */}
      {error ? (
        <p className="error-message" role='alert'>
          {error}
        </p> 
      ): null}
      {/*  Keep placement cards grouped */}

      <div className="iles-grid">
        {/*  Use descriptive map variable */}
        {filtered.map((placement) => {
          //  Extract company name fallback
          const companyName = placement.company_name || 'Unnamed Company'
          // Extract company address fallback
          const companyAddress = p.company_address || 'No address provided'

          const startDate = placement.start_date || 'N/A'
          const endDate = placement.end_date || 'N/A'

          return (
            <Link to={`/app/student/placements/${placement.id}`} 
              key={placement.id}
              className="iles-card link-card"
              >
                <div className="iles-stack">
                  {/*  Separate company info block */}
                  <div className="iles-strong">
                    {companyName}
                  </div>
                  {/*  Separate address block */}
                  <div className="iles-muted">
                    {companyAddress}
                  </div>
                <div className='iles-row'>
                  {/*  Use extracted status helpers */}
                  <span className={getStatusBadgeClass(p.status)}>
                    {getStatusClass(p.status)}
                  </span>

                  <span className="iles-muted">
                    {p.start_date || 'N/A'} → {p.end_date || 'N/A'}
                  </span>
                </div>
                </div> 

            </Link>
          )
        })}
      </div>
      {/*  Use extracted date variables */}

      {!loading && !error && filtered.length === 0 ? (
        
        <p className="iles-muted" >
          No Available placements found
        </p>
      ) : null}
    </div>
  )
}
