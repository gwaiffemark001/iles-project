import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { roleToHomePath } from '../routes/roleRedirect'
import ProfileEditor from '../components/ProfileEditor'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { role, user } = useAuth()

  const goBack = () => {
    navigate(roleToHomePath(role || user?.role))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>Profile</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>{user?.username || 'Account'} settings and avatar</p>
          </div>
          <button
            type="button"
            onClick={goBack}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '10px 18px',
              background: '#0A1D37',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Back to dashboard
          </button>
        </div>
        <ProfileEditor />
      </div>
    </div>
  )
}