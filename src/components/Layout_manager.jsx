import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars, FaBell, FaCalendarAlt, FaChevronDown, FaClipboardList,
  FaProjectDiagram, FaSignOutAlt, FaTachometerAlt, FaTasks,
  FaUserCircle, FaUserPlus,
} from 'react-icons/fa'
import { useAuth } from '../context/authcontext.jsx'
import ProfileDrawer from '../pages/profiledrawer.jsx'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/api'
import api from '../api/login_api.js'
import '../pages/SuperAdmin/superadmin.css'

const API_BASE = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, '')
  : 'http://localhost:7357'

const MOBILE_BREAKPOINT = 900
const getAvatarUrl = (url) => (url ? `${API_BASE}${url}` : null)

const getFileTarget = (notification) => {
  const payload = notification?.data || notification?.payload || {}
  const fileCandidate =
    notification?.file_url || notification?.document_url || notification?.url ||
    notification?.link_url || payload?.file_url || payload?.document_url ||
    payload?.filePath || payload?.file_path || payload?.document_path || payload?.path || null
  if (typeof fileCandidate === 'string' && fileCandidate.trim()) {
    return /^https?:\/\//i.test(fileCandidate)
      ? fileCandidate
      : `${API_BASE}${fileCandidate.startsWith('/') ? '' : '/'}${fileCandidate}`
  }
  return notification?.route || notification?.link || payload?.route || payload?.link || payload?.url || null
}

// FIX 2: Smart route resolver — leave notifications go to /my-leaves
const resolveNotifRoute = (notification, roleId) => {
  const target = getFileTarget(notification)
  if (target) return target

  const text = `${notification?.title || ''} ${notification?.message || ''}`.toLowerCase()
  if (text.includes('leave'))      return Number(roleId) === 2 ? '/manager' : '/my-leaves'
  if (text.includes('document'))   return Number(roleId) === 1 ? '/admin/documents' : '/notifications'
  if (text.includes('profile'))    return Number(roleId) === 1 ? '/admin/profiles' : '/notifications'
  if (text.includes('task'))       return Number(roleId) === 2 ? '/manager' : '/my-tasks'
  if (text.includes('attendance')) return '/attendance'
  return '/notifications'
}

