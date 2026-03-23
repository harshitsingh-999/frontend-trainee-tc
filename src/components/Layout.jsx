import React, { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FaBars, FaTachometerAlt, FaUsers, FaUserPlus } from 'react-icons/fa'
import Sidebar from "./Sidebar";


function Layout({ children, user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    if (isLoginPage) {
      document.body.classList.remove('authenticated')
    } else {
      document.body.classList.add('authenticated')
    }
    return () => {
      document.body.classList.remove('authenticated')
    }
  }, [isLoginPage])

  if (isLoginPage) {
    return children
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

        <div className="sidebar-top">
          <button
            className="sidebar-hamburger"
            onClick={() => setCollapsed(!collapsed)}
          >
            <FaBars />
          </button>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name">TEAMCOMPUTERS</span>
              <span className="brand-subtitle">Intern Management</span>
            </div>
          )}
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaTachometerAlt className="nav-icon" />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaUsers className="nav-icon" />
            {!collapsed && <span>User Management</span>}
          </NavLink>

          <NavLink to="/user-form" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            <FaUserPlus className="nav-icon" />
            {!collapsed && <span>Add User</span>}
          </NavLink>
        </nav>

      </aside> */}
      <Sidebar 
  role={user?.role || "intern"} 
  collapsed={collapsed} 
  toggleCollapse={() => setCollapsed(!collapsed)} 
/>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Intern Management System</h1>
            <p className="page-subtitle">
              Track interns, buddies, and managers in one place.
            </p>
          </div>
          <div className="topbar-right">
            {user ? (
              <>
                <div className="user-pill">
                  <div className="user-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">{user.role}</div>
                  </div>
                </div>
                <button className="btn-secondary" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                Login
              </button>
            )}
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}

export default Layout