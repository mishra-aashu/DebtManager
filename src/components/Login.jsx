import { useState } from 'react'
import { apiClient } from '../utils/apiClient'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'agency',
    agency_name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

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
      onLogin({
        username: result.user.username,
        role: result.user.role,
        agency: result.user.agency_name,
        fullName: result.user.full_name,
        email: result.user.email
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Validate
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }
      
      if (formData.role === 'agency' && !formData.agency_name) {
        throw new Error('Agency name is required for agency users')
      }
      
      const result = await apiClient.register(formData)
      console.log('✅ Registration successful:', result)
      
      setSuccess('Registration successful! You can now login.')
      setMode('login')
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        email: '',
        full_name: '',
        role: 'agency',
        agency_name: ''
      })
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
          <h1>🏛️ FedEx Debt Management</h1>
          <p>Secure Authentication Portal</p>
        </div>
        
        <div className="auth-tabs">
          <button 
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setError('')
              setSuccess('')
            }}
          >
            LOGIN
          </button>
          <button 
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register')
              setError('')
              setSuccess('')
            }}
          >
            REGISTER
          </button>
        </div>

        {mode === 'login' ? (
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
            {success && <div className="success-message">{success}</div>}
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email @example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>
            
            <div className="form-group">
              <label>Password * (min 8 characters)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create strong password"
                required
                minLength="8"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                required
              >
                <option value="agency">Collection Agency</option>
                <option value="admin">FedEx Administrator</option>
              </select>
            </div>

            {formData.role === 'agency' && (
              <div className="form-group">
                <label>Agency Name *</label>
                <select 
                  name="agency_name" 
                  value={formData.agency_name} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Agency</option>
                  <option value="Shark Recovery">Shark Recovery</option>
                  <option value="Quick Collections">Quick Collections</option>
                  <option value="Digital Bot">Digital Bot</option>
                </select>
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <div className="demo-credentials">
           
          </div>
        )}
      </div>
    </div>
  )
}
