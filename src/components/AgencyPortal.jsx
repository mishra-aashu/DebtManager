import { FaSignOutAlt } from 'react-icons/fa';

export default function AgencyPortal({ user, onLogout }) {
  return (
    <div className="agency-portal">
      <header className="dashboard-header">
        <div>
          <h1>{user.agency_name} - Provider Portal</h1>
          <p>Welcome, {user.username}</p>
        </div>
        <button onClick={onLogout} className="btn-logout"><FaSignOutAlt /> Logout</button>
      </header>
      
      <main className="dashboard-content">
        <div className="empty-state">
          <h2>Portal Under Construction</h2>
          <p>This section is not yet implemented in the new workflow.</p>
        </div>
      </main>
    </div>
  );
}