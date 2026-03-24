import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaChevronDown,
  FaClipboardList,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa'
import { useAuth } from '../../context/authcontext.jsx'
import api from '../../api/login_api.js'
import '../SuperAdmin/superadmin.css'

const API_BASE = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, '')
  : 'http://localhost:7357'

const getAvatarUrl = (url) => (url ? `${API_BASE}${url}` : null)

const NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    icon: <FaTachometerAlt />,
    label: 'Dashboard',
    subtitle: 'View admin stats and the latest system overview.',
  },
  {
    to: '/admin/users',
    icon: <FaUsers />,
    label: 'User Management',
    subtitle: 'Manage intern and manager accounts from one place.',
  },
  {
    to: '/admin/create-user',
    icon: <FaUserPlus />,
    label: 'Create User',
    subtitle: 'Add new managers and interns to the platform.',
  },
]

const MOBILE_BREAKPOINT = 900

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('authenticated')
    return () => document.body.classList.remove('authenticated')
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentItem =
    NAV_ITEMS.find(({ to }) => location.pathname.startsWith(to)) || NAV_ITEMS[0]

  const toggleSidebar = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setMobileSidebarOpen((open) => !open)
      return
    }
    setCollapsed((value) => !value)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  const renderAvatar = (fallback) => {
    if (user?.profile_picture) {
      return (
        <img
          src={getAvatarUrl(user.profile_picture)}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )
    }

    return fallback || user?.name?.charAt(0)?.toUpperCase() || 'A'
  }

  return (
    <div className={`sa-shell has-mobile-sidebar ${collapsed ? 'sa-collapsed' : ''}`}>
      {mobileSidebarOpen && (
        <button
          type="button"
          className="sa-mobile-backdrop"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`sa-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sa-sidebar-top">
          <button type="button" className="sa-hamburger" onClick={toggleSidebar}>
            <FaBars />
          </button>
          {!collapsed && <span className="sa-sidebar-title">TEAMCOMPUTERS</span>}
        </div>

        <nav className="sa-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sa-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="sa-nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sa-nav-link sa-logout-link" onClick={handleLogout}>
          <span className="sa-nav-icon">
            <FaSignOutAlt />
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <div className="sa-main">
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <button
              type="button"
              className="sa-mobile-toggle"
              aria-label="Open sidebar"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <FaBars />
            </button>
            <div>
              <h1 className="sa-topbar-title">Intern Management System</h1>
              <p className="sa-topbar-sub">{currentItem.subtitle}</p>
            </div>
          </div>

          <div className="sa-topbar-right" ref={dropdownRef}>
            <div className="sa-user-btn" onClick={() => setDropdownOpen((open) => !open)}>
              <div className="sa-user-avatar">{renderAvatar('A')}</div>
              <div className="sa-user-info">
                <span className="sa-user-name">{user?.email || user?.name || 'Admin'}</span>
                <span className="sa-user-role">Administrator</span>
              </div>
              <FaChevronDown className={`sa-chevron ${dropdownOpen ? 'open' : ''}`} />
            </div>

            {dropdownOpen && (
              <div className="sa-dropdown">
                <div className="sa-dropdown-header">
                  <div className="sa-dd-avatar">{renderAvatar('A')}</div>
                  <div>
                    <div className="sa-dd-name">{user?.name || 'Admin'}</div>
                    <div className="sa-dd-email">{user?.email || 'admin@company.com'}</div>
                    <span className="sa-dd-badge">Admin</span>
                  </div>
                </div>
                <hr className="sa-dd-divider" />
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    className="sa-dd-item"
                    onClick={() => {
                      navigate(item.to)
                      setDropdownOpen(false)
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="sa-dd-item"
                  onClick={() => {
                    navigate('/admin/dashboard')
                    setDropdownOpen(false)
                  }}
                >
                  <FaClipboardList /> Quick Overview
                </button>
                <hr className="sa-dd-divider" />
                <button type="button" className="sa-dd-item sa-dd-logout" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="sa-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
