import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { roleToHomePath } from '../routes/roleRedirect'
import ProfileEditor from '../components/ProfileEditor'
import UserAvatar from '../components/UserAvatar'
import { useState } from 'react'
import AvatarModal from '../components/AvatarModal'

export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, user } = useAuth()
  const profileUser = location.state?.profileUser || user
  const isOwnProfile = !location.state?.profileUser || location.state.profileUser?.id === user?.id
  const openedFromChat = Boolean(location.state?.fromChat)

  const handleBack = () => {
    if (isOwnProfile) {
      navigate(roleToHomePath(role))
      return
    }

    if (openedFromChat) {
      navigate(roleToHomePath(role), {
        state: {
          activeTab: 'chat',
          activeSection: 'chat',
        },
      })
      return
    }

    navigate(-1)
  }

  const [modalSrc, setModalSrc] = useState(null)
  const closeModal = () => setModalSrc(null)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>{isOwnProfile ? 'Profile' : 'User Profile'}</h1>
          </div>
          <button
            type="button"
            onClick={handleBack}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '10px 18px',
              background: '#0A1D37',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {isOwnProfile ? 'Back to dashboard' : 'Back to chat'}
          </button>
        </div>
        {isOwnProfile ? (
          <ProfileEditor />
        ) : (
          <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', alignItems: 'center' }}>
            <div onClick={() => setModalSrc(profileUser?.profile?.avatar_image || profileUser?.profile?.avatar_url || null)} style={{ cursor: 'pointer' }}>
              <UserAvatar user={profileUser} size="large" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px', color: '#0f172a' }}>{profileUser?.full_name || profileUser?.username || 'User'}</h2>
              <p style={{ margin: '0 0 12px', color: '#64748b' }}>{profileUser?.role || 'User'}</p>
              <div style={{ display: 'grid', gap: '8px', color: '#1e293b' }}>
                <div><strong>Username:</strong> {profileUser?.username || '-'}</div>
                <div><strong>Email:</strong> {profileUser?.email || '-'}</div>
                <div><strong>Phone:</strong> {profileUser?.phone || '-'}</div>
                <div><strong>Department:</strong> {profileUser?.department || '-'}</div>
              </div>
            </div>
          </div>
        )}
        <AvatarModal src={modalSrc} alt={profileUser?.full_name || profileUser?.username} onClose={closeModal} />
      </div>
    </div>
  )
}