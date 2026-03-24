// import React, { useEffect, useRef, useState } from 'react'
// import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
// import { FaBars, FaTachometerAlt, FaUsers, FaUserPlus, FaGraduationCap, FaTimes } from 'react-icons/fa'
// import { useAuth } from '../../context/authcontext.jsx'
// import api from '../../api/login_api.js'
// import '../../style.css'

// const API_BASE = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, '') : 'http://localhost:7357';
// const getAvatarUrl = (url) => url ? `${API_BASE}${url}` : null;

// const NAV = [
//   { to: '/admin/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
//   { to: '/admin/users', icon: <FaUsers />, label: 'User Management' },
//   { to: '/admin/create-user', icon: <FaUserPlus />, label: 'Add User' },
//   // { to: '/admin/trainees',    icon: <FaGraduationCap />, label: 'Trainees'        },
// ]

// function AdminLayout() {
//   const navigate = useNavigate()
//   const location = useLocation()
//   const { user, logout } = useAuth()

//   const [collapsed, setCollapsed] = useState(false)  // desktop only
//   const [drawerOpen, setDrawerOpen] = useState(false)  // mobile only
//   const [isMobile, setIsMobile] = useState(false)
//   const drawerRef = useRef(null)

//   useEffect(() => {
//     document.body.classList.add('authenticated')
//     return () => document.body.classList.remove('authenticated')
//   }, [])

//   // Responsive breakpoint
//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth < 768)
//     check()
//     window.addEventListener('resize', check)
//     return () => window.removeEventListener('resize', check)
//   }, [])

//   // Close drawer on route change (mobile nav tap)
//   useEffect(() => { setDrawerOpen(false) }, [location.pathname])

//   // Close drawer when clicking backdrop
//   useEffect(() => {
//     if (!drawerOpen) return
//     const handler = (e) => {
//       if (drawerRef.current && !drawerRef.current.contains(e.target)) setDrawerOpen(false)
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [drawerOpen])

//   const handleLogout = async () => { await logout(); navigate('/login') }

//   /* shared nav list */
//   const NavItems = ({ showLabels }) => (
//     <nav className="nav">
//       {NAV.map(({ to, icon, label }) => (
//         <NavLink key={to} to={to}
//           className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
//           <span className="nav-icon">{icon}</span>
//           {showLabels && <span>{label}</span>}
//         </NavLink>
//       ))}
//     </nav>
//   )

//   return (
//     <div className={`app-shell ${!isMobile && collapsed ? 'sidebar-collapsed' : ''}`}>

//       {/* ── DESKTOP SIDEBAR ── */}
//       {!isMobile && (
//         <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
//           <div className="sidebar-top">
//             <button className="sidebar-hamburger" onClick={() => setCollapsed(c => !c)}>
//               <FaBars />
//             </button>
//             {!collapsed && (
//               <div className="brand-text">
//                 <span className="brand-name">TEAMCOMPUTERS</span>
//                 <span className="brand-subtitle">Admin Panel</span>
//               </div>
//             )}
//           </div>
//           <NavItems showLabels={!collapsed} />
//         </aside>
//       )}

//       {/* ── MOBILE BACKDROP ── */}
//       {isMobile && drawerOpen && (
//         <div
//           style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
//           onClick={() => setDrawerOpen(false)}
//         />
//       )}

//       {/* ── MOBILE DRAWER ── */}
//       {isMobile && (
//         <aside ref={drawerRef}
//           style={{
//             position: 'fixed', top: 0, left: 0, height: '100vh', width: 270, zIndex: 999,
//             background: 'linear-gradient(180deg,#0f4c75,#3282b8)',
//             transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
//             transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
//             display: 'flex', flexDirection: 'column', padding: '20px 14px',
//             boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
//           }}>

//           {/* Drawer top: brand + close */}
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
//             <div>
//               <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>TEAMCOMPUTERS</div>
//               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Admin Panel</div>
//             </div>
//             <button onClick={() => setDrawerOpen(false)}
//               style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
//               <FaTimes />
//             </button>
//           </div>

