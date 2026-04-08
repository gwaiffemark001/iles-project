import { useState } from 'react'
import axios from 'axios'

 function LoginPage() {
    // useState stores what the user types
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('') // shows success or error
    const [ loading, setLoading] = useState(false) // shows 'Loading....' while waiting
    
    // This function runs when user clicks Login
    const handleLogin = async () => {
        setLoading(true)  // show loading
        setMessage('')  // clear old message

        try {
            // send username and password to Django
            const response = await axios.post('http://127.0.0.1:8000/api/token/', {
                username: username,
                password: password,
            })
            
            // Django returned tokens - save them
            localStorage.setItem('access_token', response.data.access)
            localStorage.setItem('refresh_token', response.data.refresh)

            setMessage('Login successful! Welcome ' + username)
        } catch (error) {
            // Login failed - show error
            setMessage('Login failed. Check your username and password.')
        }
        setLoading(false)  // hide loading
    }
    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ccc', borderRadius: '8px'}}>
            <h2 style= {{ textAlign: 'center', color: '#1F3864' }} >
                ILES - Login
            </h2>

            <div style={{ marginBottom: '15px' }}>
                <label>Username</label>
                <input
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder= 'Enter your username'
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                />    
            </div>

            <div style={{ marginBottom: '15px' }} >
                <label>Password</label>
                <input
                type='password'
                value={password}
                onChange={ (e) => setPassword(e.target.value)}
                placeholder='Enter your password'
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            </div>

            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#2E75B6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }} >
                {loading ? 'Logging in ...' : 'Login'}
            </button>

            {message && (
                <p style={{ marginTop: '15px', testAlign: 'center', color: message.includes('successful') ? 'green' : 'red' }}>{message}</p>
            )}

        </div>
    )
  }
  export default LoginPage