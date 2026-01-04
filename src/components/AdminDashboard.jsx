import { useState } from 'react'
import DebtUploader from './DebtUploader'
import { calculatePropensity, assignAgency } from '../utils/mlEngine'
import { FaHome, FaFileInvoiceDollar, FaTasks, FaFileUpload, FaSignOutAlt } from 'react-icons/fa'

const OfficialHeader = () => (
  <div className="official-header">
    <p>An Official Website of FedEx Federal Services</p>
  </div>
);

const Breadcrumbs = ({ view }) => (
  <div className="breadcrumbs">
    <span><FaHome /> Home</span> &gt; <span>Debt Management</span> &gt; <span>{view}</span>
  </div>
);

const Footer = () => (
  <footer className="main-footer">
    <div className="footer-content">
      <div className="footer-section">
        <h4>FedEx Federal Services</h4>
        <p>3000 Post Oak Blvd<br/>Houston, TX 77056</p>
      </div>
      <div className="footer-section">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="#/">Privacy Policy</a></li>
          <li><a href="#/">Terms of Service</a></li>
          <li><a href="#/">FOIA</a></li>
          <li><a href="#/">Accessibility</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h4>Contact Us</h4>
        <p>Phone: (800) 463-3339</p>
        <p>Email: fedex.gov@example.com</p>
      </div>
    </div>
    <div className="footer-bottom">
      <p>This system is for official use only. Last Updated: {new Date().toLocaleDateString()}</p>
    </div>
  </footer>
);

export default function AdminDashboard({ debts, updateDebts, onLogout }) {
  const [view, setView] = useState('Dashboard')

  // Calculate stats
  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0)
  const recoveredDebt = debts
    .filter(d => d.status === 'Paid')
    .reduce((sum, d) => sum + d.amount, 0)
  const pendingDebt = totalDebt - recoveredDebt
  const recoveryRate = totalDebt > 0 ? ((recoveredDebt / totalDebt) * 100).toFixed(1) : 0

  const handleReassign = () => {
    const reassigned = debts.map(debt => {
      if (debt.status === 'Pending') {
        const propensity = calculatePropensity(debt)
        const agency = assignAgency(propensity)
        return { ...debt, propensity, assignedTo: agency }
      }
      return debt
    })
    updateDebts(reassigned)
    alert('Risk assessment and re-allocation has been completed.')
  }

  const handleStatusChange = (id, newStatus) => {
    const updated = debts.map(d =>
      d.id === id ? { ...d, status: newStatus, lastUpdated: new Date().toISOString() } : d
    )
    updateDebts(updated)
  }

  return (
    <div className="dashboard">
      <OfficialHeader />
      <header className="dashboard-header">
        <div>
          <h1>FedEx Receivables Dashboard</h1>
        </div>
        <div className="header-actions">
          <button onClick={() => setView('Dashboard')} className={view === 'Dashboard' ? 'active' : ''}>
            <FaHome /> Dashboard
          </button>
          <button onClick={() => setView('Submit Documentation')} className={view === 'Submit Documentation' ? 'active' : ''}>
            <FaFileUpload /> Submit Documentation
          </button>
          <button onClick={() => setView('All Collection Files')} className={view === 'All Collection Files' ? 'active' : ''}>
            <FaTasks /> All Collection Files
          </button>
          <button onClick={onLogout} className="btn-logout"><FaSignOutAlt /> Logout</button>
        </div>
      </header>
      
      <Breadcrumbs view={view} />

      <main className="dashboard-content">
        {view === 'Dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Outstanding Receivables</h3>
                <p className="stat-value">${totalDebt.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Fiscal Year To Date Recovered</h3>
                <p className="stat-value">${recoveredDebt.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Active Collection Cases</h3>
                <p className="stat-value">{debts.filter(d => d.status === 'Pending').length}</p>
              </div>
              <div className="stat-card">
                <h3>Recovery Rate (%)</h3>
                <p className="stat-value">{recoveryRate}%</p>
              </div>
            </div>

            <div className="action-section">
              <button onClick={handleReassign} className="btn-ai">
                Execute Risk Assessment & Re-Allocation
              </button>
            </div>

            <div className="agency-performance">
              <h2>Contracted Collection Service Provider Performance</h2>
              {/* Agency performance table would go here */}
            </div>
          </div>
        )}

        {view === 'Submit Documentation' && (
          <DebtUploader updateDebts={updateDebts} existingDebts={debts} />
        )}

        {view === 'All Collection Files' && (
          <div className="cases-view">
            <h2>All Collection Files ({debts.length})</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Receivable Amount</th>
                    <th>Days Overdue</th>
                    <th>Risk Score</th>
                    <th>Assigned Provider</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(debt => (
                    <tr key={debt.id}>
                      <td>CASE-2024-{String(debt.id).padStart(5, '0')}</td>
                      <td>${debt.amount.toLocaleString()}</td>
                      <td>{debt.daysOverdue}</td>
                      <td>{debt.propensity}</td>
                      <td>{debt.assignedTo}</td>
                      <td>
                        <span className={`status-badge ${debt.status.toLowerCase()}`}>
                          {debt.status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={debt.status}
                          onChange={(e) => handleStatusChange(debt.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Promised">Promised</option>
                          <option value="Paid">Paid</option>
                          <option value="Refused">Refused</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}