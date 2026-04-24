import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../api/api'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('access_token')
  const username = localStorage.getItem('username')
  const navigate = useNavigate()
  
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStatistics()
      setStats(response.data)
      } catch (error) {
        console.log('Error fetching stats:')
      }
      setLoading(false)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (loading) return <p style={{ margin: '40px', textAlign: 'center' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1F3864' }}>Admin Dashboard — {username}</h2>
        <button onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: '#E74C3C',
                   color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {[
            { label: 'Total Students', value: stats.total_students, color: '#2E75B6' },
            { label: 'Total Supervisors', value: stats.total_supervisors, color: '#117A65' },
            { label: 'Active Placements', value: stats.active_placements, color: '#7D3C98' },
            { label: 'Pending Reviews', value: stats.pending_logs, color: '#E67E22' },
            { label: 'Approved Logs', value: stats.approved_logs, color: '#27AE60' },
            { label: 'Total Logs', value: stats.total_logs, color: '#1F3864' },
          ].map((card) => (
            <div key={card.label}
              style={{ flex: '1', minWidth: '140px', padding: '20px',
                       backgroundColor: card.color, borderRadius: '8px',
                       color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{card.value}</div>
              <div style={{ fontSize: '13px', marginTop: '5px' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Logs by Status Table */}
      {stats && (
        <div>
          <h3 style={{ color: '#2E75B6', borderBottom: '2px solid #AED6F1',
                       paddingBottom: '8px', marginBottom: '15px' }}>
            Logs by Status
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1F3864', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {stats.logs_by_status.map((item, i) => (
                <tr key={item.status}
                  style={{ backgroundColor: i % 2 === 0 ? '#EBF5FB' : '#FFFFFF' }}>
                  <td style={{ padding: '10px', textTransform: 'capitalize' }}>
                    {item.status}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                    {item.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default AdminDashboard