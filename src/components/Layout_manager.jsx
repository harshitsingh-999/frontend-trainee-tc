import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext.jsx'
import ProfileDrawer from '../pages/profiledrawer.jsx'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Close sidebar when route changes (user tapped a nav link on mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close sidebar on backdrop click
  useEffect(() => {
    if (!sidebarOpen) return
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sidebarOpen])

  if (location.pathname === '/login') return children

  const navLinks = [
    { to: '/dashboard',  label: '  Dashboard',  roles: [1, 2, 3, 4] },
    { to: '/attendance', label: '  Attendance',  roles: [1, 2, 3, 4] },
    { to: '/my-tasks',   label: '  My Tasks',    roles: [4] },
    { to: '/my-leaves',  label: '  My Leaves',   roles: [4] },
    { to: '/manager',    label: '  Manager',     roles: [1, 2] },
    { to: '/user-form',  label: '  User Form',   roles: [1] },
  ].filter(link => link.roles.includes(user?.role_id))

  return (
    <div className="app-shell">

      {/* Dark backdrop when sidebar is open on mobile */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside ref={sidebarRef} className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>

        {/* ✕ close button — only visible on mobile */}
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>

        <div className="brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-mark">t:</div>
          <div className="brand-text">
            <span className="brand-name">teamComputers</span>
            <span className="brand-subtitle">Intern Management</span>
          </div>
        </div>

        <nav className="nav">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User chip pinned to bottom of sidebar — helpful on mobile */}
        <div className="sidebar-user-chip">
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7, color: '#fff' }}>{user?.role}</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="main-area">
        <header className="topbar">

          {/* ☰ Hamburger — hidden on desktop, visible on mobile */}
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>

          <div className="topbar-left">
            <h1 className="page-title">Intern Management System</h1>
            <p className="page-subtitle">Track interns, buddies, and managers in one place.</p>
          </div>

          <div className="topbar-right">
            {user ? (
              <>
                <div
                  className="user-pill"
                  onClick={() => setProfileOpen(true)}
                  style={{ cursor: 'pointer' }}
                  title="View / edit your profile"
                >
                  <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase() || 'T'}</div>
                  <div className="user-pill-text">
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">
                      {user.role}
                      {user.role_id === 4 && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 3 }}>✏️</span>}
                    </div>
                  </div>
                </div>
                <button className="btn-secondary logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
            )}
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}

export default Layout
