import { useState, useEffect } from 'react'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import AgencyPortal from './components/AgencyPortal'
import { apiClient } from './utils/apiClient'

function App() {
  const [user, setUser] = useState(null)
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  // On initial load, try to verify existing token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        const response = await apiClient.verifyToken()
        if (response && response.valid) {
          setUser({
            id: response.user.user_id,
            username: response.user.username,
            role: response.user.role,
            agency: response.user.agency_name,
            fullName: response.user.full_name, // Assuming full_name is part of the token payload
            email: response.user.email // Assuming email is part of the token payload
          })
        } else {
          setUser(null)
          apiClient.logout() // Clear invalid token
        }
      } catch (error) {
        console.error('Error verifying token:', error)
        setUser(null)
        apiClient.logout()
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Fetch debts only when user is logged in
  useEffect(() => {
    if (user) {
      fetchDebts()
    } else {
      setDebts([]) // Clear debts if no user
    }
  }, [user]) // Depend on user state

  const fetchDebts = async () => {
    try {
      // Set loading true, but allow user state to handle main loading indicator
      const response = await apiClient.getAllCases()
      
      const formattedDebts = response.cases.map(c => ({
        id: c.id,
        customerId: c.customer_id,
        amount: parseFloat(c.amount), // Ensure amount is number
        daysOverdue: parseInt(c.days_overdue), // Ensure daysOverdue is number
        previousContacts: parseInt(c.previous_contacts), // Ensure previousContacts is number
        propensity: parseInt(c.propensity_score),
        assignedTo: c.assigned_agency,
        status: c.status,
        riskCategory: c.risk_category,
        mlConfidence: parseFloat(c.ml_confidence),
        lastUpdated: c.last_updated
      }))
      
      setDebts(formattedDebts)
    } catch (error) {
      console.error('Error fetching debts:', error)
      // If API fails, and it's an auth error, log out
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        apiClient.logout()
        setUser(null)
      }
    }
  }

  const updateDebts = (newDebts) => {
    setDebts(newDebts)
  }

  const handleLogout = () => {
    apiClient.logout()
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#003366',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading FedEx DCS...
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="app">
      {user.role === 'admin' ? (
        <AdminDashboard 
          debts={debts} 
          updateDebts={updateDebts} 
          onLogout={handleLogout}
          refreshData={fetchDebts}
        />
      ) : (
        <AgencyPortal 
          debts={debts} 
          updateDebts={updateDebts} 
          agency={user.agency}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
