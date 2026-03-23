// ════════════════════════════════════════════════════════════════
// src/components/Layout_manager.jsx  — REPLACE your current file
// Used by: Intern, Manager, Buddy roles
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext.jsx";
import Sidebar from "./Sidebar.jsx";
import ProfileDrawer from "../pages/profiledrawer.jsx";
import api from "../api/login_api.js";

const API_BASE = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, "")
  : "http://localhost:7357";
const getAvatarUrl = (url) => (url ? `${API_BASE}${url}` : null);

function LayoutManager({ children }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();

  const [collapsed,    setCollapsed]    = useState(false);  // desktop collapse
  const [mobileOpen,   setMobileOpen]   = useState(false);  // mobile drawer
  const [profileOpen,  setProfileOpen]  = useState(false);

  // Close mobile drawer whenever route changes
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (location.pathname === "/login") return children;

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>

      {/* ── SHARED SIDEBAR ── */}
      <Sidebar
        roleId={user?.role_id}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
      />

      {/* ── MAIN AREA ── */}
      <div className="main-area">

        <header className="topbar">
          {/* ☰ Hamburger — shown only on mobile via CSS */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>

          <div className="topbar-left">
            <h1 className="page-title">Intern Management System</h1>
            <p className="page-subtitle">
              Track interns, buddies, and managers in one place.
            </p>
          </div>

          <div className="topbar-right">
            {user ? (
              <>
                <div
                  className="user-pill"
                  onClick={() => setProfileOpen(true)}
                  style={{ cursor: "pointer" }}
                  title="View / edit your profile"
                >
                  <div className="user-avatar" style={{ overflow: "hidden" }}>
                    {user?.profile_picture ? (
                      <img
                        src={getAvatarUrl(user.profile_picture)}
                        alt="Avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <span>{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div className="user-pill-text">
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">{user.role}</div>
                  </div>
                </div>
                <button className="btn-secondary logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn-secondary" onClick={() => navigate("/login")}>
                Login
              </button>
            )}
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default LayoutManager;


// import React, { useState, useEffect, useRef } from 'react'
// import { NavLink, useLocation, useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/authcontext.jsx'
// import ProfileDrawer from '../pages/profiledrawer.jsx'
// import api from '../api/login_api.js'
// import { Link } from "react-router-dom";

// const API_BASE = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, '') : 'http://localhost:7357';
// const getAvatarUrl = (url) => url ? `${API_BASE}${url}` : null;

// function Layout({ children }) {
//   const { user, logout } = useAuth()
//   const location = useLocation()
//   const navigate = useNavigate()
//   const [profileOpen, setProfileOpen] = useState(false)
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const sidebarRef = useRef()

//   const handleLogout = async () => {
//     await logout()
//     navigate('/login')
//   }

//   // Close sidebar when route changes (user tapped a nav link on mobile)
//   useEffect(() => {
//     setSidebarOpen(false)
//   }, [location.pathname])

//   // Close sidebar on backdrop click
//   useEffect(() => {
//     if (!sidebarOpen) return
//     const handler = (e) => {
//       if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
//         setSidebarOpen(false)
//       }
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [sidebarOpen])

//   if (location.pathname === '/login') return children

//   const navLinks = [

//     { to: '/dashboard', label: '  Dashboard', roles: [1, 2, 3, 4] },
//     { to: '/attendance', label: '  Attendance', roles: [1, 2, 3, 4] },
//     { to: '/my-tasks', label: '  My Tasks', roles: [4] },
//     { to: '/my-leaves', label: '  My Leaves', roles: [4] },
//     { to: '/calendar', label: '  Calendar', roles: [1, 2, 3, 4] },
//     { to: '/manager', label: '  Manager', roles: [1, 2] },
//     { to: '/project-progress', label: '  Project Progress', roles: [1, 2] },
//     { to: '/user-form', label: '  User Form', roles: [1] },
//   ].filter(link => link.roles.includes(user?.role_id))

//   return (
//     <div className="app-shell">

//       {/* Dark backdrop when sidebar is open on mobile */}
//       {sidebarOpen && (
//         <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
//       )}

//       {/* ── SIDEBAR ── */}
//       <aside ref={sidebarRef} className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>

//         {/* ✕ close button — only visible on mobile */}
//         <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>

//         <div className="brand" onClick={() => navigate('/dashboard')}>
//           <div className="brand-mark">t:</div>
//           <div className="brand-text">
//             <span className="brand-name">teamComputers</span>
//             <span className="brand-subtitle">Intern Management</span>
//           </div>
//         </div>

//         <nav className="nav">
//           {navLinks.map(link => (
//             <NavLink
//               key={link.to}
//               to={link.to}
//               className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}
//             >
//               {link.label}
//             </NavLink>
//           ))}
//         </nav>


//         {/* User chip pinned to bottom of sidebar — helpful on mobile */}
//         <div className="sidebar-user-chip">
//           <div style={{ width: 32, height: 32, fontSize: 14, overflow: 'hidden', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
//             {user?.profile_picture ? (
//               <img src={getAvatarUrl(user.profile_picture)} alt="Avatar" style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
//             ) : null}
//             <span style={{ display: user?.profile_picture ? 'none' : 'flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{user?.name?.charAt(0)?.toUpperCase() || 'T'}</span>
//           </div>
//           <div>
//             <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
//             <div style={{ fontSize: 11, opacity: 0.7, color: '#fff' }}>{user?.role}</div>
//           </div>
//         </div>
//       </aside>

//       {/* ── MAIN AREA ── */}
//       <div className="main-area">
//         <header className="topbar">

//           {/* ☰ Hamburger — hidden on desktop, visible on mobile */}
//           <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
//             <span /><span /><span />
//           </button>

//           <div className="topbar-left">
//             <h1 className="page-title">Intern Management System</h1>
//             <p className="page-subtitle">Track interns, buddies, and managers in one place.</p>
//           </div>

//           <div className="topbar-right">
//             {user ? (
//               <>
//                 <div
//                   className="user-pill"
//                   onClick={() => setProfileOpen(true)}
//                   style={{ cursor: 'pointer' }}
//                   title="View / edit your profile"
//                 >
//                   <div className="user-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
//                     {user?.profile_picture ? (
//                       <img
//                         src={getAvatarUrl(user.profile_picture)}
//                         alt="Avatar"
//                         width={30}
//                         height={30}
//                         style={{ objectFit: 'cover', display: 'block' }}
//                         onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
//                       />
//                     ) : null}
//                     <span style={{ display: user?.profile_picture ? 'none' : 'flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
//                       {user.name?.charAt(0)?.toUpperCase() || 'T'}
//                     </span>
//                   </div>
//                   <div className="user-pill-text">
//                     <div className="user-name">{user.name}</div>
//                     <div className="user-role">
//                       {user.role}
//                       {user.role_id === 4 && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 3 }}>✎</span>}
//                     </div>
//                   </div>
//                 </div>
//                 <button className="btn-secondary logout-btn" onClick={handleLogout}>Logout</button>
//               </>
//             ) : (
//               <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
//             )}
//           </div>
//         </header>

//         <main className="content">{children}</main>
//       </div>

//       <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
//     </div>
//   )
// }

// export default Layout




