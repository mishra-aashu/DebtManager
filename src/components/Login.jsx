import { useState } from 'react'
import { FaShieldAlt, FaUserCircle } from 'react-icons/fa'

const USERS = {
  'admin': { password: 'fedex123', role: 'admin' },
  'shark': { password: 'shark123', role: 'agency', agency: 'Shark Recovery' },
  'quick': { password: 'quick123', role: 'agency', agency: 'Quick Collections' },
  'digital': { password: 'digital123', role: 'agency', agency: 'Digital Bot' }
}

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = USERS[username]
    
    if (user && user.password === password) {
      onLogin({ username, ...user })
      setError('')
    } else {
      setError('Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <FaShieldAlt size={50} style={{ color: '#003366' }} />
          <h1>FedEx Federal Services</h1>
          <p>Outstanding Receivables Collection Portal</p>
        </div>

        <div className="warning-box">
          <h2>Authorized Access Only</h2>
          <p>This system is for official use by authorized personnel only. Unauthorized access or use is strictly prohibited and may be subject to criminal and civil penalties.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Official Username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary">Log In with Username/Password</button>
        </form>

        <div className="cac-login">
          <button className="btn-secondary" style={{ width: '100%' }}>
            <FaUserCircle /> Log In with CAC/PIV Card
          </button>
        </div>

        <div className="login-footer">
          <p>
            <strong>Security Warning:</strong> This is a U.S. Government computer system. Use of this system constitutes consent to monitoring, interception, recording, reading, copying, or capturing by authorized personnel.
          </p>
        </div>
      </div>
    </div>
  )
}