import DebtUploader from './DebtUploader';
import { FaSignOutAlt } from 'react-icons/fa';

export default function AdminDashboard({ user, onLogout }) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>FedEx Debt Manager - Admin Console</h1>
          <p>Welcome, {user.username}</p>
        </div>
        <div className="header-actions">
          <button onClick={onLogout} className="btn-logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <DebtUploader />
      </main>
    </div>
  );
}