//           <NavItems showLabels={true} />

//           {/* User chip at bottom of drawer */}
//           <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
//             <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#00b1b4,#00d4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
//               {user?.profile_picture ? (
//                 <img src={getAvatarUrl(user.profile_picture)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//               ) : (
//                 user?.name?.charAt(0)?.toUpperCase() || 'A'
//               )}
//             </div>
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Admin'}</div>
//               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Administrator</div>
//             </div>
//             <button onClick={handleLogout}
//               style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', padding: '5px 10px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
//               Logout
//             </button>
//           </div>
//         </aside>
//       )}

//       {/* ── MAIN AREA ── */}
//       <div className="main-area">
//         <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//             {/* Hamburger — only on mobile */}
//             {isMobile && (
//               <button onClick={() => setDrawerOpen(true)}
//                 style={{
//                   display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
//                   width: 38, height: 38, padding: 7, background: 'rgba(0,177,180,0.08)',
//                   border: '1px solid #dde3f0', borderRadius: 10, cursor: 'pointer', flexShrink: 0
//                 }}>
//                 <span style={{ height: 2, background: '#003b5c', borderRadius: 2 }} />
//                 <span style={{ height: 2, background: '#003b5c', borderRadius: 2 }} />
//                 <span style={{ height: 2, background: '#003b5c', borderRadius: 2 }} />
//               </button>
//             )}
//             <div>
//               <h1 className="page-title">Intern Management</h1>
//               {!isMobile && <p className="page-subtitle" style={{ margin: 0 }}>Track interns, managers, and training progress.</p>}
//             </div>
//           </div>

//           <div className="topbar-right">
//             {!isMobile && (
//               <div className="user-pill">
//                 <div className="user-avatar" style={{ overflow: 'hidden' }}>
//                   {user?.profile_picture ? (
//                     <img src={getAvatarUrl(user.profile_picture)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                   ) : (
//                     user?.name?.charAt(0)?.toUpperCase() || 'A'
//                   )}
//                 </div>
//                 <div className="user-pill-text">
//                   <div className="user-name">{user?.name || 'Admin'}</div>
//                   <div className="user-role">Administrator</div>
//                 </div>
//               </div>
//             )}
//             <button className="btn-secondary logout-btn" onClick={handleLogout}
//               style={{ padding: isMobile ? '7px 12px' : '9px 18px', fontSize: isMobile ? 12 : 13 }}>
//               Logout
//             </button>
//           </div>
//         </header>

//         <main className="content">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }

// export default AdminLayout



// ════════════════════════════════════════════════════════════════
// src/pages/Admin/Layout.jsx  — REPLACE your current file
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authcontext.jsx";
import Sidebar from "../../components/Sidebar.jsx";
import api from "../../api/login_api.js";
import "../../style.css";

const API_BASE = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, "")
  : "http://localhost:7357";
const getAvatarUrl = (url) => (url ? `${API_BASE}${url}` : null);

function AdminLayout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, logout } = useAuth();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("authenticated");
    return () => document.body.classList.remove("authenticated");
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>

      {/* ── SHARED SIDEBAR (roleId=1 = Admin) ── */}
      <Sidebar
        roleId={1}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
      />

      {/* ── MAIN AREA ── */}
      <div className="main-area">

        <header className="topbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>

          {/* ☰ Hamburger — shown only on mobile via CSS */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>

          <div className="topbar-left">
            <h1 className="page-title">Intern Management</h1>
            <p className="page-subtitle">
              Track interns, managers, and training progress.
            </p>
          </div>

          <div className="topbar-right">
            <div className="user-pill">
              <div className="user-avatar" style={{ overflow: "hidden" }}>
                {user?.profile_picture ? (
                  <img
                    src={getAvatarUrl(user.profile_picture)}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "A"
                )}
              </div>
              <div className="user-pill-text">
                <div className="user-name">{user?.name || "Admin"}</div>
                <div className="user-role">Administrator</div>
              </div>
            </div>
            <button className="btn-secondary logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;