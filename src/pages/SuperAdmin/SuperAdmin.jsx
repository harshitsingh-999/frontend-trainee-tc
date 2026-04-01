import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBars, FaTachometerAlt, FaUserTie, FaUserGraduate,
  FaUserShield, FaToggleOn, FaCog, FaSignOutAlt, FaChevronDown,
  FaKey, FaClipboardList, FaBuilding, FaTimes, FaEdit, FaTrash,
  FaBell, FaBan, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaChartPie, FaUsers
} from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { getNotifications, markAllNotificationsRead } from "../../api/api.js";
import "./superadmin.css";
import { useAuth } from '../../context/authcontext.jsx'

/* ── Role IDs ── */
// 1=Admin, 2=Manager, 3=Buddy/Trainee, 4=Intern, 5=SuperAdmin
const ROLE = { SUPERADMIN: 5, ADMIN: 1, MANAGER: 2, BUDDY: 3, INTERN: 4 };
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  : import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "")
    : "http://localhost:7357";

/* ── Modal ── */
function Modal({ title, onClose, children }) {
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-head">
          <h3>{title}</h3>
          <button className="sa-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="sa-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ── Confirm ── */
function Confirm({ msg, onYes, onNo }) {
  return (
    <div className="sa-modal-overlay">
      <div className="sa-modal" style={{ maxWidth: 380 }}>
        <div className="sa-modal-head"><h3>Confirm</h3></div>
        <div className="sa-modal-body">
          <p style={{ marginBottom: 20, color: "#374151" }}>{msg}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="sa-btn-outline" onClick={onNo}>Cancel</button>
            <button className="sa-btn-danger-solid" onClick={onYes}>Yes, Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
function SuperAdmin() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false); // FIX 11
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  /* real data from API */
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [systemSettings, setSystemSettings] = useState([]);
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);   // ← moved inside component

  /* modal / confirm / toast */
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { user, session, logout } = useAuth();

  useEffect(() => {
    const h = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifs = async () => {
      try {
        const res = await getNotifications();
        const nextNotifications = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];

        if (isMounted) {
          setNotifications(nextNotifications);
        }
      } catch {
        // Keep the layout usable even if notifications fail to load.
      }
    };

    fetchNotifs();
    const intervalId = window.setInterval(fetchNotifs, 30000); // FIX 10: refresh every 30s

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  /* ── FETCH ALL USERS ── */
  const normalizeUsersPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };

  const normalizeUser = (u) => ({
    ...u,
    role_id: Number(u?.role_id),
    is_active: u?.is_active ?? u?.isActive ?? u?.active
  });

  const serializeSettings = useCallback((settings = []) => (
    settings
      .map((item) => ({
        id: item?.id ?? null,
        key: item?.key || "",
        value: item?.value?.toString?.() ?? "",
        category: item?.category || "general",
        description: item?.description || ""
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  ), []);

  const normalizeRoleName = (val) =>
    (val || "").toString().toLowerCase().replace(/[\s_-]/g, "");

  const getRoleKey = (u) => {
    const roleName = normalizeRoleName(u?.role_name || u?.role || u?.roleName);
    if (roleName.includes("superadmin")) return "superadmin";
    if (roleName.includes("admin")) return "admin";
    if (roleName.includes("manager")) return "manager";
    if (roleName.includes("buddy")) return "buddy";
    // "trainee" and "intern" both map to intern
    if (roleName.includes("trainee") || roleName.includes("intern")) return "intern";

    const roleId = Number(u?.role_id);
    if (roleId === ROLE.SUPERADMIN) return "superadmin";
    if (roleId === ROLE.ADMIN) return "admin";
    if (roleId === ROLE.MANAGER) return "manager";
    if (roleId === ROLE.BUDDY) return "buddy";
    if (roleId === ROLE.INTERN) return "intern";
    return "other";
  };

  const fetchAllUsers = useCallback(async () => {
    setLoading(true); setApiError("");
    try {
      const res = await axiosClient.get("/admin/users", {
        params: { page: 1, limit: 200, _ts: Date.now() }
      });
      const payload = res?.data || {};
      const data = normalizeUsersPayload(payload).map(normalizeUser);
      setAllUsers(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        try {
          const res = await axiosClient.get("/users", {
            params: { page: 1, limit: 200, _ts: Date.now() }
          });
          const payload = res?.data || {};
          const data = normalizeUsersPayload(payload).map(normalizeUser);
          setAllUsers(data);
          setApiError("");
          return;
        } catch (fallbackErr) {
          setApiError(
            fallbackErr.response?.data?.message ||
            err.response?.data?.message ||
            "Failed to load users"
          );
          return;
        }
      }
      setApiError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await axiosClient.get("/superadmin/settings");
      const s = res?.data?.data || [];
      setSystemSettings(s);
      setSavedSettingsSnapshot(serializeSettings(s));
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setSettingsLoading(false);
    }
  }, [serializeSettings]);

  useEffect(() => {
    fetchAllUsers();
    fetchSettings();
    // Load real departments from DB for dropdowns
    axiosClient.get("/superadmin/departments")
  .then(res => {
    // handles both { success, data: [...] } and plain array responses
    const raw = res?.data;
    const depts = Array.isArray(raw) ? raw
      : Array.isArray(raw?.data) ? raw.data
      : [];
    setDepartments(depts.length > 0 ? depts.map(d => d.dept_name) : ["IT", "HR", "Sales", "Ops", "Finance"]);
  })
  .catch(() => setDepartments(["IT", "HR", "Sales", "Ops", "Finance"]));
  }, [fetchAllUsers, fetchSettings]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setNotifOpen(false);
    await logout();
    navigate('/login');
  };

  // FIX 11: bell animation + open panel
  const handleNotificationsToggle = async () => {
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 600);

    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    setDropdownOpen(false);

    if (!nextOpen || unreadCount === 0) return;

    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* non-blocking */ }
  };

  // FIX 4: notifications now route to the correct SuperAdmin page
  const handleNotificationClick = (notification) => {
    setNotifOpen(false);

    const payload = notification?.data || notification?.payload || {};
    const fileCandidate =
      notification?.file_url || notification?.document_url || notification?.url ||
      notification?.link_url || payload?.file_url || payload?.document_url ||
      payload?.filePath || payload?.file_path || payload?.document_path || payload?.path || null;

    if (typeof fileCandidate === "string" && fileCandidate.trim()) {
      const url = /^https?:\/\//i.test(fileCandidate)
        ? fileCandidate
        : `${API_BASE}${fileCandidate.startsWith("/") ? "" : "/"}${fileCandidate}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const candidateRoute = notification?.route || notification?.link ||
      payload?.route || payload?.link || payload?.url || null;

    if (typeof candidateRoute === "string" && candidateRoute.trim()) {
      /^https?:\/\//i.test(candidateRoute)
        ? window.open(candidateRoute, "_blank", "noopener,noreferrer")
        : navigate(candidateRoute);
      return;
    }

    // Smart routing based on notification content
    const text = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
    if (text.includes("intern") || text.includes("trainee")) setActivePage("interns");
    else if (text.includes("manager"))                        setActivePage("managers");
    else if (text.includes("admin"))                          setActivePage("admins");
    else if (text.includes("setting"))                        setActivePage("settings");
    else if (text.includes("document") || text.includes("profile")) setActivePage("admins");
    else                                                      setActivePage("dashboard");
  };

  /* ── FILTERED LISTS ── */
  const admins = allUsers.filter(u => getRoleKey(u) === "admin");
  const managers = allUsers.filter(u => getRoleKey(u) === "manager");
  const interns = allUsers.filter(u => {
    const key = getRoleKey(u);
    return key === "intern" || key === "buddy";
  });
  const normalizedSettings = serializeSettings(systemSettings);
  const hasUnsavedSettingsChanges =
    JSON.stringify(normalizedSettings) !== JSON.stringify(savedSettingsSnapshot);

  /* ── NAV ── */
  const navItems = [
    { key: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    { key: "admins", icon: <FaUserShield />, label: "Admin Management" },
    { key: "managers", icon: <FaUserTie />, label: "Manager Control" },
    { key: "interns", icon: <FaUserGraduate />, label: "Intern Management" },
    { key: "settings", icon: <FaCog />, label: "System Settings" },
  ];

  /* ── TOAST HELPER ── */
  const showToast = (msg, type = "success") => {
    if (type === "error") toast.error(msg);
    else toast.success(msg || "Success");
  };

  /* ── CONFIRM HELPER ── */
  const doConfirm = (msg, fn) => setConfirm({ msg, onYes: () => { fn(); setConfirm(null); } });

  /* ── FORM FIELD ── */
  const field = (label, key, type = "text", options = null) => (
    <div className="sa-form-group" key={key}>
      <label>{label}</label>
      {options ? (
        <select value={formData[key] || ""} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}>
          <option value="">-- Select {label} --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={formData[key] || ""} placeholder={label}
          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} />
      )}
    </div>
  );

  const passwordField = (label = "Password", key = "password") => (
    <div className="sa-form-group" key={key}>
      <label>{label}</label>
      <input
        type="password"
        name={key}
        value={formData[key] ?? ""}
        placeholder={label}
        autoComplete="new-password"
        spellCheck={false}
        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  /* ── OPEN MODALS ── */
  const openAdd = (type) => { setFormData({}); setEditTarget(null); setModal("add" + type); };
  const openEdit = (type, item) => { setFormData({ ...item, name: item.name || item.full_name || "" }); setEditTarget(item.id); setModal("edit" + type); };

  /* ── API SAVE ── */
  const saveUser = async (roleId) => {
    if (!formData.name || !formData.email) return showToast("Name and email are required", "error");
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role_id: roleId,
        department: formData.dept || formData.department || "",
        internship_start_date: formData.internship_start_date || "",
        internship_end_date: formData.internship_end_date || "",
        is_active: 1,
      };
      if (Object.prototype.hasOwnProperty.call(formData, "password")) {
        payload.password = formData.password ?? "";
      }
      if (editTarget) {
        await axiosClient.put(`/admin/users/${editTarget}`, payload);
        showToast("User updated successfully");
      } else {
        if (!formData.password) { setSaving(false); return showToast("Password is required", "error"); }
        await axiosClient.post("/admin/users", payload);
        showToast("User created successfully");
      }
      await fetchAllUsers();
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Error saving user", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── TOGGLE ACTIVE ── */
  const toggleStatus = async (u) => {
    try {
      await axiosClient.put(`/admin/users/${u.id}`, { is_active: u.is_active ? 0 : 1 });
      await fetchAllUsers();
      showToast(`User ${u.is_active ? "deactivated" : "activated"}`);
    } catch { showToast("Failed to update status", "error"); }
  };

  /* ── REMOVE USER — FIX 5 & 9 ── */
  const removeUser = async (u) => {
    const name = u.name || u.full_name || "User";
    try {
      await axiosClient.delete(`/admin/users/${u.id}`);
      setAllUsers(prev => prev.filter(x => x.id !== u.id));
      showToast(`${name} removed successfully`);
    } catch (err) {
      // Fallback: soft-deactivate if FK constraint prevents hard delete
      try {
        await axiosClient.put(`/admin/users/${u.id}`, { is_active: 0 });
        setAllUsers(prev => prev.filter(x => x.id !== u.id));
        showToast(`${name} deactivated and hidden`);
      } catch {
        showToast(`Failed to remove ${name}`, "error");
        return;
      }
    }
    // Always re-sync from server so admin panel also stays current
    setTimeout(() => fetchAllUsers(), 600);
  };

  /* ── BADGE ── */
  const Badge = ({ text }) => {
    const map = { 1: "sa-badge-green", 0: "sa-badge-red", Active: "sa-badge-green", Inactive: "sa-badge-red", true: "sa-badge-green", false: "sa-badge-red" };
    const labels = { 1: "Active", 0: "Inactive", true: "Active", false: "Inactive" };
    const display = labels[text] !== undefined ? labels[text] : text;
    return <span className={`sa-badge ${map[text] || "sa-badge-gray"}`}>{display}</span>;
  };

  /* ── LOADING STATE ── */

  /* ════════════════════════════════════════════ PAGES */

  const Dashboard = () => (
    <div className="sa-dashboard-page">
      <div className="sa-page-head">
        <div><h2>Super Admin Dashboard</h2></div>
        <button className="sa-btn-outline" onClick={fetchAllUsers}>Refresh</button>
      </div>
      {apiError && <div className="sa-api-error">Warning: {apiError}</div>}

      <div className="sa-stats-row sa-dashboard-stats">
        {[
          { label: "Interns & Buddies", value: interns.length, icon: <FaUserGraduate /> },
          { label: "Active Managers", value: managers.filter(m => m.is_active).length, icon: <FaUserTie /> },
          { label: "Active Admins", value: admins.filter(a => a.is_active).length, icon: <FaUserShield /> },
          { label: "Total Users", value: allUsers.length, icon: <FaUsers /> },
        ].map((s) => (
          <div key={s.label} className="sa-stat-card sa-dashboard-stat">
            <div className="sa-stat-top">
              <div className="sa-stat-icon">{s.icon}</div>
              <div className="sa-stat-label">{s.label}</div>
            </div>
            <div className="sa-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="sa-tabs sa-dashboard-tabs">
        {[
          ["overview", "Overview", <FaChartPie />],
          ["interns", "Interns", <FaUserGraduate />],
          ["managers", "Managers", <FaUserTie />],
          ["admins2", "Admins", <FaUserShield />],
          ["departments", "Departments", <FaBuilding />],
          ["roles", "Roles", <FaKey />],
          ["settings", "Settings", <FaCog />],
        ].map(([k, l, icon]) => (
          <button key={k} className={`sa-tab ${activeTab === k ? "active" : ""}`} onClick={() => setActiveTab(k)}>
            <span className="sa-tab-icon">{icon}</span>
            <span>{l}</span>
          </button>
        ))}
      </div>

      <div className="sa-tab-content">
        {activeTab === "overview" && (
          <div className="sa-overview-grid">
            <div className="sa-card sa-overview-card">
              <div className="sa-card-head">
                <span className="sa-card-head-icon"><FaChartPie /></span>
                <div>
                  <h4>Team Distribution</h4>
                  <p>Current user breakdown across the platform</p>
                </div>
              </div>
              {[
                ["Administrators", admins.length, <FaUserShield />],
                ["Managers", managers.length, <FaUserTie />],
                ["Interns & Buddies", interns.length, <FaUserGraduate />],
              ].map(([label, value, icon]) => (
                <div key={label} className="sa-role-row">
                  <span className="sa-role-label">{icon}<span>{label}</span></span>
                  <div className="sa-prog-bar"><div className="sa-prog-fill" style={{ width: Math.min((value / (allUsers.length || 1)) * 100, 100) + "%" }} /></div>
                  <span className="sa-role-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="sa-card sa-overview-card">
              <div className="sa-card-head">
                <span className="sa-card-head-icon"><FaClipboardList /></span>
                <div>
                  <h4>Workspace Summary</h4>
                  <p>Quick visibility into active and inactive accounts</p>
                </div>
              </div>
              <div className="sa-summary-list">
                <div className="sa-summary-item"><span><FaUsers /> Total Users</span><strong>{allUsers.length}</strong></div>
                <div className="sa-summary-item"><span><FaCheckCircle /> Active Users</span><strong>{allUsers.filter(u => u.is_active).length}</strong></div>
                <div className="sa-summary-item"><span><FaTimesCircle /> Inactive Users</span><strong>{allUsers.filter(u => !u.is_active).length}</strong></div>
                <div className="sa-summary-item"><span><FaUserShield /> Admins</span><strong>{admins.length}</strong></div>
                <div className="sa-summary-item"><span><FaUserTie /> Managers</span><strong>{managers.length}</strong></div>
                <div className="sa-summary-item"><span><FaUserGraduate /> Interns & Buddies</span><strong>{interns.length}</strong></div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "interns" && <UsersTable list={interns} roleId={ROLE.INTERN} title="Interns & Buddies" />}
        {activeTab === "managers" && <UsersTable list={managers} roleId={ROLE.MANAGER} title="Managers" />}
        {activeTab === "admins2" && <UsersTable list={admins} roleId={ROLE.ADMIN} title="Admins" />}
        {activeTab === "departments" && <DepartmentMaster />}
        {activeTab === "roles" && <RoleMaster />}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );

  /* -- REUSABLE USER TABLE -- */
  const UsersTable = ({ list, roleId, title }) => (
    <div>
      <div className="sa-section-head">
        <h3>{title} <span className="sa-count-badge">{list.length}</span></h3>
        <button className="sa-btn-primary" onClick={() => openAdd(roleId === ROLE.ADMIN ? "Admin" : roleId === ROLE.MANAGER ? "Manager" : "Intern")}>+ Add {title.split(" ")[0]}</button>
      </div>
      {list.length === 0 ? (
        <div className="sa-empty">No {title.toLowerCase()} found in database.</div>
      ) : (
        <table className="sa-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{list.map((u, i) => (
            <tr key={u.id}>
              <td className="sa-muted">{i + 1}</td>
              <td>
                <div className="sa-user-row">
                  <div className="sa-mini-avatar">{(u.name || u.full_name || "?").charAt(0).toUpperCase()}</div>
                  <strong>{u.name || u.full_name || "—"}</strong>
                </div>
              </td>
              <td>{u.email}</td>
              <td>{u.department || u.dept || <span className="sa-muted">—</span>}</td>
              <td><Badge text={u.is_active ? 1 : 0} /></td>
              <td className="sa-action-cell">
                <button className="sa-btn-sm" onClick={() => openEdit(roleId === ROLE.ADMIN ? "Admin" : roleId === ROLE.MANAGER ? "Manager" : "Intern", u)}><FaEdit /></button>
                <button className="sa-btn-sm" onClick={() => doConfirm(`${u.is_active ? "Deactivate" : "Activate"} "${u.name || u.full_name}"?`, () => toggleStatus(u))}>
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${u.name || u.full_name}"?`, () => removeUser(u))}><FaTrash /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  /* ── ADMINS PAGE ── */
  const AdminsPage = () => (
    <div className="sa-admins-page">
      <div className="sa-page-head">
        <div><h2>Admin Management</h2></div>
        <button className="sa-btn-primary" onClick={() => openAdd("Admin")}>+ Add New Admin</button>
      </div>
      {admins.length === 0 ? (
        <div className="sa-empty">No admins found in your database.</div>
      ) : (
        <table className="sa-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{admins.map((a, i) => (
            <tr key={a.id}>
              <td className="sa-muted">{i + 1}</td>
              <td>
                <div className="sa-user-row">
                  <div className="sa-mini-avatar">{(a.name || a.full_name || "A").charAt(0).toUpperCase()}</div>
                  <strong>{a.name || a.full_name || "—"}</strong>
                </div>
              </td>
              <td>{a.email}</td>
              <td>{a.department || a.dept || <span className="sa-muted">—</span>}</td>
              <td><Badge text={a.is_active ? 1 : 0} /></td>
              <td className="sa-action-cell">
                <button className="sa-btn-sm" onClick={() => openEdit("Admin", a)}><FaEdit /> Edit</button>
                <button className="sa-btn-sm" onClick={() => doConfirm(`${a.is_active ? "Deactivate" : "Activate"} "${a.name || a.full_name}"?`, () => toggleStatus(a))}>
                  {a.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove admin "${a.name || a.full_name}"?`, () => removeUser(a))}><FaTrash /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  /* ── MANAGERS PAGE ── */
  const ManagersPage = () => (
    <div className="sa-managers-page">
      <div className="sa-page-head">
        <div><h2>Manager Control</h2><p>All managers from your database</p></div>
        <button className="sa-btn-primary" onClick={() => openAdd("Manager")}>+ Add Manager</button>
      </div>
      {managers.length === 0 ? (
        <div className="sa-empty">No managers found in your database.</div>
      ) : (
        <div className="sa-mgr-grid">
          {managers.map(m => (
            <div key={m.id} className={`sa-mgr-card ${!m.is_active ? "sa-mgr-suspended" : ""}`}>
              <div className="sa-mgr-top">
                <div className="sa-mgr-avatar">{(m.name || m.full_name || "M").charAt(0).toUpperCase()}</div>
                <div>
                  <div className="sa-mgr-name">{m.name || m.full_name}</div>
                  <span className="sa-dept-pill">{m.department || m.dept || "No dept"}</span>
                </div>
                {!m.is_active && <span className="sa-badge sa-badge-red" style={{ marginLeft: "auto" }}>Inactive</span>}
              </div>
              <div className="sa-mgr-email">{m.email}</div>
              <div className="sa-mgr-actions">
                <button className="sa-btn-sm" onClick={() => openEdit("Manager", m)}><FaEdit /> Edit</button>
                <button className="sa-btn-sm sa-btn-warning" onClick={() => doConfirm(`${m.is_active ? "Deactivate" : "Activate"} "${m.name || m.full_name}"?`, () => toggleStatus(m))}>
                  <FaBan /> {m.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${m.name || m.full_name}"?`, () => removeUser(m))}><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── INTERNS PAGE ── */
  const InternsPage = () => (
    <div>
      <div className="sa-page-head">
        <div><h2>Intern Management</h2></div>
        <button className="sa-btn-primary" onClick={() => openAdd("Intern")}>+ Add Intern</button>
      </div>
      {interns.length === 0 ? (
        <div className="sa-empty">No interns or buddies found in your database.</div>
      ) : (
        <table className="sa-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{interns.map((u, i) => (
            <tr key={u.id}>
              <td className="sa-muted">{i + 1}</td>
              <td>
                <div className="sa-user-row">
                  <div className="sa-mini-avatar">{(u.name || u.full_name || "I").charAt(0).toUpperCase()}</div>
                  <strong>{u.name || u.full_name || "—"}</strong>
                </div>
              </td>
              <td>{u.email}</td>
              <td>{u.department || u.dept || <span className="sa-muted">—</span>}</td>
              <td>
                <span className="sa-dept-pill">
                  {getRoleKey(u) === "buddy" ? "Buddy" : "Intern"}
                </span>
              </td>
              <td><Badge text={u.is_active ? 1 : 0} /></td>
              <td className="sa-action-cell">
                <button className="sa-btn-sm" onClick={() => openEdit("Intern", u)}><FaEdit /></button>
                <button className="sa-btn-sm" onClick={() => doConfirm(`${u.is_active ? "Deactivate" : "Activate"} "${u.name || u.full_name}"?`, () => toggleStatus(u))}>
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${u.name || u.full_name}"?`, () => removeUser(u))}><FaTrash /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  const updateSettingInState = (key, val) => {
    setSystemSettings((prev) => {
      const nextValue = val.toString();
      const existing = prev.some((setting) => setting.key === key);

      if (existing) {
        return prev.map((setting) => (
          setting.key === key ? { ...setting, value: nextValue } : setting
        ));
      }

      return [...prev, { key, value: nextValue, category: "general" }];
    });
  };

  const handleSaveSettings = useCallback(async ({ showSuccessToast = true } = {}) => {
    setSaving(true);
    try {
      await axiosClient.put(
        "/superadmin/settings",
        { settings: systemSettings },
        { skipSuccessToast: true }
      );
      setSavedSettingsSnapshot(normalizedSettings);
      if (showSuccessToast) {
        showToast("System settings updated successfully!");
      }
      return true;
    } catch (err) {
      showToast("Failed to save settings", "error");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [normalizedSettings, systemSettings]);

  const escapePdfText = (value) => value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

  const buildPdfBlob = (title, payload) => {
    const lines = [
      title,
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      "",
      ...JSON.stringify(payload, null, 2).split("\n"),
    ];

    const linesPerPage = 40;
    const pages = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage));
    }

    const objects = [];
    const offsets = [];
    const addObject = (content) => {
      objects.push(content);
      return objects.length;
    };

    const catalogId = addObject("");
    const pagesId = addObject("");
    const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const pageIds = [];

    pages.forEach((pageLines) => {
      const streamLines = ["BT", "/F1 10 Tf"];
      let y = 780;

      pageLines.forEach((line) => {
        streamLines.push(`1 0 0 1 40 ${y} Tm (${escapePdfText(line)}) Tj`);
        y -= 18;
      });

      streamLines.push("ET");
      const stream = streamLines.join("\n");
      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    });

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

    let pdf = "%PDF-1.4\n";
    objects.forEach((object, index) => {
      offsets[index + 1] = pdf.length;
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await axiosClient.get("/superadmin/export-data", { skipSuccessToast: true });
      const data = res?.data?.data;
      if (!data) throw new Error("No data received");
      const blob = buildPdfBlob("System Data Export", data);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `system-export-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("Data exported successfully as PDF!");
    } catch (err) {
      showToast("Export failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setExporting(false);
    }
  };


  /* ── DEPARTMENT MASTER ── */
  const DepartmentMaster = () => {
    const [depts, setDepts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editItem, setEditItem] = React.useState(null);
    const [form, setForm] = React.useState({ dept_name: '', description: '' });
    const [saving, setSaving] = React.useState(false);

    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/superadmin/departments');
        const raw = res?.data?.data || res?.data || [];
        setDepts(Array.isArray(raw) ? raw : []);
      } catch { toast.error('Failed to load departments'); }
      finally { setLoading(false); }
    };
    React.useEffect(() => { load(); }, []);

    const openAdd = () => { setEditItem(null); setForm({ dept_name: '', description: '' }); setShowForm(true); };
    const openEdit = (d) => { setEditItem(d); setForm({ dept_name: d.dept_name, description: d.description || '' }); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditItem(null); };

    const handleSave = async () => {
      if (!form.dept_name.trim()) return toast.error('Department name is required');
      setSaving(true);
      try {
        if (editItem) {
          await axiosClient.put(`/superadmin/departments/${editItem.id}`, form);
          toast.success('Department updated!');
        } else {
          await axiosClient.post('/superadmin/departments', form);
          toast.success('Department created!');
        }
        closeForm(); load();
      } catch (e) { toast.error(e?.response?.data?.message || 'Failed to save'); }
      finally { setSaving(false); }
    };

    const handleDelete = (id, name) => {
      doConfirm(`Delete department "${name}"? This cannot be undone.`, async () => {
        try {
          await axiosClient.delete(`/superadmin/departments/${id}`);
          toast.success('Department deleted'); load();
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
      });
    };

    return (
      <div>
        <div className="sa-section-head">
          <div>
            <h3>Department Master</h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Manage departments dynamically — add, edit or remove</p>
          </div>
          <button className="sa-btn-primary" onClick={openAdd}>+ Add Department</button>
        </div>

        {showForm && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 16px', color: '#111827' }}>{editItem ? 'Edit Department' : 'New Department'}</h4>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DEPARTMENT NAME *</label>
                <input className="sa-input" value={form.dept_name}
                  onChange={e => setForm(p => ({ ...p, dept_name: e.target.value }))}
                  placeholder="e.g. Engineering, HR, Finance" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
                <input className="sa-input" value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description (optional)" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                </button>
                <button className="sa-btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}><FaSpinner className="sa-spin" /> Loading...</div>
        ) : depts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: 12, color: '#9ca3af' }}>
            <FaBuilding style={{ fontSize: 32, marginBottom: 10 }} />
            <p>No departments yet. Click "+ Add Department" to create one.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {depts.map(d => (
              <div key={d.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                      <FaBuilding />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{d.dept_name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>ID: {d.id}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="sa-btn-sm" onClick={() => openEdit(d)} title="Edit"><FaEdit /></button>
                    <button className="sa-btn-sm" style={{ color: '#dc2626' }} onClick={() => handleDelete(d.id, d.dept_name)} title="Delete"><FaTrash /></button>
                  </div>
                </div>
                {d.description && <p style={{ fontSize: 13, color: '#6b7280', margin: 0, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>{d.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ── ROLE MASTER ── */
  const RoleMaster = () => {
    const [roles, setRoles] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editItem, setEditItem] = React.useState(null);
    const [form, setForm] = React.useState({ role_name: '', description: '' });
    const [saving, setSaving] = React.useState(false);

    const CORE_ROLE_IDS = [1, 2, 3, 4, 5];
    const CORE_ROLE_LABELS = { 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern', 5: 'SuperAdmin' };

    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/superadmin/roles');
        const raw = res?.data?.data || res?.data || [];
        setRoles(Array.isArray(raw) ? raw : []);
      } catch { toast.error('Failed to load roles'); }
      finally { setLoading(false); }
    };
    React.useEffect(() => { load(); }, []);

    const openAdd = () => { setEditItem(null); setForm({ role_name: '', description: '' }); setShowForm(true); };
    const openEdit = (r) => { setEditItem(r); setForm({ role_name: r.role_name, description: r.description || '' }); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditItem(null); };

    const handleSave = async () => {
      if (!form.role_name.trim()) return toast.error('Role name is required');
      setSaving(true);
      try {
        if (editItem) {
          await axiosClient.put(`/superadmin/roles/${editItem.id}`, form);
          toast.success('Role updated!');
        } else {
          await axiosClient.post('/superadmin/roles', form);
          toast.success('Role created!');
        }
        closeForm(); load();
      } catch (e) { toast.error(e?.response?.data?.message || 'Failed to save'); }
      finally { setSaving(false); }
    };

    const handleDelete = (id, name) => {
      if (CORE_ROLE_IDS.includes(Number(id))) return toast.error('Cannot delete core system roles.');
      doConfirm(`Delete role "${name}"?`, async () => {
        try {
          await axiosClient.delete(`/superadmin/roles/${id}`);
          toast.success('Role deleted'); load();
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
      });
    };

    const ROLE_COLORS = {
      1: { bg: '#fef3c7', color: '#92400e' },
      2: { bg: '#dbeafe', color: '#1d4ed8' },
      3: { bg: '#d1fae5', color: '#065f46' },
      4: { bg: '#ede9fe', color: '#6d28d9' },
      5: { bg: '#fee2e2', color: '#991b1b' },
    };

    return (
      <div>
        <div className="sa-section-head">
          <div>
            <h3>Role Master</h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Manage user roles — core system roles are protected</p>
          </div>
          <button className="sa-btn-primary" onClick={openAdd}>+ Add Role</button>
        </div>

        {showForm && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 16px', color: '#111827' }}>{editItem ? 'Edit Role' : 'New Role'}</h4>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>ROLE NAME *</label>
                <input className="sa-input" value={form.role_name}
                  onChange={e => setForm(p => ({ ...p, role_name: e.target.value }))}
                  placeholder="e.g. HR Executive, Tech Lead" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
                <input className="sa-input" value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What this role does (optional)" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                </button>
                <button className="sa-btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaKey /> Core roles (Admin, Manager, Buddy, Intern, SuperAdmin) are protected and cannot be deleted.
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}><FaSpinner className="sa-spin" /> Loading...</div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr><th>#</th><th>Role Name</th><th>Description</th><th>Type</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {roles.map(r => {
                const isCore = CORE_ROLE_IDS.includes(Number(r.id));
                const style = ROLE_COLORS[r.id] || { bg: '#f3f4f6', color: '#374151' };
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: style.bg, color: style.color, padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                        <FaKey style={{ fontSize: 10 }} /> {r.role_name}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{r.description || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td>
                      <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: isCore ? '#fee2e2' : '#f0fdf4', color: isCore ? '#991b1b' : '#16a34a', fontWeight: 600 }}>
                        {isCore ? '🔒 Core' : '✦ Custom'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="sa-btn-sm" onClick={() => openEdit(r)} title="Edit"><FaEdit /></button>
                        {!isCore && (
                          <button className="sa-btn-sm" style={{ color: '#dc2626' }} onClick={() => handleDelete(r.id, r.role_name)} title="Delete"><FaTrash /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  /* ── SETTINGS PANEL — FIX 6 & 7 ── */
  const SettingsPanel = () => {
    // FIX 6: use local state so inputs are controlled properly
    const [localSettings, setLocalSettings] = useState(() =>
      systemSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
    );

    const getVal = (k) => localSettings[k] ?? systemSettings.find(s => s.key === k)?.value ?? "";
    const isChecked = (k) => getVal(k) === "true";

    const handleChange = (k, v) => {
      setLocalSettings(prev => ({ ...prev, [k]: v }));
      updateSettingInState(k, v);
    };

    const formatSessionTime = (value) =>
      value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Unavailable";
    const sessionBusy = saving || exporting;

    // FIX 7: email notification entries
    const emailNotifications = [
      { k: "notify_intern_assignment",   l: "New intern assigned to manager" },
      { k: "notify_task_completion",     l: "Intern task completed" },
      { k: "notify_leave_request",       l: "Leave request submitted" },
      { k: "notify_leave_approved",      l: "Leave request approved/rejected" },
      { k: "notify_document_uploaded",   l: "Document uploaded by intern" },
      { k: "notify_document_reviewed",   l: "Document reviewed by admin" },
      { k: "notify_profile_change",      l: "Profile change request submitted" },
      { k: "notify_daily_report",        l: "Daily report submitted" },
      { k: "weekly_reports",             l: "Weekly performance summary email" },
      { k: "notify_task_overdue",        l: "Task overdue reminder" },
    ];

    return (
      <div>
        <div className="sa-section-head">
          <div><h3>System Settings</h3></div>
          <div className="sa-settings-actions">
            <button className="sa-btn-primary" onClick={() => handleSaveSettings()} disabled={sessionBusy || settingsLoading}>
              {saving ? <><FaSpinner className="sa-spin" /> Saving...</> : "Save All Settings"}
            </button>
          </div>
        </div>
        <div className="sa-session-note">
          <span>Session expires: <strong>{formatSessionTime(session?.refreshTokenExpiresAt || session?.accessTokenExpiresAt)}</strong></span>
          <span>Session duration: <strong>1 day</strong></span>
          {hasUnsavedSettingsChanges && <span className="sa-session-warning">You have unsaved changes.</span>}
        </div>

        {settingsLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}><FaSpinner className="sa-spin" /> Loading settings...</div>
        ) : (
          <div className="sa-settings-grid">
            {/* FIX 6: General settings with working controlled inputs */}
            <div className="sa-card">
              <h4>General Settings</h4>
              <div className="sa-form-group">
                <label>Max Interns per Manager</label>
                <input
                  type="number"
                  min="1" max="50"
                  value={getVal("max_interns_per_manager")}
                  className="sa-input"
                  onChange={e => handleChange("max_interns_per_manager", e.target.value)}
                />
              </div>
              <div className="sa-form-group">
                <label>Default Internship Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  value={getVal("internship_duration_days")}
                  className="sa-input"
                  onChange={e => handleChange("internship_duration_days", e.target.value)}
                />
              </div>
              <div className="sa-form-group">
                <label>Leave Quota per Intern (days/year)</label>
                <input
                  type="number"
                  min="0"
                  value={getVal("leave_quota_per_intern") || "8"}
                  className="sa-input"
                  onChange={e => handleChange("leave_quota_per_intern", e.target.value)}
                />
              </div>
            </div>

            {/* FIX 7: Full email notification management panel */}
            <div className="sa-card">
              <h4 style={{ marginBottom: 4 }}>Email Notification Settings</h4>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                Toggle which events trigger an email notification. Changes are saved with "Save All Settings".
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {emailNotifications.map(item => (
                  <label key={item.k} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    cursor: "pointer", padding: "10px 14px", borderRadius: 9,
                    background: isChecked(item.k) ? "#f0fdf4" : "#f9fafb",
                    border: `1px solid ${isChecked(item.k) ? "#bbf7d0" : "#e5e7eb"}`,
                    transition: "all 0.15s",
                  }}>
                    <input
                      type="checkbox"
                      checked={isChecked(item.k)}
                      onChange={e => handleChange(item.k, e.target.checked ? "true" : "false")}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#00b1b4" }}
                    />
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: isChecked(item.k) ? 600 : 400 }}>
                      {item.l}
                    </span>
                    {isChecked(item.k) && (
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#16a34a", fontWeight: 700 }}>ON</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Session & Data */}
            <div className="sa-card">
              <h4>Session & Data</h4>
              <div className="sa-session-card">
                <div className="sa-session-row">
                  <span>Current session ends</span>
                  <strong>{formatSessionTime(session?.refreshTokenExpiresAt || session?.accessTokenExpiresAt)}</strong>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <button className="sa-btn-outline sa-full-btn" onClick={handleExportData} disabled={sessionBusy}>
                  {exporting ? "Exporting..." : "Export All Data as PDF"}
                </button>
              </div>
            </div>

            {/* System Info */}
            <div className="sa-card" style={{ background: "#F9FAFB", border: "1px dashed #D1D5DB" }}>
              <h4>System Info</h4>
              <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6 }}>
                Database Status: <span style={{ color: "#10B981", fontWeight: 600 }}>Connected</span><br />
                Last Sync: {new Date().toLocaleString()}<br />
                Environment: Production
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const pages = {
    dashboard: <Dashboard />,
    admins: <AdminsPage />,
    managers: <ManagersPage />,
    interns: <InternsPage />,
    settings: <div className="sa-content-inner"><SettingsPanel /></div>,
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, fontSize: 16, color: "#6b7280" }}>
      <FaSpinner className="sa-spin" /> Loading data from database...
    </div>
  );

  /* ════════════════════════════ RENDER */
  return (
    <div className={`sa-shell ${collapsed ? "sa-collapsed" : ""}`}>

      {/* ── SIDEBAR ── */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-top">
          <button className="sa-hamburger" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar"><FaBars /></button>
          {!collapsed && <span className="sa-sidebar-title">TEAMCOMPUTERS</span>}
        </div>
        <nav className="sa-nav">
          {navItems.map(n => (
            <button key={n.key} className={`sa-nav-link ${activePage === n.key ? "active" : ""}`}
              onClick={() => setActivePage(n.key)} title={collapsed ? n.label : ""}>
              <span className="sa-nav-icon">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <button className="sa-nav-link sa-logout-link" onClick={handleLogout} style={{ marginTop: "auto" }}>
          <span className="sa-nav-icon"><FaSignOutAlt /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="sa-main">
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <div>
              <h1 className="sa-topbar-title">Intern Management System</h1>
            </div>
          </div>
          <div className="sa-topbar-right" ref={dropdownRef}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={handleNotificationsToggle}
                title="Notifications"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  position: "relative", padding: 6,
                  transformOrigin: "top center",
                  animation: bellRinging ? "bellRing 0.6s ease" : "none",
                }}
              >
                <FaBell size={20} color={notifOpen ? "#00b1b4" : "#374151"} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "50%",
                      fontSize: 10,
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 36,
                    width: 320,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    zIndex: 9999,
                    maxHeight: 400,
                    overflowY: "auto"
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      fontWeight: 700,
                      borderBottom: "1px solid #f3f4f6",
                      fontSize: 14
                    }}
                  >
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ padding: 16, color: "#6b7280", fontSize: 13 }}>No notifications.</p>
                  ) : (
                    notifications.map((notification) => {
                      const createdAt = notification.createdAt || notification.created_at;
                      const timestamp = createdAt
                        ? new Date(createdAt).toLocaleString()
                        : "Unknown time";

                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          style={{
                            padding: "10px 16px",
                            borderBottom: "1px solid #f9fafb",
                            background: notification.is_read ? "#fff" : "#eff6ff",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{notification.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{notification.message}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{timestamp}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div
              className="sa-user-btn"
              onClick={() => {
                setNotifOpen(false);
                setDropdownOpen((open) => !open);
              }}
            >
              <div className="sa-user-avatar">{user.name?.charAt(0)?.toUpperCase() || "S"}</div>
              <div className="sa-user-info">
                <span className="sa-user-name">{user.name || user.email || "User"}</span>
              </div>
              <FaChevronDown className={`sa-chevron ${dropdownOpen ? "open" : ""}`} />
            </div>
            {dropdownOpen && (
              <div className="sa-dropdown">
                <div className="sa-dropdown-header">
                  <div className="sa-dd-avatar">{user.name?.charAt(0)?.toUpperCase() || "S"}</div>
                  <div>
                    <div className="sa-dd-name">{user.name || user.email || "User"}</div>
                    {user.email && <div className="sa-dd-email">{user.email}</div>}
                  </div>
                </div>
                <hr className="sa-dd-divider" />
                <button className="sa-dd-item" onClick={() => { setActivePage("settings"); setDropdownOpen(false); }}><FaCog /> System Settings</button>
                <button className="sa-dd-item" onClick={() => { setActivePage("admins"); setDropdownOpen(false); }}><FaUserShield /> Admin Management</button>
                <button className="sa-dd-item" onClick={() => { setActivePage("settings"); setDropdownOpen(false); }}><FaKey /> Change Password</button>
                <button className="sa-dd-item" onClick={() => { setActivePage("settings"); setDropdownOpen(false); }}><FaClipboardList /> Audit Log</button>
                <hr className="sa-dd-divider" />
                <button className="sa-dd-item sa-dd-logout" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="sa-content">{pages[activePage] || <Dashboard />}</main>
      </div>

      {/* ── MODALS ── */}
      {(modal === "addAdmin" || modal === "editAdmin") && (
        <Modal title={modal === "addAdmin" ? "Add New Admin" : "Edit Admin"} onClose={() => setModal(null)}>
          {field("Full Name", "name")}{field("Email", "email", "email")}
          {field("Department", "dept", "text", departments)}
          {modal === "addAdmin" && passwordField()}
          <button className="sa-btn-primary sa-full-btn" style={{ marginTop: 8 }} disabled={saving}
            onClick={() => saveUser(ROLE.ADMIN)}>{saving ? "Saving..." : modal === "addAdmin" ? "Add Admin" : "Save Changes"}</button>
        </Modal>
      )}
      {(modal === "addManager" || modal === "editManager") && (
        <Modal title={modal === "addManager" ? "Add New Manager" : "Edit Manager"} onClose={() => setModal(null)}>
          {field("Full Name", "name")}{field("Email", "email", "email")}
          {field("Department", "dept", "text", departments)}
          {modal === "addManager" && passwordField()}
          <button className="sa-btn-primary sa-full-btn" style={{ marginTop: 8 }} disabled={saving}
            onClick={() => saveUser(ROLE.MANAGER)}>{saving ? "Saving..." : modal === "addManager" ? "Add Manager" : "Save Changes"}</button>
        </Modal>
      )}
      {(modal === "addIntern" || modal === "editIntern") && (
        <Modal title={modal === "addIntern" ? "Add New Intern" : "Edit Intern"} onClose={() => setModal(null)}>
          {field("Full Name", "name")}{field("Email", "email", "email")}
          {field("Department", "dept", "text", departments)}
          {field("Start Date", "internship_start_date", "date")}
          {field("End Date", "internship_end_date", "date")}
          {modal === "addIntern" && passwordField()}
          <button className="sa-btn-primary sa-full-btn" style={{ marginTop: 8 }} disabled={saving}
            onClick={() => saveUser(ROLE.INTERN)}>{saving ? "Saving..." : modal === "addIntern" ? "Add Intern" : "Save Changes"}</button>
        </Modal>
      )}

      {confirm && <Confirm msg={confirm.msg} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
    </div>
  );
}

export default SuperAdmin;


// import React, { useState, useRef, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import {
//   FaBars, FaTachometerAlt, FaUserTie, FaUserGraduate,
//   FaUserShield, FaToggleOn, FaCog, FaSignOutAlt, FaChevronDown,
//   FaKey, FaClipboardList, FaBuilding, FaTimes, FaEdit, FaTrash,
//   FaBell, FaBan, FaSpinner, FaCheckCircle, FaTimesCircle,
//   FaChartPie, FaUsers
// } from "react-icons/fa";
// import axiosClient from "../../api/axiosClient";
// import { getNotifications, markAllNotificationsRead } from "../../api/api.js";
// import "./superadmin.css";
// import { useAuth } from '../../context/authcontext.jsx'

// /* ── Role IDs ── */
// // 1=Admin, 2=Manager, 3=Buddy/Trainee, 4=Intern, 5=SuperAdmin
// const ROLE = { SUPERADMIN: 5, ADMIN: 1, MANAGER: 2, BUDDY: 3, INTERN: 4 };
// const API_BASE = import.meta.env.VITE_API_BASE_URL
//   ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "")
//   : import.meta.env.VITE_API_URL
//     ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "")
//     : "http://localhost:7357";

// /* ── Modal ── */
// function Modal({ title, onClose, children }) {
//   return (
//     <div className="sa-modal-overlay" onClick={onClose}>
//       <div className="sa-modal" onClick={e => e.stopPropagation()}>
//         <div className="sa-modal-head">
//           <h3>{title}</h3>
//           <button className="sa-modal-close" onClick={onClose}><FaTimes /></button>
//         </div>
//         <div className="sa-modal-body">{children}</div>
//       </div>
//     </div>
//   );
// }

// /* ── Confirm ── */
// function Confirm({ msg, onYes, onNo }) {
//   return (
//     <div className="sa-modal-overlay">
//       <div className="sa-modal" style={{ maxWidth: 380 }}>
//         <div className="sa-modal-head"><h3>Confirm</h3></div>
//         <div className="sa-modal-body">
//           <p style={{ marginBottom: 20, color: "#374151" }}>{msg}</p>
//           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//             <button className="sa-btn-outline" onClick={onNo}>Cancel</button>
//             <button className="sa-btn-danger-solid" onClick={onYes}>Yes, Confirm</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════ */
// function SuperAdmin() {
//   const navigate = useNavigate();
//   const [activePage, setActivePage] = useState("dashboard");
//   const [activeTab, setActiveTab] = useState("overview");
//   const [collapsed, setCollapsed] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const unreadCount = notifications.filter((notification) => !notification.is_read).length;

//   /* real data from API */
//   const [allUsers, setAllUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [apiError, setApiError] = useState("");
//   const [systemSettings, setSystemSettings] = useState([]);
//   const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState([]);
//   const [settingsLoading, setSettingsLoading] = useState(false);
//   const [departments, setDepartments] = useState([]);   // ← moved inside component

//   /* modal / confirm / toast */
//   const [modal, setModal] = useState(null);
//   const [confirm, setConfirm] = useState(null);
//   const [formData, setFormData] = useState({});
//   const [editTarget, setEditTarget] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [exporting, setExporting] = useState(false);

//   const { user, session, logout } = useAuth();

//   useEffect(() => {
//     const h = e => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setDropdownOpen(false);
//         setNotifOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

//   useEffect(() => {
//     let isMounted = true;

//     const fetchNotifs = async () => {
//       try {
//         const res = await getNotifications();
//         const nextNotifications = Array.isArray(res?.data?.data)
//           ? res.data.data
//           : Array.isArray(res?.data)
//             ? res.data
//             : [];

//         if (isMounted) {
//           setNotifications(nextNotifications);
//         }
//       } catch {
//         // Keep the layout usable even if notifications fail to load.
//       }
//     };

//     fetchNotifs();
//     const intervalId = window.setInterval(fetchNotifs, 60000);

//     return () => {
//       isMounted = false;
//       window.clearInterval(intervalId);
//     };
//   }, []);

//   /* ── FETCH ALL USERS ── */
//   const normalizeUsersPayload = (payload) => {
//     if (Array.isArray(payload)) return payload;
//     if (Array.isArray(payload?.data)) return payload.data;
//     if (Array.isArray(payload?.users)) return payload.users;
//     if (Array.isArray(payload?.data?.users)) return payload.data.users;
//     if (Array.isArray(payload?.data?.data)) return payload.data.data;
//     return [];
//   };

//   const normalizeUser = (u) => ({
//     ...u,
//     role_id: Number(u?.role_id),
//     is_active: u?.is_active ?? u?.isActive ?? u?.active
//   });

//   const serializeSettings = useCallback((settings = []) => (
//     settings
//       .map((item) => ({
//         id: item?.id ?? null,
//         key: item?.key || "",
//         value: item?.value?.toString?.() ?? "",
//         category: item?.category || "general",
//         description: item?.description || ""
//       }))
//       .sort((a, b) => a.key.localeCompare(b.key))
//   ), []);

//   const normalizeRoleName = (val) =>
//     (val || "").toString().toLowerCase().replace(/[\s_-]/g, "");

//   const getRoleKey = (u) => {
//     const roleName = normalizeRoleName(u?.role_name || u?.role || u?.roleName);
//     if (roleName.includes("superadmin")) return "superadmin";
//     if (roleName.includes("admin")) return "admin";
//     if (roleName.includes("manager")) return "manager";
//     if (roleName.includes("buddy")) return "buddy";
//     // "trainee" and "intern" both map to intern
//     if (roleName.includes("trainee") || roleName.includes("intern")) return "intern";

//     const roleId = Number(u?.role_id);
//     if (roleId === ROLE.SUPERADMIN) return "superadmin";
//     if (roleId === ROLE.ADMIN) return "admin";
//     if (roleId === ROLE.MANAGER) return "manager";
//     if (roleId === ROLE.BUDDY) return "buddy";
//     if (roleId === ROLE.INTERN) return "intern";
//     return "other";
//   };

//   const fetchAllUsers = useCallback(async () => {
//     setLoading(true); setApiError("");
//     try {
//       const res = await axiosClient.get("/admin/users", {
//         params: { page: 1, limit: 200, _ts: Date.now() }
//       });
//       const payload = res?.data || {};
//       const data = normalizeUsersPayload(payload).map(normalizeUser);
//       setAllUsers(data);
//     } catch (err) {
//       const status = err?.response?.status;
//       if (status === 401 || status === 403 || status === 404) {
//         try {
//           const res = await axiosClient.get("/users", {
//             params: { page: 1, limit: 200, _ts: Date.now() }
//           });
//           const payload = res?.data || {};
//           const data = normalizeUsersPayload(payload).map(normalizeUser);
//           setAllUsers(data);
//           setApiError("");
//           return;
//         } catch (fallbackErr) {
//           setApiError(
//             fallbackErr.response?.data?.message ||
//             err.response?.data?.message ||
//             "Failed to load users"
//           );
//           return;
//         }
//       }
//       setApiError(err.response?.data?.message || "Failed to load users");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const fetchSettings = useCallback(async () => {
//     setSettingsLoading(true);
//     try {
//       const res = await axiosClient.get("/superadmin/settings");
//       const s = res?.data?.data || [];
//       setSystemSettings(s);
//       setSavedSettingsSnapshot(serializeSettings(s));
//     } catch (err) {
//       console.error("Failed to load settings", err);
//     } finally {
//       setSettingsLoading(false);
//     }
//   }, [serializeSettings]);

//   useEffect(() => {
//     fetchAllUsers();
//     fetchSettings();
//     // Load real departments from DB for dropdowns
//     axiosClient.get("/superadmin/departments")
//   .then(res => {
//     // handles both { success, data: [...] } and plain array responses
//     const raw = res?.data;
//     const depts = Array.isArray(raw) ? raw
//       : Array.isArray(raw?.data) ? raw.data
//       : [];
//     setDepartments(depts.length > 0 ? depts.map(d => d.dept_name) : ["IT", "HR", "Sales", "Ops", "Finance"]);
//   })
//   .catch(() => setDepartments(["IT", "HR", "Sales", "Ops", "Finance"]));
//   }, [fetchAllUsers, fetchSettings]);

//   const handleLogout = async () => {
//     setDropdownOpen(false);
//     setNotifOpen(false);
//     await logout();
//     navigate('/login');
//   };

//   const handleNotificationsToggle = async () => {
//     const nextOpen = !notifOpen;
//     setNotifOpen(nextOpen);
//     setDropdownOpen(false);

//     if (!nextOpen || unreadCount === 0) {
//       return;
//     }

//     try {
//       await markAllNotificationsRead();
//       setNotifications((prev) =>
//         prev.map((notification) => ({ ...notification, is_read: true }))
//       );
//     } catch {
//       // Notification reads can fail without blocking the layout.
//     }
//   };

//   const handleNotificationClick = (notification) => {
//     const payload = notification?.data || notification?.payload || {};
//     const fileCandidate =
//       notification?.file_url ||
//       notification?.document_url ||
//       notification?.url ||
//       notification?.link_url ||
//       payload?.file_url ||
//       payload?.document_url ||
//       payload?.filePath ||
//       payload?.file_path ||
//       payload?.document_path ||
//       payload?.path ||
//       null;

//     if (typeof fileCandidate === "string" && fileCandidate.trim()) {
//       const resolvedFileUrl = /^https?:\/\//i.test(fileCandidate)
//         ? fileCandidate
//         : `${API_BASE}${fileCandidate.startsWith("/") ? "" : "/"}${fileCandidate}`;
//       window.open(resolvedFileUrl, "_blank", "noopener,noreferrer");
//       setNotifOpen(false);
//       return;
//     }

//     const candidateRoute =
//       notification?.route ||
//       notification?.link ||
//       payload?.route ||
//       payload?.link ||
//       payload?.url ||
//       null;

//     if (typeof candidateRoute === "string" && candidateRoute.trim()) {
//       if (/^https?:\/\//i.test(candidateRoute)) {
//         window.open(candidateRoute, "_blank", "noopener,noreferrer");
//       } else {
//         navigate(candidateRoute);
//       }
//       setNotifOpen(false);
//       return;
//     }

//     const notificationText = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
//     if (notificationText.includes("document")) {
//       navigate("/admin/documents");
//       setNotifOpen(false);
//     }
//   };

//   /* ── FILTERED LISTS ── */
//   const admins = allUsers.filter(u => getRoleKey(u) === "admin");
//   const managers = allUsers.filter(u => getRoleKey(u) === "manager");
//   const interns = allUsers.filter(u => {
//     const key = getRoleKey(u);
//     return key === "intern" || key === "buddy";
//   });
//   const normalizedSettings = serializeSettings(systemSettings);
//   const hasUnsavedSettingsChanges =
//     JSON.stringify(normalizedSettings) !== JSON.stringify(savedSettingsSnapshot);

//   /* ── NAV ── */
//   const navItems = [
//     { key: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
//     { key: "admins", icon: <FaUserShield />, label: "Admin Management" },
//     { key: "managers", icon: <FaUserTie />, label: "Manager Control" },
//     { key: "interns", icon: <FaUserGraduate />, label: "Intern Management" },
//     { key: "settings", icon: <FaCog />, label: "System Settings" },
//   ];

//   /* ── TOAST HELPER ── */
//   const showToast = (msg, type = "success") => {
//     if (type === "error") toast.error(msg);
//     else toast.success(msg || "Success");
//   };

//   /* ── CONFIRM HELPER ── */
//   const doConfirm = (msg, fn) => setConfirm({ msg, onYes: () => { fn(); setConfirm(null); } });

//   /* ── FORM FIELD ── */
//   const field = (label, key, type = "text", options = null) => (
//     <div className="sa-form-group" key={key}>
//       <label>{label}</label>
//       {options ? (
//         <select value={formData[key] || ""} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}>
//           <option value="">-- Select {label} --</option>
//           {options.map(o => <option key={o} value={o}>{o}</option>)}
//         </select>
//       ) : (
//         <input type={type} value={formData[key] || ""} placeholder={label}
//           onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} />
//       )}
//     </div>
//   );

//   const passwordField = (label = "Password", key = "password") => (
//     <div className="sa-form-group" key={key}>
//       <label>{label}</label>
//       <input
//         type="password"
//         name={key}
//         value={formData[key] ?? ""}
//         placeholder={label}
//         autoComplete="new-password"
//         spellCheck={false}
//         onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
//       />
//     </div>
//   );

//   /* ── OPEN MODALS ── */
//   const openAdd = (type) => { setFormData({}); setEditTarget(null); setModal("add" + type); };
//   const openEdit = (type, item) => { setFormData({ ...item, name: item.name || item.full_name || "" }); setEditTarget(item.id); setModal("edit" + type); };

//   /* ── API SAVE ── */
//   const saveUser = async (roleId) => {
//     if (!formData.name || !formData.email) return showToast("Name and email are required", "error");
//     setSaving(true);
//     try {
//       const payload = {
//         name: formData.name,
//         email: formData.email,
//         role_id: roleId,
//         department: formData.dept || formData.department || "",
//         internship_start_date: formData.internship_start_date || "",
//         internship_end_date: formData.internship_end_date || "",
//         is_active: 1,
//       };
//       if (Object.prototype.hasOwnProperty.call(formData, "password")) {
//         payload.password = formData.password ?? "";
//       }
//       if (editTarget) {
//         await axiosClient.put(`/admin/users/${editTarget}`, payload);
//         showToast("User updated successfully");
//       } else {
//         if (!formData.password) { setSaving(false); return showToast("Password is required", "error"); }
//         await axiosClient.post("/admin/users", payload);
//         showToast("User created successfully");
//       }
//       await fetchAllUsers();
//       setModal(null);
//     } catch (err) {
//       showToast(err.response?.data?.message || "Error saving user", "error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ── TOGGLE ACTIVE ── */
//   const toggleStatus = async (u) => {
//     try {
//       await axiosClient.put(`/admin/users/${u.id}`, { is_active: u.is_active ? 0 : 1 });
//       await fetchAllUsers();
//       showToast(`User ${u.is_active ? "deactivated" : "activated"}`);
//     } catch { showToast("Failed to update status", "error"); }
//   };

//   /* ── REMOVE USER ── */
//   const removeUser = async (u) => {
//     const name = u.name || u.full_name || "User";
//     setAllUsers(prev => prev.filter(x => x.id !== u.id));
//     showToast(`${name} removed successfully`);
//     try {
//       await axiosClient.delete(`/admin/users/${u.id}`);
//     } catch {
//       try {
//         await axiosClient.put(`/admin/users/${u.id}`, { is_active: 0 });
//       } catch {
//         // Silent fail - already removed from UI
//       }
//     }
//   };

//   /* ── BADGE ── */
//   const Badge = ({ text }) => {
//     const map = { 1: "sa-badge-green", 0: "sa-badge-red", Active: "sa-badge-green", Inactive: "sa-badge-red", true: "sa-badge-green", false: "sa-badge-red" };
//     const labels = { 1: "Active", 0: "Inactive", true: "Active", false: "Inactive" };
//     const display = labels[text] !== undefined ? labels[text] : text;
//     return <span className={`sa-badge ${map[text] || "sa-badge-gray"}`}>{display}</span>;
//   };

//   /* ── LOADING STATE ── */

//   /* ════════════════════════════════════════════ PAGES */

//   const Dashboard = () => (
//     <div className="sa-dashboard-page">
//       <div className="sa-page-head">
//         <div><h2>Super Admin Dashboard</h2></div>
//         <button className="sa-btn-outline" onClick={fetchAllUsers}>Refresh</button>
//       </div>
//       {apiError && <div className="sa-api-error">Warning: {apiError}</div>}

//       <div className="sa-stats-row sa-dashboard-stats">
//         {[
//           { label: "Interns & Buddies", value: interns.length, icon: <FaUserGraduate /> },
//           { label: "Active Managers", value: managers.filter(m => m.is_active).length, icon: <FaUserTie /> },
//           { label: "Active Admins", value: admins.filter(a => a.is_active).length, icon: <FaUserShield /> },
//           { label: "Total Users", value: allUsers.length, icon: <FaUsers /> },
//         ].map((s) => (
//           <div key={s.label} className="sa-stat-card sa-dashboard-stat">
//             <div className="sa-stat-top">
//               <div className="sa-stat-icon">{s.icon}</div>
//               <div className="sa-stat-label">{s.label}</div>
//             </div>
//             <div className="sa-stat-value">{s.value}</div>
//           </div>
//         ))}
//       </div>

//       <div className="sa-tabs sa-dashboard-tabs">
//         {[
//           ["overview", "Overview", <FaChartPie />],
//           ["interns", "Interns", <FaUserGraduate />],
//           ["managers", "Managers", <FaUserTie />],
//           ["admins2", "Admins", <FaUserShield />],
//           ["departments", "Departments", <FaBuilding />],
//           ["roles", "Roles", <FaKey />],
//           ["settings", "Settings", <FaCog />],
//         ].map(([k, l, icon]) => (
//           <button key={k} className={`sa-tab ${activeTab === k ? "active" : ""}`} onClick={() => setActiveTab(k)}>
//             <span className="sa-tab-icon">{icon}</span>
//             <span>{l}</span>
//           </button>
//         ))}
//       </div>

//       <div className="sa-tab-content">
//         {activeTab === "overview" && (
//           <div className="sa-overview-grid">
//             <div className="sa-card sa-overview-card">
//               <div className="sa-card-head">
//                 <span className="sa-card-head-icon"><FaChartPie /></span>
//                 <div>
//                   <h4>Team Distribution</h4>
//                   <p>Current user breakdown across the platform</p>
//                 </div>
//               </div>
//               {[
//                 ["Administrators", admins.length, <FaUserShield />],
//                 ["Managers", managers.length, <FaUserTie />],
//                 ["Interns & Buddies", interns.length, <FaUserGraduate />],
//               ].map(([label, value, icon]) => (
//                 <div key={label} className="sa-role-row">
//                   <span className="sa-role-label">{icon}<span>{label}</span></span>
//                   <div className="sa-prog-bar"><div className="sa-prog-fill" style={{ width: Math.min((value / (allUsers.length || 1)) * 100, 100) + "%" }} /></div>
//                   <span className="sa-role-value">{value}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="sa-card sa-overview-card">
//               <div className="sa-card-head">
//                 <span className="sa-card-head-icon"><FaClipboardList /></span>
//                 <div>
//                   <h4>Workspace Summary</h4>
//                   <p>Quick visibility into active and inactive accounts</p>
//                 </div>
//               </div>
//               <div className="sa-summary-list">
//                 <div className="sa-summary-item"><span><FaUsers /> Total Users</span><strong>{allUsers.length}</strong></div>
//                 <div className="sa-summary-item"><span><FaCheckCircle /> Active Users</span><strong>{allUsers.filter(u => u.is_active).length}</strong></div>
//                 <div className="sa-summary-item"><span><FaTimesCircle /> Inactive Users</span><strong>{allUsers.filter(u => !u.is_active).length}</strong></div>
//                 <div className="sa-summary-item"><span><FaUserShield /> Admins</span><strong>{admins.length}</strong></div>
//                 <div className="sa-summary-item"><span><FaUserTie /> Managers</span><strong>{managers.length}</strong></div>
//                 <div className="sa-summary-item"><span><FaUserGraduate /> Interns & Buddies</span><strong>{interns.length}</strong></div>
//               </div>
//             </div>
//           </div>
//         )}
//         {activeTab === "interns" && <UsersTable list={interns} roleId={ROLE.INTERN} title="Interns & Buddies" />}
//         {activeTab === "managers" && <UsersTable list={managers} roleId={ROLE.MANAGER} title="Managers" />}
//         {activeTab === "admins2" && <UsersTable list={admins} roleId={ROLE.ADMIN} title="Admins" />}
//         {activeTab === "departments" && <DepartmentMaster />}
//         {activeTab === "roles" && <RoleMaster />}
//         {activeTab === "settings" && <SettingsPanel />}
//       </div>
//     </div>
//   );

//   /* -- REUSABLE USER TABLE -- */
//   const UsersTable = ({ list, roleId, title }) => (
//     <div>
//       <div className="sa-section-head">
//         <h3>{title} <span className="sa-count-badge">{list.length}</span></h3>
//         <button className="sa-btn-primary" onClick={() => openAdd(roleId === ROLE.ADMIN ? "Admin" : roleId === ROLE.MANAGER ? "Manager" : "Intern")}>+ Add {title.split(" ")[0]}</button>
//       </div>
//       {list.length === 0 ? (
//         <div className="sa-empty">No {title.toLowerCase()} found in database.</div>
//       ) : (
//         <table className="sa-table">
//           <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
//           <tbody>{list.map((u, i) => (
//             <tr key={u.id}>
//               <td className="sa-muted">{i + 1}</td>
//               <td>
//                 <div className="sa-user-row">
//                   <div className="sa-mini-avatar">{(u.name || u.full_name || "?").charAt(0).toUpperCase()}</div>
//                   <strong>{u.name || u.full_name || "—"}</strong>
//                 </div>
//               </td>
//               <td>{u.email}</td>
//               <td>{u.department || u.dept || <span className="sa-muted">—</span>}</td>
//               <td><Badge text={u.is_active ? 1 : 0} /></td>
//               <td className="sa-action-cell">
//                 <button className="sa-btn-sm" onClick={() => openEdit(roleId === ROLE.ADMIN ? "Admin" : roleId === ROLE.MANAGER ? "Manager" : "Intern", u)}><FaEdit /></button>
//                 <button className="sa-btn-sm" onClick={() => doConfirm(`${u.is_active ? "Deactivate" : "Activate"} "${u.name || u.full_name}"?`, () => toggleStatus(u))}>
//                   {u.is_active ? "Deactivate" : "Activate"}
//                 </button>
//                 <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${u.name || u.full_name}"?`, () => removeUser(u))}><FaTrash /></button>
//               </td>
//             </tr>
//           ))}</tbody>
//         </table>
//       )}
//     </div>
//   );

//   /* ── ADMINS PAGE ── */
//   const AdminsPage = () => (
//     <div className="sa-admins-page">
//       <div className="sa-page-head">
//         <div><h2>Admin Management</h2></div>
//         <button className="sa-btn-primary" onClick={() => openAdd("Admin")}>+ Add New Admin</button>
//       </div>
//       {admins.length === 0 ? (
//         <div className="sa-empty">No admins found in your database.</div>
//       ) : (
//         <table className="sa-table">
//           <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
//           <tbody>{admins.map((a, i) => (
//             <tr key={a.id}>
//               <td className="sa-muted">{i + 1}</td>
//               <td>
//                 <div className="sa-user-row">
//                   <div className="sa-mini-avatar">{(a.name || a.full_name || "A").charAt(0).toUpperCase()}</div>
//                   <strong>{a.name || a.full_name || "—"}</strong>
//                 </div>
//               </td>
//               <td>{a.email}</td>
//               <td>{a.department || a.dept || <span className="sa-muted">—</span>}</td>
//               <td><Badge text={a.is_active ? 1 : 0} /></td>
//               <td className="sa-action-cell">
//                 <button className="sa-btn-sm" onClick={() => openEdit("Admin", a)}><FaEdit /> Edit</button>
//                 <button className="sa-btn-sm" onClick={() => doConfirm(`${a.is_active ? "Deactivate" : "Activate"} "${a.name || a.full_name}"?`, () => toggleStatus(a))}>
//                   {a.is_active ? "Deactivate" : "Activate"}
//                 </button>
//                 <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove admin "${a.name || a.full_name}"?`, () => removeUser(a))}><FaTrash /></button>
//               </td>
//             </tr>
//           ))}</tbody>
//         </table>
//       )}
//     </div>
//   );

//   /* ── MANAGERS PAGE ── */
//   const ManagersPage = () => (
//     <div className="sa-managers-page">
//       <div className="sa-page-head">
//         <div><h2>Manager Control</h2><p>All managers from your database</p></div>
//         <button className="sa-btn-primary" onClick={() => openAdd("Manager")}>+ Add Manager</button>
//       </div>
//       {managers.length === 0 ? (
//         <div className="sa-empty">No managers found in your database.</div>
//       ) : (
//         <div className="sa-mgr-grid">
//           {managers.map(m => (
//             <div key={m.id} className={`sa-mgr-card ${!m.is_active ? "sa-mgr-suspended" : ""}`}>
//               <div className="sa-mgr-top">
//                 <div className="sa-mgr-avatar">{(m.name || m.full_name || "M").charAt(0).toUpperCase()}</div>
//                 <div>
//                   <div className="sa-mgr-name">{m.name || m.full_name}</div>
//                   <span className="sa-dept-pill">{m.department || m.dept || "No dept"}</span>
//                 </div>
//                 {!m.is_active && <span className="sa-badge sa-badge-red" style={{ marginLeft: "auto" }}>Inactive</span>}
//               </div>
//               <div className="sa-mgr-email">{m.email}</div>
//               <div className="sa-mgr-actions">
//                 <button className="sa-btn-sm" onClick={() => openEdit("Manager", m)}><FaEdit /> Edit</button>
//                 <button className="sa-btn-sm sa-btn-warning" onClick={() => doConfirm(`${m.is_active ? "Deactivate" : "Activate"} "${m.name || m.full_name}"?`, () => toggleStatus(m))}>
//                   <FaBan /> {m.is_active ? "Deactivate" : "Activate"}
//                 </button>
//                 <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${m.name || m.full_name}"?`, () => removeUser(m))}><FaTrash /></button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   /* ── INTERNS PAGE ── */
//   const InternsPage = () => (
//     <div>
//       <div className="sa-page-head">
//         <div><h2>Intern Management</h2></div>
//         <button className="sa-btn-primary" onClick={() => openAdd("Intern")}>+ Add Intern</button>
//       </div>
//       {interns.length === 0 ? (
//         <div className="sa-empty">No interns or buddies found in your database.</div>
//       ) : (
//         <table className="sa-table">
//           <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
//           <tbody>{interns.map((u, i) => (
//             <tr key={u.id}>
//               <td className="sa-muted">{i + 1}</td>
//               <td>
//                 <div className="sa-user-row">
//                   <div className="sa-mini-avatar">{(u.name || u.full_name || "I").charAt(0).toUpperCase()}</div>
//                   <strong>{u.name || u.full_name || "—"}</strong>
//                 </div>
//               </td>
//               <td>{u.email}</td>
//               <td>{u.department || u.dept || <span className="sa-muted">—</span>}</td>
//               <td>
//                 <span className="sa-dept-pill">
//                   {getRoleKey(u) === "buddy" ? "Buddy" : "Intern"}
//                 </span>
//               </td>
//               <td><Badge text={u.is_active ? 1 : 0} /></td>
//               <td className="sa-action-cell">
//                 <button className="sa-btn-sm" onClick={() => openEdit("Intern", u)}><FaEdit /></button>
//                 <button className="sa-btn-sm" onClick={() => doConfirm(`${u.is_active ? "Deactivate" : "Activate"} "${u.name || u.full_name}"?`, () => toggleStatus(u))}>
//                   {u.is_active ? "Deactivate" : "Activate"}
//                 </button>
//                 <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${u.name || u.full_name}"?`, () => removeUser(u))}><FaTrash /></button>
//               </td>
//             </tr>
//           ))}</tbody>
//         </table>
//       )}
//     </div>
//   );

//   const updateSettingInState = (key, val) => {
//     setSystemSettings((prev) => {
//       const nextValue = val.toString();
//       const existing = prev.some((setting) => setting.key === key);

//       if (existing) {
//         return prev.map((setting) => (
//           setting.key === key ? { ...setting, value: nextValue } : setting
//         ));
//       }

//       return [...prev, { key, value: nextValue, category: "general" }];
//     });
//   };

//   const handleSaveSettings = useCallback(async ({ showSuccessToast = true } = {}) => {
//     setSaving(true);
//     try {
//       await axiosClient.put(
//         "/superadmin/settings",
//         { settings: systemSettings },
//         { skipSuccessToast: true }
//       );
//       setSavedSettingsSnapshot(normalizedSettings);
//       if (showSuccessToast) {
//         showToast("System settings updated successfully!");
//       }
//       return true;
//     } catch (err) {
//       showToast("Failed to save settings", "error");
//       throw err;
//     } finally {
//       setSaving(false);
//     }
//   }, [normalizedSettings, systemSettings]);

//   const escapePdfText = (value) => value
//     .replace(/\\/g, "\\\\")
//     .replace(/\(/g, "\\(")
//     .replace(/\)/g, "\\)");

//   const buildPdfBlob = (title, payload) => {
//     const lines = [
//       title,
//       `Generated: ${new Date().toLocaleString("en-IN")}`,
//       "",
//       ...JSON.stringify(payload, null, 2).split("\n"),
//     ];

//     const linesPerPage = 40;
//     const pages = [];
//     for (let i = 0; i < lines.length; i += linesPerPage) {
//       pages.push(lines.slice(i, i + linesPerPage));
//     }

//     const objects = [];
//     const offsets = [];
//     const addObject = (content) => {
//       objects.push(content);
//       return objects.length;
//     };

//     const catalogId = addObject("");
//     const pagesId = addObject("");
//     const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
//     const pageIds = [];

//     pages.forEach((pageLines) => {
//       const streamLines = ["BT", "/F1 10 Tf"];
//       let y = 780;

//       pageLines.forEach((line) => {
//         streamLines.push(`1 0 0 1 40 ${y} Tm (${escapePdfText(line)}) Tj`);
//         y -= 18;
//       });

//       streamLines.push("ET");
//       const stream = streamLines.join("\n");
//       const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
//       const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
//       pageIds.push(pageId);
//     });

//     objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
//     objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

//     let pdf = "%PDF-1.4\n";
//     objects.forEach((object, index) => {
//       offsets[index + 1] = pdf.length;
//       pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
//     });

//     const xrefOffset = pdf.length;
//     pdf += `xref\n0 ${objects.length + 1}\n`;
//     pdf += "0000000000 65535 f \n";
//     for (let i = 1; i <= objects.length; i += 1) {
//       pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
//     }
//     pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

//     return new Blob([pdf], { type: "application/pdf" });
//   };

//   const handleExportData = async () => {
//     setExporting(true);
//     try {
//       const res = await axiosClient.get("/superadmin/export-data", { skipSuccessToast: true });
//       const data = res?.data?.data;
//       if (!data) throw new Error("No data received");
//       const blob = buildPdfBlob("System Data Export", data);
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", `system-export-${new Date().toISOString().split('T')[0]}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode.removeChild(link);
//       window.URL.revokeObjectURL(url);
//       showToast("Data exported successfully as PDF!");
//     } catch (err) {
//       showToast("Export failed: " + (err.response?.data?.message || err.message), "error");
//     } finally {
//       setExporting(false);
//     }
//   };


//   /* ── DEPARTMENT MASTER ── */
//   const DepartmentMaster = () => {
//     const [depts, setDepts] = React.useState([]);
//     const [loading, setLoading] = React.useState(true);
//     const [showForm, setShowForm] = React.useState(false);
//     const [editItem, setEditItem] = React.useState(null);
//     const [form, setForm] = React.useState({ dept_name: '', description: '' });
//     const [saving, setSaving] = React.useState(false);

//     const load = async () => {
//       setLoading(true);
//       try {
//         const res = await axiosClient.get('/superadmin/departments');
//         const raw = res?.data?.data || res?.data || [];
//         setDepts(Array.isArray(raw) ? raw : []);
//       } catch { toast.error('Failed to load departments'); }
//       finally { setLoading(false); }
//     };
//     React.useEffect(() => { load(); }, []);

//     const openAdd = () => { setEditItem(null); setForm({ dept_name: '', description: '' }); setShowForm(true); };
//     const openEdit = (d) => { setEditItem(d); setForm({ dept_name: d.dept_name, description: d.description || '' }); setShowForm(true); };
//     const closeForm = () => { setShowForm(false); setEditItem(null); };

//     const handleSave = async () => {
//       if (!form.dept_name.trim()) return toast.error('Department name is required');
//       setSaving(true);
//       try {
//         if (editItem) {
//           await axiosClient.put(`/superadmin/departments/${editItem.id}`, form);
//           toast.success('Department updated!');
//         } else {
//           await axiosClient.post('/superadmin/departments', form);
//           toast.success('Department created!');
//         }
//         closeForm(); load();
//       } catch (e) { toast.error(e?.response?.data?.message || 'Failed to save'); }
//       finally { setSaving(false); }
//     };

//     const handleDelete = (id, name) => {
//       doConfirm(`Delete department "${name}"? This cannot be undone.`, async () => {
//         try {
//           await axiosClient.delete(`/superadmin/departments/${id}`);
//           toast.success('Department deleted'); load();
//         } catch (e) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
//       });
//     };

//     return (
//       <div>
//         <div className="sa-section-head">
//           <div>
//             <h3>Department Master</h3>
//             <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Manage departments dynamically — add, edit or remove</p>
//           </div>
//           <button className="sa-btn-primary" onClick={openAdd}>+ Add Department</button>
//         </div>

//         {showForm && (
//           <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
//             <h4 style={{ margin: '0 0 16px', color: '#111827' }}>{editItem ? 'Edit Department' : 'New Department'}</h4>
//             <div style={{ display: 'grid', gap: 14 }}>
//               <div>
//                 <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DEPARTMENT NAME *</label>
//                 <input className="sa-input" value={form.dept_name}
//                   onChange={e => setForm(p => ({ ...p, dept_name: e.target.value }))}
//                   placeholder="e.g. Engineering, HR, Finance" />
//               </div>
//               <div>
//                 <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
//                 <input className="sa-input" value={form.description}
//                   onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
//                   placeholder="Brief description (optional)" />
//               </div>
//               <div style={{ display: 'flex', gap: 10 }}>
//                 <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
//                   {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
//                 </button>
//                 <button className="sa-btn-outline" onClick={closeForm}>Cancel</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {loading ? (
//           <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}><FaSpinner className="sa-spin" /> Loading...</div>
//         ) : depts.length === 0 ? (
//           <div style={{ padding: 48, textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: 12, color: '#9ca3af' }}>
//             <FaBuilding style={{ fontSize: 32, marginBottom: 10 }} />
//             <p>No departments yet. Click "+ Add Department" to create one.</p>
//           </div>
//         ) : (
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
//             {depts.map(d => (
//               <div key={d.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                     <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
//                       <FaBuilding />
//                     </div>
//                     <div>
//                       <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{d.dept_name}</div>
//                       <div style={{ fontSize: 12, color: '#9ca3af' }}>ID: {d.id}</div>
//                     </div>
//                   </div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button className="sa-btn-sm" onClick={() => openEdit(d)} title="Edit"><FaEdit /></button>
//                     <button className="sa-btn-sm" style={{ color: '#dc2626' }} onClick={() => handleDelete(d.id, d.dept_name)} title="Delete"><FaTrash /></button>
//                   </div>
//                 </div>
//                 {d.description && <p style={{ fontSize: 13, color: '#6b7280', margin: 0, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>{d.description}</p>}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   /* ── ROLE MASTER ── */
//   const RoleMaster = () => {
//     const [roles, setRoles] = React.useState([]);
//     const [loading, setLoading] = React.useState(true);
//     const [showForm, setShowForm] = React.useState(false);
//     const [editItem, setEditItem] = React.useState(null);
//     const [form, setForm] = React.useState({ role_name: '', description: '' });
//     const [saving, setSaving] = React.useState(false);

//     const CORE_ROLE_IDS = [1, 2, 3, 4, 5];
//     const CORE_ROLE_LABELS = { 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern', 5: 'SuperAdmin' };

//     const load = async () => {
//       setLoading(true);
//       try {
//         const res = await axiosClient.get('/superadmin/roles');
//         const raw = res?.data?.data || res?.data || [];
//         setRoles(Array.isArray(raw) ? raw : []);
//       } catch { toast.error('Failed to load roles'); }
//       finally { setLoading(false); }
//     };
//     React.useEffect(() => { load(); }, []);

//     const openAdd = () => { setEditItem(null); setForm({ role_name: '', description: '' }); setShowForm(true); };
//     const openEdit = (r) => { setEditItem(r); setForm({ role_name: r.role_name, description: r.description || '' }); setShowForm(true); };
//     const closeForm = () => { setShowForm(false); setEditItem(null); };

//     const handleSave = async () => {
//       if (!form.role_name.trim()) return toast.error('Role name is required');
//       setSaving(true);
//       try {
//         if (editItem) {
//           await axiosClient.put(`/superadmin/roles/${editItem.id}`, form);
//           toast.success('Role updated!');
//         } else {
//           await axiosClient.post('/superadmin/roles', form);
//           toast.success('Role created!');
//         }
//         closeForm(); load();
//       } catch (e) { toast.error(e?.response?.data?.message || 'Failed to save'); }
//       finally { setSaving(false); }
//     };

//     const handleDelete = (id, name) => {
//       if (CORE_ROLE_IDS.includes(Number(id))) return toast.error('Cannot delete core system roles.');
//       doConfirm(`Delete role "${name}"?`, async () => {
//         try {
//           await axiosClient.delete(`/superadmin/roles/${id}`);
//           toast.success('Role deleted'); load();
//         } catch (e) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
//       });
//     };

//     const ROLE_COLORS = {
//       1: { bg: '#fef3c7', color: '#92400e' },
//       2: { bg: '#dbeafe', color: '#1d4ed8' },
//       3: { bg: '#d1fae5', color: '#065f46' },
//       4: { bg: '#ede9fe', color: '#6d28d9' },
//       5: { bg: '#fee2e2', color: '#991b1b' },
//     };

//     return (
//       <div>
//         <div className="sa-section-head">
//           <div>
//             <h3>Role Master</h3>
//             <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Manage user roles — core system roles are protected</p>
//           </div>
//           <button className="sa-btn-primary" onClick={openAdd}>+ Add Role</button>
//         </div>

//         {showForm && (
//           <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
//             <h4 style={{ margin: '0 0 16px', color: '#111827' }}>{editItem ? 'Edit Role' : 'New Role'}</h4>
//             <div style={{ display: 'grid', gap: 14 }}>
//               <div>
//                 <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>ROLE NAME *</label>
//                 <input className="sa-input" value={form.role_name}
//                   onChange={e => setForm(p => ({ ...p, role_name: e.target.value }))}
//                   placeholder="e.g. HR Executive, Tech Lead" />
//               </div>
//               <div>
//                 <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
//                 <input className="sa-input" value={form.description}
//                   onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
//                   placeholder="What this role does (optional)" />
//               </div>
//               <div style={{ display: 'flex', gap: 10 }}>
//                 <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
//                   {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
//                 </button>
//                 <button className="sa-btn-outline" onClick={closeForm}>Cancel</button>
//               </div>
//             </div>
//           </div>
//         )}

//         <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
//           <FaKey /> Core roles (Admin, Manager, Buddy, Intern, SuperAdmin) are protected and cannot be deleted.
//         </div>

//         {loading ? (
//           <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}><FaSpinner className="sa-spin" /> Loading...</div>
//         ) : (
//           <table className="sa-table">
//             <thead>
//               <tr><th>#</th><th>Role Name</th><th>Description</th><th>Type</th><th>Actions</th></tr>
//             </thead>
//             <tbody>
//               {roles.map(r => {
//                 const isCore = CORE_ROLE_IDS.includes(Number(r.id));
//                 const style = ROLE_COLORS[r.id] || { bg: '#f3f4f6', color: '#374151' };
//                 return (
//                   <tr key={r.id}>
//                     <td>{r.id}</td>
//                     <td>
//                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: style.bg, color: style.color, padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
//                         <FaKey style={{ fontSize: 10 }} /> {r.role_name}
//                       </span>
//                     </td>
//                     <td style={{ color: '#6b7280', fontSize: 13 }}>{r.description || <span style={{ color: '#d1d5db' }}>—</span>}</td>
//                     <td>
//                       <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: isCore ? '#fee2e2' : '#f0fdf4', color: isCore ? '#991b1b' : '#16a34a', fontWeight: 600 }}>
//                         {isCore ? '🔒 Core' : '✦ Custom'}
//                       </span>
//                     </td>
//                     <td>
//                       <div style={{ display: 'flex', gap: 6 }}>
//                         <button className="sa-btn-sm" onClick={() => openEdit(r)} title="Edit"><FaEdit /></button>
//                         {!isCore && (
//                           <button className="sa-btn-sm" style={{ color: '#dc2626' }} onClick={() => handleDelete(r.id, r.role_name)} title="Delete"><FaTrash /></button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         )}
//       </div>
//     );
//   };

//   /* ── SETTINGS PANEL ── */
//   const SettingsPanel = () => {
//     const getVal = (k) => systemSettings.find(s => s.key === k)?.value || "";
//     const isChecked = (k) => getVal(k) === "true";
//     const formatSessionTime = (value) => (
//       value
//         ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
//         : "Unavailable"
//     );
//     const sessionBusy = saving || exporting;

//     return (
//       <div>
//         <div className="sa-section-head">
//           <div>
//             <h3>System Settings</h3>
//           </div>
//           <div className="sa-settings-actions">
//             <button className="sa-btn-primary" onClick={() => handleSaveSettings()} disabled={sessionBusy || settingsLoading}>
//               {saving ? <><FaSpinner className="sa-spin" /> Saving...</> : "Save All Settings"}
//             </button>
//           </div>
//         </div>
//         <div className="sa-session-note">
//           <span>Session expires: <strong>{formatSessionTime(session?.refreshTokenExpiresAt || session?.accessTokenExpiresAt)}</strong></span>
//           <span>Session duration: <strong>1 day</strong></span>
//           {hasUnsavedSettingsChanges && (
//             <span className="sa-session-warning">You have unsaved settings changes.</span>
//           )}
//         </div>

//         {settingsLoading ? (
//           <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}><FaSpinner className="sa-spin" /> Loading settings...</div>
//         ) : (
//           <div className="sa-settings-grid">
//             <div className="sa-card">
//               <h4>General Settings</h4>
//               <div className="sa-form-group">
//                 <label>Max Interns per Manager:</label>
//                 <input type="number" value={getVal("max_interns_per_manager")} className="sa-input"
//                   onChange={e => updateSettingInState("max_interns_per_manager", e.target.value)} />
//               </div>
//               <div className="sa-form-group">
//                 <label>Internship Duration (days):</label>
//                 <input type="number" value={getVal("internship_duration_days")} className="sa-input"
//                   onChange={e => updateSettingInState("internship_duration_days", e.target.value)} />
//               </div>
//             </div>

//             <div className="sa-card">
//               <h4>Email Notifications</h4>
//               {[
//                 { k: "notify_intern_assignment", l: "Notify on new intern assignment" },
//                 { k: "notify_task_completion", l: "Notify on task completion" },
//                 { k: "weekly_reports", l: "Weekly performance reports" }
//               ].map(item => (
//                 <label key={item.k} className="sa-check-label" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
//                   <input type="checkbox" checked={isChecked(item.k)}
//                     onChange={e => updateSettingInState(item.k, e.target.checked ? "true" : "false")} />
//                   <span>{item.l}</span>
//                 </label>
//               ))}
//             </div>

//             <div className="sa-card">
//               <h4>Session & Data</h4>
//               <div className="sa-session-card">
//                 <div className="sa-session-row">
//                   <span>Current session ends</span>
//                   <strong>{formatSessionTime(session?.refreshTokenExpiresAt || session?.accessTokenExpiresAt)}</strong>
//                 </div>
//               </div>
//               <div style={{ display: "grid", gap: 10 }}>
//                 <button className="sa-btn-outline sa-full-btn" onClick={handleExportData} disabled={sessionBusy}>
//                   {exporting ? "Exporting..." : "Export All Data as PDF"}
//                 </button>
//               </div>
//             </div>

//             <div className="sa-card" style={{ background: "#F9FAFB", border: "1px dashed #D1D5DB" }}>
//               <h4>System Info</h4>
//               <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>
//                 Database Status: <span style={{ color: "#10B981", fontWeight: 600 }}>Connected</span><br />
//                 Last Sync: {new Date().toLocaleString()}<br />
//                 Environment: Production
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const pages = {
//     dashboard: <Dashboard />,
//     admins: <AdminsPage />,
//     managers: <ManagersPage />,
//     interns: <InternsPage />,
//     settings: <div className="sa-content-inner"><SettingsPanel /></div>,
//   };

//   if (loading) return (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, fontSize: 16, color: "#6b7280" }}>
//       <FaSpinner className="sa-spin" /> Loading data from database...
//     </div>
//   );

//   /* ════════════════════════════ RENDER */
//   return (
//     <div className={`sa-shell ${collapsed ? "sa-collapsed" : ""}`}>

//       {/* ── SIDEBAR ── */}
//       <aside className="sa-sidebar">
//         <div className="sa-sidebar-top">
//           <button className="sa-hamburger" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar"><FaBars /></button>
//           {!collapsed && <span className="sa-sidebar-title">TEAMCOMPUTERS</span>}
//         </div>
//         <nav className="sa-nav">
//           {navItems.map(n => (
//             <button key={n.key} className={`sa-nav-link ${activePage === n.key ? "active" : ""}`}
//               onClick={() => setActivePage(n.key)} title={collapsed ? n.label : ""}>
//               <span className="sa-nav-icon">{n.icon}</span>
//               {!collapsed && <span>{n.label}</span>}
//             </button>
//           ))}
//         </nav>
//         <button className="sa-nav-link sa-logout-link" onClick={handleLogout} style={{ marginTop: "auto" }}>
//           <span className="sa-nav-icon"><FaSignOutAlt /></span>
//           {!collapsed && <span>Logout</span>}
//         </button>
//       </aside>

//       {/* ── MAIN ── */}
//       <div className="sa-main">
//         <header className="sa-topbar">
//           <div className="sa-topbar-left">
//             <div>
//               <h1 className="sa-topbar-title">Intern Management System</h1>
//             </div>
//           </div>
//           <div className="sa-topbar-right" ref={dropdownRef}>
//             <div style={{ position: "relative" }}>
//               <button
//                 type="button"
//                 onClick={handleNotificationsToggle}
//                 style={{
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   position: "relative",
//                   padding: 6
//                 }}
//               >
//                 <FaBell size={20} color="#374151" />
//                 {unreadCount > 0 && (
//                   <span
//                     style={{
//                       position: "absolute",
//                       top: 0,
//                       right: 0,
//                       background: "#ef4444",
//                       color: "#fff",
//                       borderRadius: "50%",
//                       fontSize: 10,
//                       width: 16,
//                       height: 16,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       fontWeight: 700
//                     }}
//                   >
//                     {unreadCount > 9 ? "9+" : unreadCount}
//                   </span>
//                 )}
//               </button>
//               {notifOpen && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     right: 0,
//                     top: 36,
//                     width: 320,
//                     background: "#fff",
//                     border: "1px solid #e5e7eb",
//                     borderRadius: 10,
//                     boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
//                     zIndex: 9999,
//                     maxHeight: 400,
//                     overflowY: "auto"
//                   }}
//                 >
//                   <div
//                     style={{
//                       padding: "12px 16px",
//                       fontWeight: 700,
//                       borderBottom: "1px solid #f3f4f6",
//                       fontSize: 14
//                     }}
//                   >
//                     Notifications
//                   </div>
//                   {notifications.length === 0 ? (
//                     <p style={{ padding: 16, color: "#6b7280", fontSize: 13 }}>No notifications.</p>
//                   ) : (
//                     notifications.map((notification) => {
//                       const createdAt = notification.createdAt || notification.created_at;
//                       const timestamp = createdAt
//                         ? new Date(createdAt).toLocaleString()
//                         : "Unknown time";

//                       return (
//                         <div
//                           key={notification.id}
//                           onClick={() => handleNotificationClick(notification)}
//                           style={{
//                             padding: "10px 16px",
//                             borderBottom: "1px solid #f9fafb",
//                             background: notification.is_read ? "#fff" : "#eff6ff",
//                             cursor: "pointer"
//                           }}
//                         >
//                           <div style={{ fontWeight: 600, fontSize: 13 }}>{notification.title}</div>
//                           <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{notification.message}</div>
//                           <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{timestamp}</div>
//                         </div>
//                       );
//                     })
//                   )}
//                 </div>
//               )}
//             </div>
//             <div
//               className="sa-user-btn"
//               onClick={() => {
//                 setNotifOpen(false);
//                 setDropdownOpen((open) => !open);
//               }}
//             >
//               <div className="sa-user-avatar">{user.name?.charAt(0)?.toUpperCase() || "S"}</div>
//               <div className="sa-user-info">
//                 <span className="sa-user-name">{user.name || user.email || "User"}</span>
//               </div>
//               <FaChevronDown className={`sa-chevron ${dropdownOpen ? "open" : ""}`} />
//             </div>
//             {dropdownOpen && (
//               <div className="sa-dropdown">
//                 <div className="sa-dropdown-header">
//                   <div className="sa-dd-avatar">{user.name?.charAt(0)?.toUpperCase() || "S"}</div>
//                   <div>
//                     <div className="sa-dd-name">{user.name || user.email || "User"}</div>
//                     {user.email && <div className="sa-dd-email">{user.email}</div>}
//                   </div>
//                 </div>
//                 <hr className="sa-dd-divider" />
//                 <button className="sa-dd-item" onClick={() => { setActivePage("settings"); setDropdownOpen(false); }}><FaCog /> System Settings</button>
//                 <button className="sa-dd-item" onClick={() => { setActivePage("admins"); setDropdownOpen(false); }}><FaUserShield /> Admin Management</button>
//                 <button className="sa-dd-item" onClick={() => { setActivePage("settings"); setDropdownOpen(false); }}><FaKey /> Change Password</button>
//                 <button className="sa-dd-item" onClick={() => { setActivePage("settings"); setDropdownOpen(false); }}><FaClipboardList /> Audit Log</button>
//                 <hr className="sa-dd-divider" />
//                 <button className="sa-dd-item sa-dd-logout" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
//               </div>
//             )}
//           </div>
//         </header>

//         <main className="sa-content">{pages[activePage] || <Dashboard />}</main>
//       </div>

//       {/* ── MODALS ── */}
//       {(modal === "addAdmin" || modal === "editAdmin") && (
//         <Modal title={modal === "addAdmin" ? "Add New Admin" : "Edit Admin"} onClose={() => setModal(null)}>
//           {field("Full Name", "name")}{field("Email", "email", "email")}
//           {field("Department", "dept", "text", departments)}
//           {modal === "addAdmin" && passwordField()}
//           <button className="sa-btn-primary sa-full-btn" style={{ marginTop: 8 }} disabled={saving}
//             onClick={() => saveUser(ROLE.ADMIN)}>{saving ? "Saving..." : modal === "addAdmin" ? "Add Admin" : "Save Changes"}</button>
//         </Modal>
//       )}
//       {(modal === "addManager" || modal === "editManager") && (
//         <Modal title={modal === "addManager" ? "Add New Manager" : "Edit Manager"} onClose={() => setModal(null)}>
//           {field("Full Name", "name")}{field("Email", "email", "email")}
//           {field("Department", "dept", "text", departments)}
//           {modal === "addManager" && passwordField()}
//           <button className="sa-btn-primary sa-full-btn" style={{ marginTop: 8 }} disabled={saving}
//             onClick={() => saveUser(ROLE.MANAGER)}>{saving ? "Saving..." : modal === "addManager" ? "Add Manager" : "Save Changes"}</button>
//         </Modal>
//       )}
//       {(modal === "addIntern" || modal === "editIntern") && (
//         <Modal title={modal === "addIntern" ? "Add New Intern" : "Edit Intern"} onClose={() => setModal(null)}>
//           {field("Full Name", "name")}{field("Email", "email", "email")}
//           {field("Department", "dept", "text", departments)}
//           {field("Start Date", "internship_start_date", "date")}
//           {field("End Date", "internship_end_date", "date")}
//           {modal === "addIntern" && passwordField()}
//           <button className="sa-btn-primary sa-full-btn" style={{ marginTop: 8 }} disabled={saving}
//             onClick={() => saveUser(ROLE.INTERN)}>{saving ? "Saving..." : modal === "addIntern" ? "Add Intern" : "Save Changes"}</button>
//         </Modal>
//       )}

//       {confirm && <Confirm msg={confirm.msg} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
//     </div>
//   );
// }

// export default SuperAdmin;


