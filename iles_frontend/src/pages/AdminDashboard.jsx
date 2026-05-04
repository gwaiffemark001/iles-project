import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { useAuth } from '../auth/useAuth'
import { criteriaAPI, evaluationsAPI } from '../api/api'

const userRoles = [
  { value: 'student', label: 'Student' },
  { value: 'workplace_supervisor', label: 'Workplace Supervisor' },
  { value: 'academic_supervisor', label: 'Academic Supervisor' },
  { value: 'admin', label: 'Admin' },
]

const placementStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

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
  const [editingEntity, setEditingEntity] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  
  // Criteria management state
  const [criteria, setCriteria] = useState([])
  const [showCriteriaForm, setShowCriteriaForm] = useState(false)
  const [criteriaFormData, setCriteriaFormData] = useState({ name: '', description: '', max_score: '', weight_percent: '' })
  const [editingCriteria, setEditingCriteria] = useState(null)
  const [criteriaSaving, setCriteriaSaving] = useState(false)
  const [criteriaError, setCriteriaError] = useState('')
  
  // Evaluation detail modal state
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  const closeEditModal = () => {
    if (editSaving) {
      return
    }

    setEditingEntity(null)
    setEditingItem(null)
    setEditFormData({})
    setEditError('')
  }

  const handleEditFieldChange = (event) => {
    const { name, value } = event.target
    setEditFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  const handleEditUser = (selectedUser) => {
    setEditingEntity('user')
    setEditingItem(selectedUser)
    setEditError('')
    setEditFormData({
      username: selectedUser.username || '',
      email: selectedUser.email || '',
      first_name: selectedUser.first_name || '',
      last_name: selectedUser.last_name || '',
      role: selectedUser.role || 'student',
      phone: selectedUser.phone || '',
      department: selectedUser.department || '',
      staff_number: selectedUser.staff_number || '',
      student_number: selectedUser.student_number || '',
      registration_number: selectedUser.registration_number || '',
      password: '',
    })
  }

  const handleEditPlacement = (selectedPlacement) => {
    setEditingEntity('placement')
    setEditingItem(selectedPlacement)
    setEditError('')
    setEditFormData({
      student_id: selectedPlacement.student?.id ? String(selectedPlacement.student.id) : '',
      workplace_supervisor_id: selectedPlacement.workplace_supervisor?.id ? String(selectedPlacement.workplace_supervisor.id) : '',
      academic_supervisor_id: selectedPlacement.academic_supervisor?.id ? String(selectedPlacement.academic_supervisor.id) : '',
      company_name: selectedPlacement.company_name || '',
      company_address: selectedPlacement.company_address || '',
      start_date: selectedPlacement.start_date || '',
      end_date: selectedPlacement.end_date || '',
      status: selectedPlacement.status || 'pending',
    })
  }

  const handleSaveEdit = async (event) => {
    event.preventDefault()

    if (!editingEntity || !editingItem) {
      return
    }

    setEditSaving(true)
    setEditError('')

    try {
      if (editingEntity === 'user') {
        const payload = {
          username: editFormData.username.trim(),
          email: editFormData.email.trim(),
          first_name: editFormData.first_name.trim(),
          last_name: editFormData.last_name.trim(),
          role: editFormData.role,
          phone: editFormData.phone.trim(),
          department: editFormData.department.trim(),
          staff_number: editFormData.staff_number.trim(),
          student_number: editFormData.student_number.trim(),
          registration_number: editFormData.registration_number.trim(),
        }

        if (editFormData.password.trim()) {
          payload.password = editFormData.password.trim()
        }

        const response = await axios.put(
          `http://127.0.0.1:8000/api/users/${editingItem.id}/`,
          payload,
          authHeaders,
        )

        setUsers((currentUsers) => currentUsers.map((existingUser) => (
          existingUser.id === editingItem.id ? response.data : existingUser
        )))
      }

      if (editingEntity === 'placement') {
        const payload = {
          student_id: editFormData.student_id ? Number(editFormData.student_id) : null,
          workplace_supervisor_id: editFormData.workplace_supervisor_id ? Number(editFormData.workplace_supervisor_id) : null,
          academic_supervisor_id: editFormData.academic_supervisor_id ? Number(editFormData.academic_supervisor_id) : null,
          company_name: editFormData.company_name.trim(),
          company_address: editFormData.company_address.trim(),
          start_date: editFormData.start_date,
          end_date: editFormData.end_date,
          status: editFormData.status,
        }

        const response = await axios.put(
          `http://127.0.0.1:8000/api/placements/${editingItem.id}/`,
          payload,
          authHeaders,
        )

        setPlacements((currentPlacements) => currentPlacements.map((existingPlacement) => (
          existingPlacement.id === editingItem.id ? response.data : existingPlacement
        )))
      }

      closeEditModal()
      alert('Changes saved successfully')
    } catch (requestError) {
      const message = requestError?.response?.data?.error || requestError?.response?.data?.message || requestError?.message || 'Unable to save changes.'
      setEditError(message)
    } finally {
      setEditSaving(false)
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

  // Criteria handlers
  const handleAddCriteria = () => {
    setEditingCriteria(null)
    setCriteriaFormData({ name: '', description: '', max_score: '', weight_percent: '' })
    setShowCriteriaForm(true)
    setCriteriaError('')
  }

  const handleEditCriteria = (crit) => {
    setEditingCriteria(crit)
    setCriteriaFormData({
      name: crit.name || '',
      description: crit.description || '',
      max_score: crit.max_score || '',
      weight_percent: crit.weight_percent || '',
    })
    setShowCriteriaForm(true)
    setCriteriaError('')
  }

  const handleSaveCriteria = async (e) => {
    e.preventDefault()
    setCriteriaSaving(true)
    setCriteriaError('')
    
    try {
      const payload = {
        name: criteriaFormData.name.trim(),
        description: criteriaFormData.description.trim(),
        max_score: Number(criteriaFormData.max_score),
        weight_percent: Number(criteriaFormData.weight_percent),
      }

      if (editingCriteria) {
        const response = await criteriaAPI.updateCriteria(editingCriteria.id, payload)
        setCriteria(prev => prev.map(c => c.id === editingCriteria.id ? response.data : c))
      } else {
        const response = await criteriaAPI.createCriteria(payload)
        setCriteria(prev => [...prev, response.data])
      }

      setShowCriteriaForm(false)
      setCriteriaFormData({ name: '', description: '', max_score: '', weight_percent: '' })
      setEditingCriteria(null)
    } catch (err) {
      setCriteriaError(err.response?.data?.message || 'Error saving criteria')
    } finally {
      setCriteriaSaving(false)
    }
  }

  const handleDeleteCriteria = async (critId) => {
    if (window.confirm('Are you sure you want to delete this criteria?')) {
      try {
        await criteriaAPI.deleteCriteria(critId)
        setCriteria(prev => prev.filter(c => c.id !== critId))
      } catch (err) {
        alert('Error deleting criteria: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const handleDeleteEvaluation = async (evalId) => {
    if (window.confirm('Are you sure you want to delete this evaluation?')) {
      try {
        await evaluationsAPI.deleteEvaluation(evalId)
        setEvaluations(prev => prev.filter(e => e.id !== evalId))
        setSelectedEvaluation(null)
      } catch (err) {
        alert('Error deleting evaluation: ' + (err.response?.data?.message || err.message))
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsResponse, placementsResponse, evaluationsResponse, usersResponse, criteriaResponse] =
        await Promise.all([
          axios.get('http://127.0.0.1:8000/api/admin/statistics/', authHeaders),
          axios.get('http://127.0.0.1:8000/api/placements/', authHeaders),
          axios.get('http://127.0.0.1:8000/api/evaluations/', authHeaders),
          axios.get('http://127.0.0.1:8000/api/users/', authHeaders),
          criteriaAPI.getCriteria(),
        ])

      setStats(statsResponse.data)
      setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : [])
      setEvaluations(Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : [])
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : [])
      setCriteria(Array.isArray(criteriaResponse.data) ? criteriaResponse.data : [])

      console.log('Dashboard data loaded successfully')
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || 'Unable to load admin dashboard data.'
      setError(message)
      console.error('Dashboard error:', requestError)
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchDashboardData();
    };

    initializeDashboard();
  }, [fetchDashboardData])

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
            onClick={() => setActiveSection('criteria')}
            style={{ 
              padding: '10px', 
              backgroundColor: activeSection === 'criteria' ? '#34495e' : 'transparent',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            📋 Criteria
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>Evaluation Management</h2>
                <button onClick={() => setActiveSection('criteria')} style={{ padding: '8px 16px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Manage Criteria
                </button>
              </div>
              {evaluations.length === 0 ? (
                <p>No evaluations found.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{evaluation.evaluator_name || 'Unknown Evaluator'}</h3>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Student: {evaluation.placement?.student?.full_name || 'Unknown'}</p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Placement: {evaluation.placement?.company_name}</p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Type: {evaluation.evaluation_type}</p>
                      <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#27AE60' }}>Score: {evaluation.score}</p>
                      <p style={{ margin: '5px 0', color: '#7f8c8d', fontSize: '12px' }}>Date: {new Date(evaluation.evaluated_at).toLocaleDateString()}</p>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => setSelectedEvaluation(evaluation)} style={{ padding: '6px 12px', backgroundColor: '#2980B9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          View Details
                        </button>
                        <button onClick={() => handleDeleteEvaluation(evaluation.id)} style={{ padding: '6px 12px', backgroundColor: '#E74C3C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'criteria' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>Evaluation Criteria</h2>
                <button onClick={handleAddCriteria} style={{ padding: '8px 16px', backgroundColor: '#27AE60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Add Criteria
                </button>
              </div>

              {showCriteriaForm && (
                <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h3>{editingCriteria ? 'Edit Criteria' : 'New Criteria'}</h3>
                  {criteriaError && <div style={{ color: 'red', marginBottom: '10px' }}>{criteriaError}</div>}
                  <form onSubmit={handleSaveCriteria} style={{ display: 'grid', gap: '12px' }}>
                    <label>
                      Name
                      <input
                        type="text"
                        value={criteriaFormData.name}
                        onChange={(e) => setCriteriaFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        value={criteriaFormData.description}
                        onChange={(e) => setCriteriaFormData(prev => ({ ...prev, description: e.target.value }))}
                        style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '80px' }}
                      />
                    </label>
                    <label>
                      Max Score
                      <input
                        type="number"
                        step="0.5"
                        value={criteriaFormData.max_score}
                        onChange={(e) => setCriteriaFormData(prev => ({ ...prev, max_score: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                      />
                    </label>
                    <label>
                      Weight (%)
                      <input
                        type="number"
                        step="0.5"
                        value={criteriaFormData.weight_percent}
                        onChange={(e) => setCriteriaFormData(prev => ({ ...prev, weight_percent: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" disabled={criteriaSaving} style={{ padding: '8px 16px', backgroundColor: '#27AE60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {criteriaSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setShowCriteriaForm(false)} disabled={criteriaSaving} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {criteria.length === 0 ? (
                <p>No criteria defined yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {criteria.map((crit) => (
                    <div key={crit.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{crit.name}</h3>
                      <p style={{ margin: '4px 0', color: '#7f8c8d', fontSize: '14px' }}>{crit.description}</p>
                      <p style={{ margin: '8px 0', color: '#2c3e50' }}>
                        Max Score: <strong>{crit.max_score}</strong> | Weight: <strong>{crit.weight_percent}%</strong>
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button onClick={() => handleEditCriteria(crit)} style={{ padding: '6px 12px', backgroundColor: '#3498DB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCriteria(crit.id)} style={{ padding: '6px 12px', backgroundColor: '#E74C3C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingEntity && editingItem && (
        <div
          role="presentation"
          onClick={closeEditModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(960px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 id="admin-edit-title" style={{ margin: '0 0 8px 0', color: '#0f172a' }}>
                  {editingEntity === 'user' ? 'Edit User' : 'Edit Placement'}
                </h2>
                <p style={{ margin: 0, color: '#64748b' }}>
                  Update the record details and save the changes back to the system.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                style={{
                  border: 'none',
                  backgroundColor: '#e2e8f0',
                  color: '#0f172a',
                  borderRadius: '999px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {editError ? (
              <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                {editError}
              </div>
            ) : null}

            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: '18px' }}>
              {editingEntity === 'user' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Username</span>
                      <input name="username" value={editFormData.username || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Email</span>
                      <input name="email" type="email" value={editFormData.email || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Role</span>
                      <select name="role" value={editFormData.role || 'student'} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle}>
                        {userRoles.map((roleOption) => (
                          <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>First Name</span>
                      <input name="first_name" value={editFormData.first_name || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Last Name</span>
                      <input name="last_name" value={editFormData.last_name || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Phone</span>
                      <input name="phone" value={editFormData.phone || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Department</span>
                      <input name="department" value={editFormData.department || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Staff Number</span>
                      <input name="staff_number" value={editFormData.staff_number || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Student Number</span>
                      <input name="student_number" value={editFormData.student_number || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Registration Number</span>
                      <input name="registration_number" value={editFormData.registration_number || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span style={{ color: '#475569', fontSize: '14px' }}>Reset Password</span>
                    <input
                      name="password"
                      type="password"
                      value={editFormData.password || ''}
                      onChange={handleEditFieldChange}
                      placeholder="Leave blank to keep the current password"
                      disabled={editSaving}
                      style={editInputStyle}
                    />
                  </label>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Student</span>
                      <select name="student_id" value={editFormData.student_id || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle}>
                        <option value="">Unassigned</option>
                        {users.filter((candidate) => candidate.role === 'student').map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>{getFullName(candidate)} ({candidate.username})</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Workplace Supervisor</span>
                      <select name="workplace_supervisor_id" value={editFormData.workplace_supervisor_id || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle}>
                        <option value="">Select supervisor</option>
                        {users.filter((candidate) => candidate.role === 'workplace_supervisor').map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>{getFullName(candidate)} ({candidate.username})</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Academic Supervisor</span>
                      <select name="academic_supervisor_id" value={editFormData.academic_supervisor_id || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle}>
                        <option value="">Select supervisor</option>
                        {users.filter((candidate) => candidate.role === 'academic_supervisor').map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>{getFullName(candidate)} ({candidate.username})</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span style={{ color: '#475569', fontSize: '14px' }}>Company Name</span>
                    <input name="company_name" value={editFormData.company_name || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                  </label>

                  <label style={{ display: 'grid', gap: '8px' }}>
                    <span style={{ color: '#475569', fontSize: '14px' }}>Company Address</span>
                    <textarea name="company_address" value={editFormData.company_address || ''} onChange={handleEditFieldChange} disabled={editSaving} rows="3" style={{ ...editInputStyle, resize: 'vertical' }} />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Start Date</span>
                      <input name="start_date" type="date" value={editFormData.start_date || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>End Date</span>
                      <input name="end_date" type="date" value={editFormData.end_date || ''} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>Status</span>
                      <select name="status" value={editFormData.status || 'pending'} onChange={handleEditFieldChange} disabled={editSaving} style={editInputStyle}>
                        {placementStatuses.map((statusOption) => (
                          <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editSaving}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEvaluation && (
        <div
          role="presentation"
          onClick={() => setSelectedEvaluation(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(600px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Evaluation Details</h2>
                <p style={{ margin: 0, color: '#64748b' }}>View evaluation breakdown by criteria</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvaluation(null)}
                style={{
                  border: 'none',
                  backgroundColor: '#e2e8f0',
                  color: '#0f172a',
                  borderRadius: '999px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Student</h3>
                <p style={{ margin: 0, color: '#475569' }}>{selectedEvaluation.placement?.student?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Placement</h3>
                <p style={{ margin: 0, color: '#475569' }}>{selectedEvaluation.placement?.company_name || 'Unknown'}</p>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Evaluator</h3>
                <p style={{ margin: 0, color: '#475569' }}>{selectedEvaluation.evaluator_name || 'Unknown'}</p>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Type</h3>
                <p style={{ margin: 0, color: '#475569', textTransform: 'capitalize' }}>{selectedEvaluation.evaluation_type}</p>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Overall Score</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#27AE60' }}>{selectedEvaluation.score}</p>
              </div>

              {selectedEvaluation.items && selectedEvaluation.items.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Criteria Breakdown</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {selectedEvaluation.items.map((item, idx) => (
                      <div key={idx} style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0f172a' }}>{item.criteria?.name || 'Unknown Criteria'}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Max: {item.criteria?.max_score} | Weight: {item.criteria?.weight_percent}%</p>
                        </div>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{item.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteEvaluation(selectedEvaluation.id)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#E74C3C',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Delete Evaluation
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvaluation(null)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const editInputStyle = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#fff',
  color: '#0f172a',
  fontSize: '14px',
}

export default AdminDashboard