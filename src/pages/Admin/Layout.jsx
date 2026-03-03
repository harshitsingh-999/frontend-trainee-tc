import { Outlet, Link } from 'react-router-dom';
import './admin.css'

const AdminLayout = () => {
  //  Simple logout 
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>Admin Panel</h3>
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-link">📊 Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">👥 Users</Link>
          <Link to="/admin/trainees" className="admin-nav-link">🎓 Trainees</Link>
          <Link to="/admin/create-user" className="admin-nav-link">➕ Create User</Link>
          <button onClick={handleLogout} className="admin-logout-btn">🚪 Logout</button>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
