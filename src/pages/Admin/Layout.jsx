import { Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import './admin.css';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="hamburger" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '=' : 'X'}
          </button>
          {!collapsed && <h3>Admin Panel</h3>}
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-link">
            {!collapsed && <span>Dashboard</span>}
            {collapsed && <span title="Dashboard">D</span>}
          </Link>
          <Link to="/admin/users" className="admin-nav-link">
            {!collapsed && <span>Manage Users</span>}
            {collapsed && <span title="Manage Users">U</span>}
          </Link>
          <Link to="/admin/create-user" className="admin-nav-link">
            {!collapsed && <span>Create User</span>}
            {collapsed && <span title="Create User">+</span>}
          </Link>
          <Link to="/admin/trainees" className="admin-nav-link">
            {!collapsed && <span>Trainees</span>}
            {collapsed && <span title="Trainees">T</span>}
          </Link>
          <button onClick={handleLogout} className="admin-logout-btn">
            {!collapsed && <span>Logout</span>}
            {collapsed && <span title="Logout">Out</span>}
          </button>
        </nav>
      </aside>

      <main className={`admin-content ${collapsed ? 'expanded' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;