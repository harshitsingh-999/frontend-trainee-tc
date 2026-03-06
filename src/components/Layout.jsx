import React from 'react'
import { NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom'

function Layout({ children, user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isLoginPage = location.pathname === '/'

  // If not authenticated and not on login page, redirect to login
  if (!user && !isLoginPage) {
    return <Navigate to="/" replace />
  }

  if (isLoginPage) {
    return children
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div
          className="brand"
          onClick={() => navigate('/dashboard')}
          aria-label="TeamComputers Intern Management"
        >
          <div className="brand-mark">t:</div>
          <div className="brand-text">
            <span className="brand-name">teamComputers</span>
            <span className="brand-subtitle">Intern Management</span>
          </div>
        </div>

        

<nav className="nav">

  {/* Show Dashboard ONLY if NOT Intern */}
  {user?.role !== "Intern" && (
    <NavLink
      to="/dashboard"
      className={({ isActive }) =>
        isActive ? 'nav-link nav-link-active' : 'nav-link'
      }
    >
      Dashboard
    </NavLink>
  )}

    {/* Intern Features */}

{user?.role === "Intern" && (
  <NavLink
    to="/intern"
    className={({ isActive }) =>
      isActive ? 'nav-link nav-link-active' : 'nav-link'
    }
  >
    Dashboard
  </NavLink>
)}

{user?.role === "Intern" && (
  <NavLink
    to="/attendance"
    className={({ isActive }) =>
      isActive ? 'nav-link nav-link-active' : 'nav-link'
    }
  >
    Attendance
  </NavLink>
)}

{user?.role === "Intern" && (
  <NavLink
    to="/tasks"
    className={({ isActive }) =>
      isActive ? 'nav-link nav-link-active' : 'nav-link'
    }
  >
    Tasks
  </NavLink>
)}

{user?.role === "Intern" && (
  <NavLink
    to="/notifications"
    className={({ isActive }) =>
      isActive ? 'nav-link nav-link-active' : 'nav-link'
    }
  >
    Notifications
  </NavLink>
)}

{user?.role === "Intern" && (
  <NavLink
    to="/leave"
    className={({ isActive }) =>
      isActive ? 'nav-link nav-link-active' : 'nav-link'
    }
  >
    Leave
  </NavLink>
)}

    {user?.role === "Manager" && (
  <NavLink
    to="/manager"
    className={({ isActive }) =>
      isActive ? 'nav-link nav-link-active' : 'nav-link'
    }
  >
    Manager Panel
  </NavLink>
)}

  {/* Show UserForm ONLY if Intern */}
  {user?.role === "Intern" && (
    <NavLink
      to="/user-form"
      className={({ isActive }) =>
        isActive ? 'nav-link nav-link-active' : 'nav-link'
      }
    >
      User Form
    </NavLink>
  )}

</nav>

      </aside>

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
              <button
                className="btn-secondary"
                onClick={() => navigate('/login')}
              >
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

