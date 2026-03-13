import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FaBars, FaTachometerAlt, FaUsers, FaUserPlus, FaGraduationCap } from 'react-icons/fa'
import '../../style.css'

function AdminLayout() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    document.body.classList.add('authenticated')
    return () => document.body.classList.remove('authenticated')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

        <div className="sidebar-top">
          <button className="sidebar-hamburger" onClick={() => setCollapsed(!collapsed)}>
            <FaBars />
          </button>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name">TEAMCOMPUTERS</span>
              <span className="brand-subtitle">Admin Panel</span>
            </div>
          )}
        </div>

        <nav className="nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaTachometerAlt className="nav-icon" />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaUsers className="nav-icon" />
            {!collapsed && <span>User Management</span>}
          </NavLink>

          <NavLink to="/admin/create-user" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaUserPlus className="nav-icon" />
            {!collapsed && <span>Add User</span>}
          </NavLink>

          <NavLink to="/admin/trainees" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaGraduationCap className="nav-icon" />
            {!collapsed && <span>Trainees</span>}
          </NavLink>
        </nav>

      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Intern Management System</h1>
            <p className="page-subtitle">Track interns, buddies, and managers in one place.</p>
          </div>
          <div className="topbar-right">
            <div className="user-pill">
              <div className="user-avatar">
                {user.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <div className="user-name">{user.name || 'Admin'}</div>
                <div className="user-role">{user.role || 'Administrator'}</div>
              </div>
            </div>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

    </div>
  )
}

export default AdminLayout