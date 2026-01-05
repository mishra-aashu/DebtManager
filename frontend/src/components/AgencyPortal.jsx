import { useState } from 'react';
import { FaHome, FaSignOutAlt, FaFilter } from 'react-icons/fa';

const OfficialHeader = () => (
  <div className="official-header">
    <p>An Official Website of FedEx Federal Services</p>
  </div>
);

const Breadcrumbs = ({ agency }) => (
  <div className="breadcrumbs">
    <span><FaHome /> Home</span> &gt; <span>Contracted Provider Portal</span> &gt; <span>{agency}</span>
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

export default function AgencyPortal({ debts, updateDebts, agency, onLogout }) {
  const [filter, setFilter] = useState('all');

  const myDebts = debts.filter(d => d.assignedTo === agency);

  const filteredDebts = filter === 'all'
    ? myDebts
    : myDebts.filter(d => d.status === filter);

  const handleStatusUpdate = (debtId, newStatus) => {
    const updated = debts.map(d =>
      d.id === debtId
        ? { ...d, status: newStatus, lastUpdated: new Date().toISOString() }
        : d
    );
    updateDebts(updated);
  };

  return (
    <div className="agency-portal">
      <OfficialHeader />
      <header className="dashboard-header">
        <div>
          <h1>{agency} - Provider Portal</h1>
          <p>Assigned Collection Files</p>
        </div>
        <button onClick={onLogout} className="btn-logout"><FaSignOutAlt /> Logout</button>
      </header>
      
      <Breadcrumbs agency={agency} />

      <main className="dashboard-content">
        <div className="filter-section">
          <FaFilter /> <strong>Filter by Status:</strong>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>
            All ({myDebts.length})
          </button>
          <button onClick={() => setFilter('Pending')} className={filter === 'Pending' ? 'active' : ''}>
            Action Required
          </button>
          <button onClick={() => setFilter('Contacted')} className={filter === 'Contacted' ? 'active' : ''}>
            Contacted
          </button>
          <button onClick={() => setFilter('Promised')} className={filter === 'Promised' ? 'active' : ''}>
            Payment Promised
          </button>
          <button onClick={() => setFilter('Paid')} className={filter === 'Paid' ? 'active' : ''}>
            Paid
          </button>
        </div>

        <div className="cases-grid">
          {filteredDebts.map(debt => (
            <div key={debt.id} className="case-card">
              <div className="case-header">
                <h3>CASE-{new Date(debt.lastUpdated).getFullYear()}-{String(debt.id).padStart(5, '0')}</h3>
                <span className={`status-badge ${debt.status.toLowerCase()}`}>{debt.status}</span>
              </div>

              <div className="case-details">
                <div className="detail-row">
                  <span>Receivable Amount:</span>
                  <strong>${debt.amount.toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Days Overdue:</span>
                  <strong>{debt.daysOverdue}</strong>
                </div>
                <div className="detail-row">
                  <span>Risk Score:</span>
                  <strong>{debt.propensity}</strong>
                </div>
              </div>

              <div className="action-buttons">
                <select
                  value={debt.status}
                  onChange={(e) => handleStatusUpdate(debt.id, e.target.value)}
                  className="status-select"
                  disabled={debt.status === 'Paid'}
                >
                  <option value="Pending">Set Status: Pending</option>
                  <option value="Contacted">Set Status: Contacted</option>
                  <option value="Promised">Set Status: Promised</option>
                  <option value="Paid">Set Status: Paid</option>
                  <option value="Refused">Set Status: Refused</option>
                </select>
              </div>

              <div className="case-footer">
                <small>Last Modified: {new Date(debt.lastUpdated).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>

        {filteredDebts.length === 0 && (
          <div className="empty-state">
            <h2>No collection files match the current filter.</h2>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}