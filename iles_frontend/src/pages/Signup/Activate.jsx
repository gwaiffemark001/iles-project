import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { getErrorMessage } from '@/api/api'
import { roleToHomePath } from '@/routes/roleRedirect'

function Activate() {
  const { api, authenticateWithTokens } = useAuth()
  const navigate = useNavigate()
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
        // Call backend activation endpoint and auto-login using returned tokens
        const data = await api.get(`api/activate-account?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`, { auth: false })
        const authResult = await authenticateWithTokens({ access: data.access, refresh: data.refresh })
        setStatus('success')
        setMessage('Account activated successfully. Redirecting...')
        const destination = roleToHomePath(data?.role || authResult?.user?.role)
        setTimeout(() => {
          navigate(destination, { replace: true })
        }, 800)
      } catch (err) {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Activation failed or link expired.'))
      }
    }
    run()
  }, [api, authenticateWithTokens, location.search, navigate])

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
