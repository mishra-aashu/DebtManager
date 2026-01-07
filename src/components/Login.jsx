import { useState } from 'react'
import { apiClient } from '../utils/apiClient'

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await apiClient.login(formData.username, formData.password)
      console.log('✅ Login successful:', result)
      onLogin(result.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🏛️ FedEx Debt Manager</h1>
          <p>Secure Authentication Portal</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
