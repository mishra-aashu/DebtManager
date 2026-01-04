import { useState, useEffect } from 'react'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import AgencyPortal from './components/AgencyPortal'
import { initializeData } from './utils/mlEngine'

function App() {
  const [user, setUser] = useState(null)
  const [debts, setDebts] = useState([])

  useEffect(() => {
    const storedDebts = localStorage.getItem('outstandingReceivables')
    if (!storedDebts) {
      const initialData = initializeData()
      localStorage.setItem('outstandingReceivables', JSON.stringify(initialData))
      setDebts(initialData)
    } else {
      setDebts(JSON.parse(storedDebts))
    }
  }, [])

  const updateDebts = (newDebts) => {
    setDebts(newDebts)
    localStorage.setItem('outstandingReceivables', JSON.stringify(newDebts))
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-to-main-content">Skip to main content</a>
      
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <main id="main-content">
          {user.role === 'admin' ? (
            <AdminDashboard 
              debts={debts} 
              updateDebts={updateDebts} 
              onLogout={handleLogout}
            />
          ) : (
            <AgencyPortal 
              debts={debts} 
              updateDebts={updateDebts} 
              agency={user.agency}
              onLogout={handleLogout}
            />
          )}
        </main>
      )}
    </div>
  )
}

export default App