const ROLE_LABELS = { 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern' }

const NAV_LINKS = [
  { to: '/dashboard',           label: 'Dashboard',       subtitle: 'View your role-specific dashboard and summary.',            icon: <FaTachometerAlt />, roles: [1, 2, 3, 4] },
  { to: '/notifications',       label: 'Notifications',   subtitle: 'View all system notifications and alerts.',                 icon: <FaBell />,          roles: [1, 2, 3, 4] },
  { to: '/attendance',          label: 'Attendance',      subtitle: 'Review daily attendance and leave information.',            icon: <FaClipboardList />, roles: [1, 2, 3, 4] },
  { to: '/my-tasks',            label: 'My Tasks',        subtitle: 'Track assigned tasks and current delivery work.',           icon: <FaTasks />,         roles: [4] },
  { to: '/my-leaves',           label: 'My Leaves',       subtitle: 'Manage leave history and pending leave requests.',          icon: <FaCalendarAlt />,   roles: [4] },
  { to: '/leaves/approval',     label: 'Leave Approvals', subtitle: 'Review and approve intern leave requests.',                 icon: <FaCalendarAlt />,   roles: [2] },
  { to: '/calendar',            label: 'Calendar',        subtitle: 'Check schedules, leaves, and important upcoming dates.',    icon: <FaCalendarAlt />,   roles: [1, 2, 3, 4] },
  { to: '/daily-report',        label: 'Daily Report',    subtitle: 'Submit your end-of-day work report to your manager.',       icon: <FaClipboardList />, roles: [4] },
  { to: '/manager/daily-reports', label: 'Daily Reports', subtitle: 'View and acknowledge intern daily reports.',                icon: <FaClipboardList />, roles: [2] },
  { to: '/project-progress',    label: 'Project Progress',subtitle: 'Monitor project health and delivery progress.',             icon: <FaProjectDiagram />,roles: [1, 2] },
  { to: '/user-form',           label: 'User Form',       subtitle: 'Create and manage trainee onboarding records.',             icon: <FaUserPlus />,      roles: [1] },
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
  const [bellRinging, setBellRinging] = useState(false)   // FIX 11
  const dropdownRef = useRef(null)
  const contentRef  = useRef(null)                         // FIX 15
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications()
      const next = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data : []
      setNotifications(next)
      return next
    } catch { return [] }
  }, [])

  useEffect(() => {
    document.body.classList.add('authenticated')
    return () => document.body.classList.remove('authenticated')
  }, [])

  // FIX 15: smooth page transition on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
    setDropdownOpen(false)
    setNotifOpen(false)
    if (contentRef.current) {
      contentRef.current.style.opacity = '0'
      contentRef.current.style.transform = 'translateY(10px)'
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1)'
          contentRef.current.style.opacity = '1'
          contentRef.current.style.transform = 'translateY(0)'
        }
      })
    }
  }, [location.pathname])

  // FIX 10: auto-refresh notifications every 30s
  useEffect(() => {
    let alive = true
    const load = async () => { const n = await fetchNotifications(); if (alive) setNotifications(n) }
    load()
    const id = window.setInterval(load, 30000)
    return () => { alive = false; window.clearInterval(id) }
  }, [fetchNotifications])

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false); setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (location.pathname === '/login') return children

  const allowedLinks = NAV_LINKS.filter((l) => l.roles.includes(Number(user?.role_id)))
  const currentItem  = allowedLinks.find(({ to }) => location.pathname.startsWith(to)) || allowedLinks[0]

  const toggleSidebar = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) { setMobileSidebarOpen((o) => !o); return }
    setCollapsed((v) => !v)
  }

  const handleLogout = async () => {
    setDropdownOpen(false); setNotifOpen(false)
    await logout(); navigate('/login')
  }

  // FIX 11: bell click triggers ring animation
  const handleBellClick = async () => {
    setBellRinging(true)
    setTimeout(() => setBellRinging(false), 600)
    const nextOpen = !notifOpen
    setNotifOpen(nextOpen); setDropdownOpen(false)
    if (!nextOpen) return
    try {
      const latest = await fetchNotifications()
      if (!latest.some((n) => !n.is_read)) return
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch { /* non-blocking */ }
  }

  // FIX 2: notification click with smart routing
  const handleNotifClick = async (notif) => {
    setNotifOpen(false)
    try { await markNotificationRead(notif.id) } catch { /* non-blocking */ }
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n))
    const route = resolveNotifRoute(notif, user?.role_id)
    if (/^https?:\/\//i.test(route)) {
      window.open(route, '_blank', 'noopener,noreferrer')
    } else {
      navigate(route)
    }
  }

  const renderAvatar = (fallback) => {
    if (user?.profile_picture) {
      return <img src={getAvatarUrl(user.profile_picture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    }
    return fallback || user?.name?.charAt(0)?.toUpperCase() || 'T'
  }

  const roleLabel = ROLE_LABELS[Number(user?.role_id)] || user?.role || 'User'
  const subtitle = currentItem?.subtitle || 'Track interns, tasks, attendance, and day-to-day work from one place.'

  return (
    <>
      <style>{`
        @keyframes bellRing {
          0%  { transform: rotate(0deg);   }  15% { transform: rotate(20deg);  }
          30% { transform: rotate(-18deg); }  45% { transform: rotate(14deg);  }
          60% { transform: rotate(-10deg); }  75% { transform: rotate(6deg);   }
          90% { transform: rotate(-3deg);  } 100% { transform: rotate(0deg);   }
        }
        @keyframes notifSlideIn {
          from { opacity:0; transform: translateY(-6px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }
        .notif-panel-enter { animation: notifSlideIn 0.2s cubic-bezier(0.22,1,0.36,1) both; }
        .sa-nav-link { transition: background 0.18s ease, color 0.18s ease !important; }
      `}</style>

      <div className={`sa-shell has-mobile-sidebar ${collapsed ? 'sa-collapsed' : ''}`}>
        {mobileSidebarOpen && (
          <button type="button" className="sa-mobile-backdrop" aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)} />
        )}

        <aside className={`sa-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sa-sidebar-top">
            <button type="button" className="sa-hamburger" onClick={toggleSidebar}><FaBars /></button>
            {!collapsed && <span className="sa-sidebar-title">TEAMCOMPUTERS</span>}
          </div>

          <nav className="sa-nav">
            {allowedLinks.map((link) => (
              <NavLink key={link.to} to={link.to}
                className={({ isActive }) => `sa-nav-link ${isActive ? 'active' : ''}`}>
                <span className="sa-nav-icon">{link.icon}</span>
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            ))}
          </nav>

          <button type="button" className="sa-nav-link sa-logout-link" onClick={handleLogout}>
            <span className="sa-nav-icon"><FaSignOutAlt /></span>
            {!collapsed && <span>Logout</span>}
          </button>
        </aside>

        <div className="sa-main">
          <header className="sa-topbar">
            <div className="sa-topbar-left">
              <button type="button" className="sa-mobile-toggle" aria-label="Open sidebar"
                onClick={() => setMobileSidebarOpen(true)}><FaBars /></button>
              <div>
                <h1 className="sa-topbar-title">Intern Management System</h1>
                <p className="sa-topbar-sub">{subtitle}</p>
              </div>
            </div>

            <div className="sa-topbar-right" ref={dropdownRef}>
              {/* FIX 11: animated bell button */}
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={handleBellClick} title="Notifications"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    position: 'relative', padding: 6,
                    transformOrigin: 'top center',
                    animation: bellRinging ? 'bellRing 0.6s ease' : 'none',
                  }}>
                  <FaBell size={20} color={notifOpen ? '#00b1b4' : '#374151'} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0,
                      background: '#ef4444', color: '#fff', borderRadius: '50%',
                      fontSize: 10, width: 16, height: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* FIX 2: notification dropdown */}
                {notifOpen && (
                  <div className="notif-panel-enter" style={{
                    position: 'absolute', right: 0, top: 38, width: 340,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.14)', zIndex: 9999,
                    maxHeight: 420, overflowY: 'auto',
                  }}>
                    <div style={{
                      padding: '12px 16px', fontWeight: 700, borderBottom: '1px solid #f3f4f6',
                      fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 11, padding: '1px 8px', fontWeight: 700 }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p style={{ padding: 20, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notif) => {
                        const createdAt = notif.createdAt || notif.created_at
                        const timestamp = createdAt ? new Date(createdAt).toLocaleString() : 'Unknown time'
                        return (
                          <div key={notif.id} onClick={() => handleNotifClick(notif)}
                            style={{
                              padding: '11px 16px', borderBottom: '1px solid #f9fafb',
                              background: notif.is_read ? '#fff' : '#eff6ff',
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
                            onMouseLeave={e => { e.currentTarget.style.background = notif.is_read ? '#fff' : '#eff6ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{notif.title}</div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{notif.message}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{timestamp}</div>
                                <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 3, fontWeight: 500 }}>Tap to open →</div>
                              </div>
                              {!notif.is_read && (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="sa-user-btn" onClick={() => { setNotifOpen(false); setDropdownOpen((o) => !o) }}>
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
                  <button type="button" className="sa-dd-item" onClick={() => { setDropdownOpen(false); setProfileOpen(true) }}>
                    <FaUserCircle /> My Profile
                  </button>
                  {allowedLinks.slice(0, 3).map((link) => (
                    <button key={link.to} type="button" className="sa-dd-item"
                      onClick={() => { navigate(link.to); setDropdownOpen(false) }}>
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

          {/* FIX 15: animated content wrapper */}
          <main className="sa-content">
            <div ref={contentRef}>{children}</div>
          </main>
        </div>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

export default LayoutManager
