import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaBell,
  FaCalendarAlt,
  FaChevronDown,
  FaClipboardList,
  FaProjectDiagram,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTasks,
  FaUserCircle,
  FaUserPlus,
  FaUserTie,
} from 'react-icons/fa'
import { useAuth } from '../context/authcontext.jsx'
import ProfileDrawer from '../pages/profiledrawer.jsx'
import { getNotifications, markAllNotificationsRead } from '../api/api'
import api from '../api/login_api.js'
import '../pages/SuperAdmin/superadmin.css'

const API_BASE = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, '')
  : 'http://localhost:7357'

const MOBILE_BREAKPOINT = 900

const getAvatarUrl = (url) => (url ? `${API_BASE}${url}` : null)

const ROLE_LABELS = {
  1: 'Admin',
  2: 'Manager',
  3: 'Buddy',
  4: 'Intern',
}

const NAV_LINKS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    subtitle: 'View your role-specific dashboard and summary.',
    icon: <FaTachometerAlt />,
    roles: [1, 2, 3, 4],
  },
  {
    to: '/notifications',
    label: 'Notifications',
    subtitle: 'View all system notifications and alerts.',
    icon: <FaBell />,
    roles: [1, 2, 3, 4],
  },
  {
    to: '/attendance',
    label: 'Attendance',
    subtitle: 'Review daily attendance and leave information.',
    icon: <FaClipboardList />,
    roles: [1, 2, 3, 4],
  },
  {
    to: '/my-tasks',
    label: 'My Tasks',
    subtitle: 'Track assigned tasks and current delivery work.',
    icon: <FaTasks />,
    roles: [4],
  },
  {
    to: '/my-leaves',
    label: 'My Leaves',
    subtitle: 'Manage leave history and pending leave requests.',
    icon: <FaCalendarAlt />,
    roles: [4],
  },
  {
    to: '/calendar',
    label: 'Calendar',
    subtitle: 'Check schedules, leaves, and important upcoming dates.',
    icon: <FaCalendarAlt />,
    roles: [1, 2, 3, 4],
  },
  {
  to: '/daily-report',
  label: 'Daily Report',
  subtitle: 'Submit your end-of-day work report to your manager.',
  icon: <FaClipboardList />,
  roles: [4],   // Intern only
},
  {
    to: '/manager/daily-reports',
    label: 'Daily Reports',
    subtitle: 'View and acknowledge intern daily reports.',
    icon: <FaClipboardList />,
    roles: [2],  // Manager only
  },
  // {
  //   to: '/manager',
  //   label: 'Manager',
  //   subtitle: 'Manage interns, tasks, and daily team coordination.',
  //   icon: <FaUserTie />,
  //   roles: [1, 2],
  // },
  {
    to: '/project-progress',
    label: 'Project Progress',
    subtitle: 'Monitor project health and delivery progress.',
    icon: <FaProjectDiagram />,
    roles: [1, 2],
  },
  {
    to: '/user-form',
    label: 'User Form',
    subtitle: 'Create and manage trainee onboarding records.',
    icon: <FaUserPlus />,
    roles: [1],
  },
]

function LayoutManager({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef(null)
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications()
      const nextNotifications = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : []

      setNotifications(nextNotifications)
      return nextNotifications
    } catch {
      return []
    }
  }, [])

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

    const load = async () => {
      const nextNotifications = await fetchNotifications()
      if (!isMounted) return
      setNotifications(nextNotifications)
    }

    load()
    const intervalId = window.setInterval(load, 60000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [fetchNotifications])

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

  if (location.pathname === '/login') return children

  const allowedLinks = NAV_LINKS.filter((link) => link.roles.includes(Number(user?.role_id)))
  const currentItem =
    allowedLinks.find(({ to }) => location.pathname.startsWith(to)) || allowedLinks[0]

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

    if (!nextOpen) {
      return
    }

    try {
      const latestNotifications = await fetchNotifications()
      const hasUnread = latestNotifications.some((notification) => !notification.is_read)

      if (!hasUnread) {
        return
      }

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

    return fallback || user?.name?.charAt(0)?.toUpperCase() || 'T'
  }

  const roleLabel = ROLE_LABELS[Number(user?.role_id)] || user?.role || 'User'
  const subtitle =
    currentItem?.subtitle ||
    'Track interns, tasks, attendance, and day-to-day work from one place.'

  return (
    <>
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
            {allowedLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sa-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="sa-nav-icon">{link.icon}</span>
                {!collapsed && <span>{link.label}</span>}
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
                <p className="sa-topbar-sub">{subtitle}</p>
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

                        const handleNotifClick = () => {
                          setNotifOpen(false)
                          if (notification.link) navigate(notification.link)
                        }

                        return (
                          <div
                            key={notification.id}
                            onClick={handleNotifClick}
                            style={{
                              padding: '10px 16px',
                              borderBottom: '1px solid #f9fafb',
                              background: notification.is_read ? '#fff' : '#eff6ff',
                              cursor: notification.link ? 'pointer' : 'default',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (notification.link) e.currentTarget.style.background = '#dbeafe' }}
                            onMouseLeave={e => { e.currentTarget.style.background = notification.is_read ? '#fff' : '#eff6ff' }}
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
                            {notification.link && (
                              <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2, fontWeight: 500 }}>
                                Tap to open →
                              </div>
                            )}
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
                <div className="sa-user-avatar">{renderAvatar('T')}</div>
                <div className="sa-user-info">
                  <span className="sa-user-name">{user?.name || user?.email || 'Team Member'}</span>
                  <span className="sa-user-role">{roleLabel}</span>
                </div>
                <FaChevronDown className={`sa-chevron ${dropdownOpen ? 'open' : ''}`} />
              </div>

              {dropdownOpen && (
                <div className="sa-dropdown">
                  <div className="sa-dropdown-header">
                    <div className="sa-dd-avatar">{renderAvatar('T')}</div>
                    <div>
                      <div className="sa-dd-name">{user?.name || 'Team Member'}</div>
                      <div className="sa-dd-email">{user?.email || 'team@company.com'}</div>
                      <span className="sa-dd-badge">{roleLabel}</span>
                    </div>
                  </div>
                  <hr className="sa-dd-divider" />
                  <button
                    type="button"
                    className="sa-dd-item"
                    onClick={() => {
                      setDropdownOpen(false)
                      setProfileOpen(true)
                    }}
                  >
                    <FaUserCircle /> My Profile
                  </button>
                  
                  {allowedLinks.slice(0, 3).map((link) => (
                    <button
                      key={link.to}
                      type="button"
                      className="sa-dd-item"
                      onClick={() => {
                        navigate(link.to)
                        setDropdownOpen(false)
                      }}
                    >
                      {link.icon} {link.label}
                    </button>
                  ))}
                  <hr className="sa-dd-divider" />
                  <button type="button" className="sa-dd-item sa-dd-logout" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="sa-content">{children}</main>
        </div>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

export default LayoutManager
