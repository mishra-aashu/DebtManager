import { useState, useEffect } from 'react'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import AgencyPortal from './components/AgencyPortal'
import { apiClient } from './utils/apiClient'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On initial load, try to verify existing token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.verifyToken()
        // The new verifyToken returns the user payload directly or throws an error
        if (response && response.user) {
          setUser(response.user)
        } else {
          setUser(null)
          apiClient.logout()
        }
      } catch (error) {
        console.error('Token verification failed:', error)
        setUser(null)
        apiClient.logout()
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    apiClient.logout()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="loading-container">
        Loading FedEx Debt Manager...
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      {user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <AgencyPortal user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
