import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

function Activate() {
  const { api } = useAuth()
  const location = useLocation()
  const [status, setStatus] = useState('pending')
  const [message, setMessage] = useState('Activating account...')

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(location.search)
      const uid = params.get('uid')
      const token = params.get('token')
      if (!uid || !token) {
        setStatus('error')
        setMessage('Invalid activation link.')
        return
      }

      try {
        // Call backend activation endpoint
        await api.get(`api/activate-account?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`, { auth: false })
        setStatus('success')
        setMessage('Account activated successfully. You may now sign in.')
      } catch (err) {
        setStatus('error')
        setMessage(err?.response?.data?.detail || err?.message || 'Activation failed or link expired.')
      }
    }
    run()
  }, [api, location.search])

  return (
    <div style={{ padding: 24 }}>
      <h2>Account Activation</h2>
      <p>{message}</p>
      {status === 'success' ? (
        <p>
          <Link to="/">Go to login</Link>
        </p>
      ) : status === 'error' ? (
        <p>
          <Link to="/signup">Back to signup</Link>
        </p>
      ) : null}
    </div>
  )
}

export default Activate
