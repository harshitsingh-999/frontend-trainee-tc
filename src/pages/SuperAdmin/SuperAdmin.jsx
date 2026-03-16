import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars, FaTachometerAlt, FaUserTie, FaUserGraduate,
  FaUserShield, FaToggleOn, FaCog, FaSignOutAlt, FaChevronDown,
  FaKey, FaClipboardList, FaBuilding, FaTimes, FaEdit, FaTrash,
  FaBan, FaSpinner, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import "./superadmin.css";

/* ── Role IDs ── */
// 1=Admin, 2=Manager, 3=Buddy, 4=Intern, 5=SuperAdmin
const ROLE = { SUPERADMIN:5, ADMIN:1, MANAGER:2, BUDDY:3, INTERN:4 };

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
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="sa-btn-outline" onClick={onNo}>Cancel</button>
            <button className="sa-btn-danger-solid" onClick={onYes}>Yes, Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`sa-toast sa-toast-${type}`}>
      {type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
      <span>{msg}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
function SuperAdmin() {
  const navigate = useNavigate();
  const [activePage,   setActivePage]   = useState("dashboard");
  const [activeTab,    setActiveTab]    = useState("overview");
  const [collapsed,    setCollapsed]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* real data from API */
  const [allUsers,  setAllUsers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState("");

  /* modal / confirm / toast */
  const [modal,      setModal]      = useState(null);
  const [confirm,    setConfirm]    = useState(null);
  const [toast,      setToast]      = useState(null);
  const [formData,   setFormData]   = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const h = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── FETCH ALL USERS ── */
  const fetchAllUsers = useCallback(async () => {
    setLoading(true); setApiError("");
    try {
      const res = await axiosClient.get("/admin/users", { params: { page:1, limit:200 } });
      const payload = res?.data || {};
      const data =
        (Array.isArray(payload.data)       && payload.data)       ||
        (Array.isArray(payload.users)      && payload.users)      ||
        (Array.isArray(payload.data?.users)&& payload.data.users) ||
        [];
      setAllUsers(data);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("authToken"); localStorage.removeItem("user");
    navigate("/login");
  };

  /* ── FILTERED LISTS ── */
  const admins   = allUsers.filter(u => u.role_id === ROLE.ADMIN);
  const managers = allUsers.filter(u => u.role_id === ROLE.MANAGER);
  const interns  = allUsers.filter(u => u.role_id === ROLE.INTERN || u.role_id === ROLE.BUDDY);

  const DEPTS = ["IT","HR","Sales","Ops","Finance"];

  /* ── NAV ── */
  const navItems = [
    { key:"dashboard", icon:<FaTachometerAlt />, label:"Dashboard"          },
    { key:"admins",    icon:<FaUserShield />,    label:"Admin Management"   },
    { key:"managers",  icon:<FaUserTie />,       label:"Manager Control"    },
    { key:"interns",   icon:<FaUserGraduate />,  label:"Intern Management"  },
    { key:"override",  icon:<FaToggleOn />,       label:"Override Decisions" },
    { key:"settings",  icon:<FaCog />,           label:"System Settings"    },
  ];

  /* ── TOAST HELPER ── */
  const showToast = (msg, type="success") => setToast({ msg, type });

  /* ── CONFIRM HELPER ── */
  const doConfirm = (msg, fn) => setConfirm({ msg, onYes: () => { fn(); setConfirm(null); } });

  /* ── FORM FIELD ── */
  const field = (label, key, type="text", options=null) => (
    <div className="sa-form-group" key={key}>
      <label>{label}</label>
      {options ? (
        <select value={formData[key]||""} onChange={e => setFormData(p=>({...p,[key]:e.target.value}))}>
          <option value="">-- Select {label} --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={formData[key]||""} placeholder={label}
          onChange={e => setFormData(p=>({...p,[key]:e.target.value}))} />
      )}
    </div>
  );

  /* ── OPEN MODALS ── */
  const openAdd  = (type)       => { setFormData({}); setEditTarget(null); setModal("add"+type); };
  const openEdit = (type, item) => { setFormData({...item, name: item.name || item.full_name || ""}); setEditTarget(item.id); setModal("edit"+type); };

  /* ── API SAVE ── */
  const saveUser = async (roleId) => {
    if (!formData.name || !formData.email) return showToast("Name and email are required", "error");
    setSaving(true);
    try {
      const payload = {
        name:      formData.name,
        email:     formData.email,
        role_id:   roleId,
        department:formData.dept || formData.department || "",
        ...(formData.password ? { password: formData.password } : {}),
        is_active: 1,
      };
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

  /* ── REMOVE USER ── */
  const removeUser = async (u) => {
    const name = u.name || u.full_name || "User";
    // Remove from UI immediately (optimistic)
    setAllUsers(prev => prev.filter(x => x.id !== u.id));
    showToast(`${name} removed successfully`);
    // Try DELETE first, fallback to deactivate
    try {
      await axiosClient.delete(`/admin/users/${u.id}`);
    } catch {
      try {
        await axiosClient.put(`/admin/users/${u.id}`, { is_active: 0 });
      } catch {
        // Silent fail - already removed from UI
      }
    }
  };

  /* ── BADGE ── */
  const Badge = ({ text }) => {
    const map = { 1:"sa-badge-green", 0:"sa-badge-red", Active:"sa-badge-green", Inactive:"sa-badge-red", true:"sa-badge-green", false:"sa-badge-red" };
    const labels = { 1:"Active", 0:"Inactive", true:"Active", false:"Inactive" };
    const display = labels[text] !== undefined ? labels[text] : text;
    return <span className={`sa-badge ${map[text] || "sa-badge-gray"}`}>{display}</span>;
  };

  /* ── LOADING STATE ── */
  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:12,fontSize:16,color:"#6b7280"}}>
      <FaSpinner className="sa-spin" /> Loading data from database...
    </div>
  );

  /* ════════════════════════════════════════════ PAGES */

  const Dashboard = () => (
    <div>
      <div className="sa-page-head">
        <div><h2>Super Admin Dashboard</h2><p>Manage interns, managers, and system-wide operations</p></div>
        <button className="sa-btn-outline" onClick={fetchAllUsers}>↻ Refresh</button>
      </div>
      {apiError && <div className="sa-api-error">⚠ {apiError}</div>}

      {/* Live stats from real data */}
      <div className="sa-stats-row">
        {[
          { label:"Total Interns",    value: interns.length,                                       color:"#3B82F6" },
          { label:"Active Managers",  value: managers.filter(m=>m.is_active).length,               color:"#10B981" },
          { label:"Active Admins",    value: admins.filter(a=>a.is_active).length,                 color:"#F59E0B" },
          { label:"Total Users",      value: allUsers.length,                                      color:"#EF4444" },
        ].map((s,i) => (
          <div key={i} className="sa-stat-card" style={{borderLeft:`4px solid ${s.color}`}}>
            <div className="sa-stat-label">{s.label.toUpperCase()}</div>
            <div className="sa-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="sa-tabs">
        {[["overview","📋 Overview"],["interns","👤 Interns"],["managers","🏢 Managers"],["admins2","🛡 Admins"],["settings","⚙️ Settings"]].map(([k,l]) => (
          <button key={k} className={`sa-tab ${activeTab===k?"active":""}`} onClick={()=>setActiveTab(k)}>{l}</button>
        ))}
      </div>

      <div className="sa-tab-content">
        {activeTab==="overview" && (
          <div>
            <div className="sa-section-head"><h3>System Overview</h3></div>
            <div className="sa-two-col">
              <div className="sa-card">
                <h4>👥 User Distribution by Role</h4>
                {[["Admins (role_id=1)", admins.length],["Managers (role_id=2)", managers.length],["Interns/Buddies (role 3-4)", interns.length]].map(([l,v]) => (
                  <div key={l} className="sa-perf-row">
                    <span style={{width:200}}>{l}</span>
                    <div className="sa-prog-bar"><div className="sa-prog-fill" style={{width: Math.min((v/(allUsers.length||1))*100, 100)+"%"}} /></div>
                    <span className="sa-muted">{v}</span>
                  </div>
                ))}
              </div>
              <div className="sa-card">
                <h4>📦 Quick Summary</h4>
                <div className="sa-dist-item"><strong>Total Users:</strong> {allUsers.length}</div>
                <div className="sa-dist-item"><strong>Active Users:</strong> {allUsers.filter(u=>u.is_active).length}</div>
                <div className="sa-dist-item"><strong>Inactive Users:</strong> {allUsers.filter(u=>!u.is_active).length}</div>
                <div className="sa-dist-item"><strong>Admins:</strong> {admins.length}</div>
                <div className="sa-dist-item"><strong>Managers:</strong> {managers.length}</div>
                <div className="sa-dist-item"><strong>Interns:</strong> {interns.length}</div>
              </div>
            </div>
          </div>
        )}
        {activeTab==="interns" && <UsersTable list={interns} roleId={ROLE.INTERN} title="Interns & Buddies" />}
        {activeTab==="managers" && <UsersTable list={managers} roleId={ROLE.MANAGER} title="Managers" />}
        {activeTab==="admins2" && <UsersTable list={admins} roleId={ROLE.ADMIN} title="Admins" />}
        {activeTab==="settings" && <SettingsPanel />}
      </div>
    </div>
  );

  /* ── REUSABLE USER TABLE ── */
  const UsersTable = ({ list, roleId, title }) => (
    <div>
      <div className="sa-section-head">
        <h3>{title} <span className="sa-count-badge">{list.length}</span></h3>
        <button className="sa-btn-primary" onClick={() => openAdd(roleId===ROLE.ADMIN?"Admin":roleId===ROLE.MANAGER?"Manager":"Intern")}>+ Add {title.split(" ")[0]}</button>
      </div>
      {list.length === 0 ? (
        <div className="sa-empty">No {title.toLowerCase()} found in database.</div>
      ) : (
        <table className="sa-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{list.map((u,i) => (
            <tr key={u.id}>
              <td className="sa-muted">{i+1}</td>
              <td>
                <div className="sa-user-row">
                  <div className="sa-mini-avatar">{(u.name||u.full_name||"?").charAt(0).toUpperCase()}</div>
                  <strong>{u.name || u.full_name || "—"}</strong>
                </div>
              </td>
              <td>{u.email}</td>
              <td>{u.department || u.dept || <span className="sa-muted">—</span>}</td>
              <td><Badge text={u.is_active ? 1 : 0} /></td>
              <td className="sa-action-cell">
                <button className="sa-btn-sm" onClick={() => openEdit(roleId===ROLE.ADMIN?"Admin":roleId===ROLE.MANAGER?"Manager":"Intern", u)}><FaEdit /></button>
                <button className="sa-btn-sm" onClick={() => doConfirm(`${u.is_active?"Deactivate":"Activate"} "${u.name || u.full_name}"?`, () => toggleStatus(u))}>
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
    <div>
      <div className="sa-page-head">
        <div><h2>Admin Management</h2><p>Manage department admins — real data from your database</p></div>
        <button className="sa-btn-primary" onClick={() => openAdd("Admin")}>+ Add New Admin</button>
      </div>
      <div className="sa-dept-row">
        {DEPTS.map(dept => (
          <div key={dept} className="sa-dept-card">
            <FaBuilding className="sa-dept-icon" />
            <div className="sa-dept-name">{dept}</div>
            <div className="sa-dept-count">{admins.filter(a => (a.department||a.dept||"").toLowerCase()===dept.toLowerCase()).length} admin(s)</div>
          </div>
        ))}
      </div>
      {admins.length === 0 ? (
        <div className="sa-empty">No admins (role_id=1) found in your database.</div>
      ) : (
        <table className="sa-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{admins.map((a,i) => (
            <tr key={a.id}>
              <td className="sa-muted">{i+1}</td>
              <td>
                <div className="sa-user-row">
                  <div className="sa-mini-avatar">{(a.name||a.full_name||"A").charAt(0).toUpperCase()}</div>
                  <strong>{a.name || a.full_name || "—"}</strong>
                </div>
              </td>
              <td>{a.email}</td>
              <td>{a.department || a.dept || <span className="sa-muted">—</span>}</td>
              <td><Badge text={a.is_active ? 1 : 0} /></td>
              <td className="sa-action-cell">
                <button className="sa-btn-sm" onClick={() => openEdit("Admin", a)}><FaEdit /> Edit</button>
                <button className="sa-btn-sm" onClick={() => doConfirm(`${a.is_active?"Deactivate":"Activate"} "${a.name||a.full_name}"?`, () => toggleStatus(a))}>
                  {a.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove admin "${a.name||a.full_name}"?`, () => removeUser(a))}><FaTrash /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  /* ── MANAGERS PAGE ── */
  const ManagersPage = () => (
    <div>
      <div className="sa-page-head">
        <div><h2>Manager Control</h2><p>All managers from your database</p></div>
        <button className="sa-btn-primary" onClick={() => openAdd("Manager")}>+ Add Manager</button>
      </div>
      {managers.length === 0 ? (
        <div className="sa-empty">No managers (role_id=2) found in your database.</div>
      ) : (
        <div className="sa-mgr-grid">
          {managers.map(m => (
            <div key={m.id} className={`sa-mgr-card ${!m.is_active?"sa-mgr-suspended":""}`}>
              <div className="sa-mgr-top">
                <div className="sa-mgr-avatar">{(m.name||m.full_name||"M").charAt(0).toUpperCase()}</div>
                <div>
                  <div className="sa-mgr-name">{m.name || m.full_name}</div>
                  <span className="sa-dept-pill">{m.department || m.dept || "No dept"}</span>
                </div>
                {!m.is_active && <span className="sa-badge sa-badge-red" style={{marginLeft:"auto"}}>Inactive</span>}
              </div>
              <div className="sa-mgr-email">{m.email}</div>
              <div className="sa-mgr-actions">
                <button className="sa-btn-sm" onClick={() => openEdit("Manager", m)}><FaEdit /> Edit</button>
                <button className="sa-btn-sm sa-btn-warning" onClick={() => doConfirm(`${m.is_active?"Deactivate":"Activate"} "${m.name||m.full_name}"?`, () => toggleStatus(m))}>
                  <FaBan /> {m.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${m.name||m.full_name}"?`, () => removeUser(m))}><FaTrash /></button>
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
        <div><h2>Intern Management</h2><p>All interns & buddies from your database</p></div>
        <button className="sa-btn-primary" onClick={() => openAdd("Intern")}>+ Add Intern</button>
      </div>
      {interns.length === 0 ? (
        <div className="sa-empty">No interns (role_id=3 or 4) found in your database.</div>
      ) : (
        <table className="sa-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{interns.map((u,i) => (
            <tr key={u.id}>
              <td className="sa-muted">{i+1}</td>
              <td>
                <div className="sa-user-row">
                  <div className="sa-mini-avatar">{(u.name||u.full_name||"I").charAt(0).toUpperCase()}</div>
                  <strong>{u.name || u.full_name || "—"}</strong>
                </div>
              </td>
              <td>{u.email}</td>
              <td>{u.department || u.dept || <span className="sa-muted">—</span>}</td>
              <td><span className="sa-dept-pill">{u.role_id===3?"Buddy":"Intern"}</span></td>
              <td><Badge text={u.is_active ? 1 : 0} /></td>
              <td className="sa-action-cell">
                <button className="sa-btn-sm" onClick={() => openEdit("Intern", u)}><FaEdit /></button>
                <button className="sa-btn-sm" onClick={() => doConfirm(`${u.is_active?"Deactivate":"Activate"} "${u.name||u.full_name}"?`, () => toggleStatus(u))}>
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="sa-btn-sm sa-btn-danger" onClick={() => doConfirm(`Remove "${u.name||u.full_name}"?`, () => removeUser(u))}><FaTrash /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  /* ── OVERRIDE PAGE ── */
  const OverridePage = () => {
    const [tasks, setTasks]         = useState([]);
    const [tasksLoading, setTL]     = useState(true);
    const [tasksError, setTE]       = useState("");
    const [filter, setFilter]       = useState("all");
    const [overriding, setOverriding] = useState(null);

    useEffect(() => {
      (async () => {
        setTL(true); setTE("");
        try {
          // Try multiple possible endpoints
          let data = [];
          try {
            const r = await axiosClient.get("/admin/tasks", { params: { limit: 200 } });
            const p = r?.data || {};
            data = Array.isArray(p.data) ? p.data : Array.isArray(p.tasks) ? p.tasks : Array.isArray(p) ? p : [];
          } catch {
            const r = await axiosClient.get("/tasks", { params: { limit: 200 } });
            const p = r?.data || {};
            data = Array.isArray(p.data) ? p.data : Array.isArray(p.tasks) ? p.tasks : Array.isArray(p) ? p : [];
          }
          setTasks(data);
        } catch (err) {
          setTE(err.response?.data?.message || "Could not load tasks");
        } finally { setTL(false); }
      })();
    }, []);

    const doOverride = async (task, newStatus) => {
      setOverriding(task.id);
      try {
        await axiosClient.put(`/tasks/${task.id}`, { status: newStatus });
        setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        showToast(`Task "${task.title}" status changed to ${newStatus}`);
      } catch {
        try {
          await axiosClient.put(`/admin/tasks/${task.id}`, { status: newStatus });
          setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
          showToast(`Task "${task.title}" overridden to ${newStatus}`);
        } catch (err) {
          showToast("Override failed: " + (err.response?.data?.message || "Server error"), "error");
        }
      } finally { setOverriding(null); }
    };

    const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

    const priorityColor = { low:"sa-badge-gray", medium:"sa-badge-yellow", high:"sa-badge-red", critical:"sa-badge-red" };
    const statusColor   = { todo:"sa-badge-gray", in_progress:"sa-badge-blue", review:"sa-badge-yellow", completed:"sa-badge-green", blocked:"sa-badge-red" };

    return (
      <div>
        <div className="sa-page-head">
          <div>
            <h2>Override Decisions</h2>
            <p>Review and override task statuses assigned by managers — {tasks.length} total tasks</p>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <select className="sa-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Summary pills */}
        <div className="sa-status-summary">
          {[["todo","To Do"],["in_progress","In Progress"],["review","Review"],["completed","Done"],["blocked","Blocked"]].map(([s,l]) => (
            <button key={s} className={`sa-status-pill ${filter===s?"active":""}`} onClick={() => setFilter(filter===s?"all":s)}>
              {l} <strong>{tasks.filter(t=>t.status===s).length}</strong>
            </button>
          ))}
        </div>

        {tasksLoading && <div style={{padding:30,textAlign:"center",color:"#6b7280"}}><FaSpinner className="sa-spin" /> Loading tasks from database...</div>}
        {tasksError  && <div className="sa-api-error">⚠ {tasksError} — make sure your backend has <code>/api/v1/tasks</code> or <code>/api/v1/admin/tasks</code></div>}

        {!tasksLoading && !tasksError && filtered.length === 0 && (
          <div className="sa-empty">No tasks found{filter !== "all" ? ` with status "${filter}"` : ""}.</div>
        )}

        {!tasksLoading && filtered.length > 0 && (
          <table className="sa-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task Title</th>
                <th>Assigned To</th>
                <th>Assigned By</th>
                <th>Priority</th>
                <th>Current Status</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th>Override To</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id}>
                  <td className="sa-muted">{i+1}</td>
                  <td>
                    <div style={{fontWeight:600, color:"#1f2933"}}>{t.title}</div>
                    {t.description && <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{t.description.substring(0,60)}{t.description.length>60?"…":""}</div>}
                  </td>
                  <td>
                    {/* Find intern name from allUsers */}
                    {allUsers.find(u => u.id === t.assigned_to)?.name ||
                     allUsers.find(u => u.id === t.assigned_to)?.full_name ||
                     <span className="sa-muted">ID: {t.assigned_to}</span>}
                  </td>
                  <td>
                    {allUsers.find(u => u.id === t.assigned_by)?.name ||
                     allUsers.find(u => u.id === t.assigned_by)?.full_name ||
                     <span className="sa-muted">ID: {t.assigned_by}</span>}
                  </td>
                  <td><span className={`sa-badge ${priorityColor[t.priority]||"sa-badge-gray"}`}>{t.priority||"—"}</span></td>
                  <td><span className={`sa-badge ${statusColor[t.status]||"sa-badge-gray"}`}>{t.status?.replace("_"," ")||"—"}</span></td>
                  <td style={{fontSize:12}}>{t.due_date ? new Date(t.due_date).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div className="sa-mini-prog"><div className="sa-mini-prog-fill" style={{width:(t.completion_percentage||0)+"%"}} /></div>
                      <span style={{fontSize:11,color:"#6b7280"}}>{t.completion_percentage||0}%</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className="sa-override-select"
                      value={t.status || "todo"}
                      disabled={overriding === t.id}
                      onChange={e => doOverride(t, e.target.value)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    {overriding === t.id && <FaSpinner className="sa-spin" style={{marginLeft:6,fontSize:11}} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  /* ── SETTINGS ── */
  const SettingsPanel = () => (
    <div>
      <div className="sa-section-head"><h3>System Settings</h3></div>
      <div className="sa-settings-grid">
        <div className="sa-card">
          <h4>General Settings</h4>
          <label>Max Interns per Manager:</label><input type="number" defaultValue="10" className="sa-input" />
          <label>Internship Duration (days):</label><input type="number" defaultValue="180" className="sa-input" />
          <button className="sa-btn-primary" onClick={() => showToast("Settings saved!")}>Save Settings</button>
        </div>
        <div className="sa-card">
          <h4>Email Notifications</h4>
          {["Notify on new intern assignment","Notify on task completion","Weekly performance reports"].map((l,i) => (
            <label key={l} className="sa-check-label"><input type="checkbox" defaultChecked={i<2}/> {l}</label>
          ))}
          <button className="sa-btn-primary" style={{marginTop:12}} onClick={() => showToast("Preferences updated!")}>Update Preferences</button>
        </div>
        <div className="sa-card">
          <h4>Security</h4>
          {["Change Admin Password","View Audit Log","Manage API Keys"].map(l => (
            <button key={l} className="sa-btn-outline sa-full-btn" onClick={() => showToast(`${l} — coming soon`, "error")}>{l}</button>
          ))}
        </div>
        <div className="sa-card">
          <h4>Data Management</h4>
          <button className="sa-btn-outline sa-full-btn" onClick={() => showToast("Exporting...")}>Export All Data</button>
          <button className="sa-btn-outline sa-full-btn" onClick={() => showToast("Backup started!")}>Backup System</button>
          <button className="sa-btn-danger-solid sa-full-btn" onClick={() => doConfirm("Clear all cache?", () => showToast("Cache cleared!"))}>Clear Cache</button>
        </div>
      </div>
    </div>
  );

  const pages = {
    dashboard: <Dashboard />,
    admins:    <AdminsPage />,
    managers:  <ManagersPage />,
    interns:   <InternsPage />,
    override:  <OverridePage />,
    settings:  <div className="sa-content-inner"><SettingsPanel /></div>,
  };

  /* ════════════════════════════ RENDER */
  return (
    <div className={`sa-shell ${collapsed?"sa-collapsed":""}`}>

      {/* ── SIDEBAR ── */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-top">
          <button className="sa-hamburger" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar"><FaBars /></button>
          {!collapsed && <span className="sa-sidebar-title">TEAMCOMPUTERS</span>}
        </div>
        <nav className="sa-nav">
          {navItems.map(n => (
            <button key={n.key} className={`sa-nav-link ${activePage===n.key?"active":""}`}
              onClick={() => setActivePage(n.key)} title={collapsed?n.label:""}>
              <span className="sa-nav-icon">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <button className="sa-nav-link sa-logout-link" onClick={handleLogout} style={{marginTop:"auto"}}>
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
              <p className="sa-topbar-sub">Track interns, buddies, and managers in one place.</p>
            </div>
          </div>
          <div className="sa-topbar-right" ref={dropdownRef}>
            <div className="sa-user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="sa-user-avatar">{user.name?.charAt(0)?.toUpperCase()||"S"}</div>
              <div className="sa-user-info">
                <span className="sa-user-name">{user.email||user.name||"Super Admin"}</span>
                <span className="sa-user-role">SuperAdmin</span>
              </div>
              <FaChevronDown className={`sa-chevron ${dropdownOpen?"open":""}`} />
            </div>
            {dropdownOpen && (
              <div className="sa-dropdown">
                <div className="sa-dropdown-header">
                  <div className="sa-dd-avatar">{user.name?.charAt(0)?.toUpperCase()||"S"}</div>
                  <div>
                    <div className="sa-dd-name">{user.name||"Super Admin"}</div>
                    <div className="sa-dd-email">{user.email||"superadmin@company.com"}</div>
                    <span className="sa-dd-badge">SuperAdmin</span>
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

        <main className="sa-content">{pages[activePage]||<Dashboard/>}</main>
      </div>

      {/* ── MODALS ── */}
      {(modal==="addAdmin"||modal==="editAdmin") && (
        <Modal title={modal==="addAdmin"?"Add New Admin":"Edit Admin"} onClose={() => setModal(null)}>
          {field("Full Name","name")}{field("Email","email","email")}
          {field("Department","dept","text",DEPTS)}
          {modal==="addAdmin" && field("Password","password","password")}
          <button className="sa-btn-primary sa-full-btn" style={{marginTop:8}} disabled={saving}
            onClick={() => saveUser(ROLE.ADMIN)}>{saving?"Saving...":modal==="addAdmin"?"Add Admin":"Save Changes"}</button>
        </Modal>
      )}
      {(modal==="addManager"||modal==="editManager") && (
        <Modal title={modal==="addManager"?"Add New Manager":"Edit Manager"} onClose={() => setModal(null)}>
          {field("Full Name","name")}{field("Email","email","email")}
          {field("Department","dept","text",DEPTS)}
          {modal==="addManager" && field("Password","password","password")}
          <button className="sa-btn-primary sa-full-btn" style={{marginTop:8}} disabled={saving}
            onClick={() => saveUser(ROLE.MANAGER)}>{saving?"Saving...":modal==="addManager"?"Add Manager":"Save Changes"}</button>
        </Modal>
      )}
      {(modal==="addIntern"||modal==="editIntern") && (
        <Modal title={modal==="addIntern"?"Add New Intern":"Edit Intern"} onClose={() => setModal(null)}>
          {field("Full Name","name")}{field("Email","email","email")}
          {field("Department","dept","text",DEPTS)}
          {modal==="addIntern" && field("Password","password","password")}
          <button className="sa-btn-primary sa-full-btn" style={{marginTop:8}} disabled={saving}
            onClick={() => saveUser(ROLE.INTERN)}>{saving?"Saving...":modal==="addIntern"?"Add Intern":"Save Changes"}</button>
        </Modal>
      )}

      {confirm && <Confirm msg={confirm.msg} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default SuperAdmin;