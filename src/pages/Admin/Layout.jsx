import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaClipboardList,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa'
import { useAuth } from '../../context/authcontext.jsx'
import api from '../../api/login_api.js'
import { getNotifications, markAllNotificationsRead } from '../../api/api.js'
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
    to: '/admin/documents',
    icon: <FaClipboardList />,
    label: 'Document Approval',
    subtitle: 'Review and approve intern documents.',
  },
  // {
  //   to: '/admin/create-user',
  //   icon: <FaUserPlus />,
  //   label: 'Create User',
  //   subtitle: 'Add new managers and interns to the platform.',
  // },
]

const MOBILE_BREAKPOINT = 900

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef(null)
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  useEffect(() => {
    document.body.classList.add('authenticated')
    return () => document.body.classList.remove('authenticated')
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
    setDropdownOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let isMounted = true

    const fetchNotifs = async () => {
      try {
        const res = await getNotifications()
        const nextNotifications = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : []

        if (isMounted) {
          setNotifications(nextNotifications)
        }
      } catch {
        // Keep the layout usable even if notifications fail to load.
      }
    }

    fetchNotifs()
    const intervalId = window.setInterval(fetchNotifs, 60000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
        setNotifOpen(false)
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
    setNotifOpen(false)
    await logout()
    navigate('/login')
  }

  const handleNotificationsToggle = async () => {
    const nextOpen = !notifOpen
    setNotifOpen(nextOpen)
    setDropdownOpen(false)

    if (!nextOpen || unreadCount === 0) {
      return
    }

    try {
      await markAllNotificationsRead()
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      )
    } catch {
      // Notification reads can fail without blocking the layout.
    }
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
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={handleNotificationsToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: 6,
                }}
              >
                <FaBell size={20} color="#374151" />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 10,
                      width: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 36,
                    width: 320,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    zIndex: 9999,
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      fontWeight: 700,
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: 14,
                    }}
                  >
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ padding: 16, color: '#6b7280', fontSize: 13 }}>
                      No notifications.
                    </p>
                  ) : (
                    notifications.map((notification) => {
                      const createdAt = notification.createdAt || notification.created_at
                      const timestamp = createdAt
                        ? new Date(createdAt).toLocaleString()
                        : 'Unknown time'

                      return (
                        <div
                          key={notification.id}
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid #f9fafb',
                            background: notification.is_read ? '#fff' : '#eff6ff',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {notification.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {notification.message}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                            {timestamp}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div
              className="sa-user-btn"
              onClick={() => {
                setNotifOpen(false)
                setDropdownOpen((open) => !open)
              }}
            >
              <div className="sa-user-avatar">{renderAvatar('A')}</div>
              <div className="sa-user-info">
                <span className="sa-user-name">{user?.name || user?.email || 'Admin'}</span>
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
