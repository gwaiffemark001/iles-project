import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../auth/useAuth'

function AdminDashboard() {
  const { user, logout } = useAuth()
  const token = localStorage.getItem('access_token')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [placements, setPlacements] = useState([])
  const [users, setUsers] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [editingPlacement, setEditingPlacement] = useState(null)

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

  const handleEditUser = (user) => {
    setEditingUser(user)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/users/${editingUser.id}/`,
        {
          username: editingUser.username,
          email: editingUser.email,
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          role: editingUser.role,
          phone: editingUser.phone,
          department: editingUser.department,
          student_number: editingUser.student_number,
          staff_number: editingUser.staff_number,
          registration_number: editingUser.registration_number
        },
        authHeaders
      )
      
      setUsers(users.map(u => u.id === editingUser.id ? response.data : u))
      setEditingUser(null)
      alert('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDeleteUser = async (userId) => {
    console.log('Attempting to delete user:', userId)
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log('Making DELETE request to:', `http://127.0.0.1:8000/api/users/${userId}/`)
        console.log('Auth headers:', authHeaders)
        const response = await axios.delete(`http://127.0.0.1:8000/api/users/${userId}/`, authHeaders)
        console.log('Delete response:', response)
        setUsers(users.filter(user => user.id !== userId))
        alert('User deleted successfully')
      } catch (error) {
        console.error('Error deleting user:', error)
        console.error('Error response:', error.response)
        alert('Error deleting user: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleEditPlacement = (placement) => {
    setEditingPlacement(placement)
  }

  const handleUpdatePlacement = async () => {
    if (!editingPlacement) return
    
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/placements/${editingPlacement.id}/`,
        {
          company_name: editingPlacement.company_name,
          student: editingPlacement.student?.id,
          workplace_supervisor: editingPlacement.workplace_supervisor?.id,
          academic_supervisor: editingPlacement.academic_supervisor?.id,
          start_date: editingPlacement.start_date,
          end_date: editingPlacement.end_date,
          status: editingPlacement.status,
          description: editingPlacement.description
        },
        authHeaders
      )
      
      setPlacements(placements.map(p => p.id === editingPlacement.id ? response.data : p))
      setEditingPlacement(null)
      alert('Placement updated successfully')
    } catch (error) {
      console.error('Error updating placement:', error)
      alert('Error updating placement: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDeletePlacement = async (placementId) => {
    if (window.confirm('Are you sure you want to delete this placement?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/placements/${placementId}/`, authHeaders)
        setPlacements(placements.filter(p => p.id !== placementId))
        alert('Placement deleted successfully')
      } catch (error) {
        console.error('Error deleting placement:', error)
        alert('Error deleting placement: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getFullName(user).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsResponse, placementsResponse, evaluationsResponse, usersResponse] =
        await Promise.all([
          axios.get('http://127.0.0.1:8000/api/admin/statistics/', authHeaders),
          axios.get('http://127.0.0.1:8000/api/placements/', authHeaders),
          axios.get('http://127.0.0.1:8000/api/evaluations/', authHeaders),
          axios.get('http://127.0.0.1:8000/api/users/', authHeaders),
        ])

      setStats(statsResponse.data)
      setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : [])
      setEvaluations(Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : [])
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : [])

      console.log('Dashboard data loaded successfully')
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || 'Unable to load admin dashboard data.'
      setError(message)
      console.error('Dashboard error:', requestError)
    } finally {
      setLoading(false)
    }
  }

  const getFullName = (user) =>
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    'Unknown'

  const formatDate = (value) => {
    if (!value) return 'Not available'
    return new Intl.DateTimeFormat('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  }

  if (loading) {
    return <p style={{ margin: '40px', textAlign: 'center' }}>Loading dashboard data...</p>
  }

  if (error) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: '#E74C3C' }}>Unable to load dashboard</h3>
        <p>{error}</p>
        <button 
          onClick={fetchDashboardData}
          style={{ padding: '8px 16px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>ILES</h2>
          <p style={{ margin: '0', fontSize: '14px', opacity: 0.8 }}>{user?.username || 'Admin'}</p>
          <p style={{ margin: '0', fontSize: '12px', opacity: 0.6 }}>Administrator</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveSection('overview')}
            style={{ 
              padding: '10px', 
              backgroundColor: activeSection === 'overview' ? '#34495e' : 'transparent',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveSection('users')}
            style={{ 
              padding: '10px', 
              backgroundColor: activeSection === 'users' ? '#34495e' : 'transparent',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            👥 Users
          </button>
          <button 
            onClick={() => setActiveSection('placements')}
            style={{ 
              padding: '10px', 
              backgroundColor: activeSection === 'placements' ? '#34495e' : 'transparent',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            🏢 Placements
          </button>
          <button 
            onClick={() => setActiveSection('evaluations')}
            style={{ 
              padding: '10px', 
              backgroundColor: activeSection === 'evaluations' ? '#34495e' : 'transparent',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            ⭐ Evaluations
          </button>
          <button 
            onClick={fetchDashboardData}
            style={{ 
              padding: '10px', 
              backgroundColor: 'transparent',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            🔄 Refresh
          </button>
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={logout}
            style={{ 
              padding: '10px', 
              backgroundColor: '#E74C3C',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>Admin Dashboard</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Manage your ILES system from one central location</p>

          {activeSection === 'overview' && (
            <div>
              <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>System Overview</h2>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
                <div 
                  onClick={() => setActiveSection('users')}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px', 
                    padding: '20px', 
                    backgroundColor: '#3498DB', 
                    borderRadius: '8px', 
                    color: 'white', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.border = '2px solid #fff'}
                  onMouseLeave={(e) => e.target.style.border = '2px solid transparent'}
                >
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.total_students || 0}</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>Total Students</div>
                  <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Click to manage →</div>
                </div>
                <div 
                  onClick={() => setActiveSection('placements')}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px', 
                    padding: '20px', 
                    backgroundColor: '#27AE60', 
                    borderRadius: '8px', 
                    color: 'white', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.border = '2px solid #fff'}
                  onMouseLeave={(e) => e.target.style.border = '2px solid transparent'}
                >
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.active_placements || 0}</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>Active Placements</div>
                  <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Click to manage →</div>
                </div>
                <div 
                  onClick={() => setActiveSection('evaluations')}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px', 
                    padding: '20px', 
                    backgroundColor: '#E67E22', 
                    borderRadius: '8px', 
                    color: 'white', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.border = '2px solid #fff'}
                  onMouseLeave={(e) => e.target.style.border = '2px solid transparent'}
                >
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.total_logs || 0}</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>Total Logs</div>
                  <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Click to manage →</div>
                </div>
                <div 
                  onClick={() => setActiveSection('evaluations')}
                  style={{ 
                    flex: '1', 
                    minWidth: '200px', 
                    padding: '20px', 
                    backgroundColor: '#9B59B6', 
                    borderRadius: '8px', 
                    color: 'white', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.border = '2px solid #fff'}
                  onMouseLeave={(e) => e.target.style.border = '2px solid transparent'}
                >
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.total_evaluations || 0}</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>Total Evaluations</div>
                  <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Click to manage →</div>
                </div>
              </div>
              
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <h3 style={{ color: '#495057', marginBottom: '15px' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <button 
                    onClick={() => setActiveSection('users')}
                    style={{ 
                      padding: '15px', 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    👥 Manage Users
                  </button>
                  <button 
                    onClick={() => setActiveSection('placements')}
                    style={{ 
                      padding: '15px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🏢 Manage Placements
                  </button>
                  <button 
                    onClick={fetchDashboardData}
                    style={{ 
                      padding: '15px', 
                      backgroundColor: '#17a2b8', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>User Management</h2>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="academic_supervisor">Academic Supervisors</option>
                  <option value="workplace_supervisor">Workplace Supervisors</option>
                  <option value="admin">Admins</option>
                </select>
                <button onClick={fetchDashboardData} style={{ padding: '8px 16px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Refresh
                </button>
              </div>
              {filteredUsers.length === 0 ? (
                <p>No users found matching your criteria.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredUsers.map((user) => (
                    <div key={user.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{getFullName(user)}</h3>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Role: <span style={{ backgroundColor: '#27AE60', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{user.role}</span></p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Email: {user.email}</p>
                      {user.student_number && <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Student #: {user.student_number}</p>}
                      {user.department && <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Department: {user.department}</p>}
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleEditUser(user)}
                          style={{ padding: '5px 10px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#E74C3C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'placements' && (
            <div>
              <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Placement Management</h2>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search placements..."
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                />
                <button onClick={fetchDashboardData} style={{ padding: '8px 16px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Refresh
                </button>
              </div>
              {placements.length === 0 ? (
                <p>No placements found.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                  {placements.map((placement) => (
                    <div key={placement.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{placement.company_name}</h3>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Student: {placement.student?.full_name || placement.student?.username || 'Not assigned'}</p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Status: <span style={{ backgroundColor: '#27AE60', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{placement.status}</span></p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Duration: {formatDate(placement.start_date)} - {formatDate(placement.end_date)}</p>
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleEditPlacement(placement)}
                          style={{ padding: '5px 10px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePlacement(placement.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#E74C3C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'evaluations' && (
            <div>
              <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Evaluation Management</h2>
              {evaluations.length === 0 ? (
                <p>No evaluations found.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{evaluation.student?.full_name || evaluation.student?.username}</h3>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Placement: {evaluation.placement?.company_name}</p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Score: {evaluation.score}</p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Status: <span style={{ backgroundColor: '#27AE60', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{evaluation.status}</span></p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Date: {formatDate(evaluation.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard