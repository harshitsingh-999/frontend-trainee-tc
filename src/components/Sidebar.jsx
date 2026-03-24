// ════════════════════════════════════════════════════════
// src/components/Sidebar.jsx  — REPLACE your current file
// ════════════════════════════════════════════════════════
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt, FaUsers, FaUserPlus, FaCalendarAlt,
  FaClipboardList, FaClipboardCheck, FaChartLine,
  FaUserShield, FaUserTie, FaUserGraduate, FaCog, FaTimes
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────
// MENU ITEMS PER ROLE
// role_id: 1=Admin  2=Manager  3=Buddy  4=Intern  5=SuperAdmin
// ─────────────────────────────────────────────────────────
const MENUS = {
  4: [ // Intern
    { to: "/dashboard",   icon: <FaTachometerAlt />, label: "Dashboard"   },
    { to: "/my-tasks",    icon: <FaClipboardList />, label: "My Tasks"    },
    { to: "/attendance",  icon: <FaClipboardCheck />,label: "Attendance"  },
    { to: "/my-leaves",   icon: <FaCalendarAlt />,   label: "My Leaves"   },
    { to: "/calendar",    icon: <FaCalendarAlt />,   label: "Calendar"    },
  ],
  2: [ // Manager
    { to: "/dashboard",        icon: <FaTachometerAlt />, label: "Dashboard"        },
    { to: "/manager",          icon: <FaUsers />,         label: "My Team"          },
    { to: "/attendance",       icon: <FaClipboardCheck />,label: "Attendance"       },
    { to: "/project-progress", icon: <FaChartLine />,     label: "Project Progress" },
    { to: "/calendar",         icon: <FaCalendarAlt />,   label: "Calendar"         },
  ],
  3: [ // Buddy
    { to: "/dashboard",  icon: <FaTachometerAlt />, label: "Dashboard"  },
    { to: "/manager",    icon: <FaUsers />,         label: "Team"       },
    { to: "/attendance", icon: <FaClipboardCheck />,label: "Attendance" },
    { to: "/calendar",   icon: <FaCalendarAlt />,   label: "Calendar"   },
  ],
  1: [ // Admin
    { to: "/admin/dashboard",   icon: <FaTachometerAlt />, label: "Dashboard"       },
    { to: "/admin/users",       icon: <FaUsers />,         label: "User Management" },
    { to: "/admin/create-user", icon: <FaUserPlus />,      label: "Add User"        },
  ],
  5: [ // SuperAdmin
    { to: "/superadmin",          icon: <FaTachometerAlt />, label: "Dashboard"         },
    { to: "/superadmin/admins",   icon: <FaUserShield />,    label: "Admin Management"  },
    { to: "/superadmin/managers", icon: <FaUserTie />,       label: "Manager Control"   },
    { to: "/superadmin/interns",  icon: <FaUserGraduate />,  label: "Intern Management" },
    { to: "/superadmin/settings", icon: <FaCog />,           label: "System Settings"   },
  ],
};

const ROLE_NAMES = {
  1: "Admin Panel",
  2: "Manager Panel",
  3: "Buddy Panel",
  4: "Intern Panel",
  5: "Super Admin",
};

// ─────────────────────────────────────────────────────────
// SIDEBAR COMPONENT
// Props:
//   roleId     - number  (which role's menu to show)
//   collapsed  - boolean (desktop: icon-only mode)
//   onToggle   - fn      (toggle collapsed)
//   mobileOpen - boolean (mobile: drawer open?)
//   onClose    - fn      (close mobile drawer)
//   user       - object  { name, role }
// ─────────────────────────────────────────────────────────
export default function Sidebar({ roleId, collapsed, onToggle, mobileOpen, onClose, user }) {
  const navigate = useNavigate();
  const menu     = MENUS[roleId] || MENUS[4];
  const roleName = ROLE_NAMES[roleId] || "Dashboard";

  return (
    <>
      {/* Dark backdrop — mobile only */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      <aside
        className={[
          "sidebar",
          collapsed  ? "collapsed"    : "",
          mobileOpen ? "sidebar-open" : "",
        ].filter(Boolean).join(" ")}
      >
        {/* ── TOP: brand + toggle ── */}
        <div className="sidebar-top">
          <button className="sidebar-hamburger" onClick={onToggle} title="Toggle menu">
            ☰
          </button>

          {!collapsed && (
            <div
              className="brand-text"
              onClick={() => navigate("/dashboard")}
              style={{ cursor: "pointer" }}
            >
              <span className="brand-name">TEAMCOMPUTERS</span>
              <span className="brand-subtitle">{roleName}</span>
            </div>
          )}

          {/* X close — only visible on mobile via CSS */}
          <button className="sidebar-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* ── NAV LINKS ── */}
        <nav className="nav">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
              onClick={onClose}
              title={collapsed ? item.label : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ── USER CHIP (pinned bottom) ── */}
        <div className="sidebar-user-chip">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || "User"}</div>
              <div className="sidebar-user-role">{user?.role || roleName}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
