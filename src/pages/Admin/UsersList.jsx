import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import axiosClient from '../../api/axiosClient.js';

/* ─── helpers ────────────────────────────────────────────── */
const normalizeUsersPayload = (payload) => {
  if (Array.isArray(payload))                 return payload;
  if (Array.isArray(payload?.data?.users))    return payload.data.users;
  if (Array.isArray(payload?.users))          return payload.users;
  if (Array.isArray(payload?.data))           return payload.data;
  return [];
};
const normalizeTraineesPayload = (payload) => {
  if (Array.isArray(payload?.trainees))       return payload.trainees;
  if (Array.isArray(payload))                 return payload;
  if (Array.isArray(payload?.data))           return payload.data;
  return [];
};
const isActive = (v) => v === true || v === 1 || v === '1';
const getRoleName  = (id) => ({ 1:'Admin', 2:'Manager', 3:'Trainee', 4:'Intern' }[id] || 'Unknown');
const getRoleColor = (id) => ({ 1:'#6366f1', 2:'#0ea5e9', 3:'#10b981', 4:'#f59e0b' }[id] || '#94a3b8');

const UsersList = () => {
  const { users, loading, error, fetchUsers, toggleUserStatus } = useUser();
  const [actionError,    setActionError]   = useState('');
  const [actionSuccess,  setActionSuccess] = useState('');
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isMobile,   setIsMobile]   = useState(false);

  // modal state
  const [showAssign,   setShowAssign]   = useState(false);
  const [trainees,     setTrainees]     = useState([]);
  const [managers,     setManagers]     = useState([]);
  const [selTrainee,   setSelTrainee]   = useState('');
  const [selManager,   setSelManager]   = useState('');
  const [assigning,    setAssigning]    = useState(false);
  const [assignMsg,    setAssignMsg]    = useState('');
  const [assignErr,    setAssignErr]    = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── load trainees + managers for modal ── */
  const loadAssignData = useCallback(async () => {
    setTrainees([]); setManagers([]); setAssignErr(''); setModalLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        axiosClient.get('/admin/trainees'),
        axiosClient.get('/admin/users?limit=1000'),
      ]);
      const traineeList = normalizeTraineesPayload(tRes.data);
      const allUsers    = normalizeUsersPayload(uRes.data);

      setTrainees(traineeList.sort((a, b) =>
        (a.user?.name || '').localeCompare(b.user?.name || '')
      ));
      setManagers(allUsers.filter(u => Number(u.role_id) === 2 && isActive(u.is_active)));
    } catch (err) {
      setAssignErr('Failed to load: ' + (err.response?.data?.message || err.message));
    } finally { setModalLoading(false); }
  }, []);

  useEffect(() => { if (showAssign) loadAssignData(); }, [showAssign, loadAssignData]);

  /* ── assign manager ── */
  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!selTrainee) { setAssignErr('Please select an intern'); return; }
    setAssigning(true); setAssignMsg(''); setAssignErr('');
    try {
      await axiosClient.patch(
        `/admin/trainees/${selTrainee}/assign-manager`,
        { manager_id: selManager || null }
      );
      setAssignMsg('Manager assigned successfully!');
      setSelTrainee(''); setSelManager('');
      loadAssignData();
    } catch (err) {
      setAssignErr(err.response?.data?.message || err.message || 'Failed to assign');
    } finally { setAssigning(false); }
  };

  const handleToggleStatus = async (user) => {
    setTogglingUserId(user.id); setActionError(''); setActionSuccess('');
    try {
      const newStatus = user.is_active ? 0 : 1;
      await toggleUserStatus(user.id, newStatus === 1);
      setActionSuccess(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Error updating status');
    } finally { setTogglingUserId(null); }
  };

  const visibleUsers = users.filter(u => [2, 4].includes(Number(u.role_id)));

  const filteredUsers = visibleUsers.filter(u => {
    const q = search.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (filterRole === 'all' || Number(u.role_id) === parseInt(filterRole));
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:60, color:'#6b7280' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid #dde3f0', borderTopColor:'#00b1b4', animation:'spin 0.8s linear infinite' }} />
      Loading users…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight:700, color:'#1f2933', margin:'0 0 2px' }}>Manage Users</h2>
          <p style={{ fontSize:13, color:'#6b7280', margin:0 }}>View and manage all system users</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => { setShowAssign(true); setAssignMsg(''); setAssignErr(''); }}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 14px',
              background:'linear-gradient(135deg,#003b5c,#0ea5e9)', color:'#fff',
              border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            👥 Assign Manager
          </button>
          <a href="/admin/create-user"
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 14px',
              background:'linear-gradient(135deg,#00b1b4,#009688)', color:'#fff',
              textDecoration:'none', borderRadius:10, fontSize:13, fontWeight:700 }}>
            ⊕ Create User
          </a>
        </div>
      </div>

      {/* Alerts */}
      {error         && <div style={{ padding:'12px 16px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, color:'#991b1b', fontSize:13 }}>{error}</div>}
      {actionError   && <div style={{ padding:'12px 16px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, color:'#991b1b', fontSize:13 }}>{actionError}</div>}
      {actionSuccess && <div style={{ padding:'12px 16px', background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:10, color:'#065f46', fontSize:13 }}>✓ {actionSuccess}</div>}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1.5px solid #dde3f0', borderRadius:10, padding:'8px 12px', flex:1, minWidth:140 }}>
          <span style={{ color:'#9ca3af' }}>🔍</span>
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border:'none', outline:'none', background:'none', fontSize:13, width:'100%', fontFamily:'inherit' }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ padding:'8px 12px', border:'1.5px solid #dde3f0', borderRadius:10, fontSize:13, background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="all">All Roles</option>
          <option value="2">Manager</option>
          <option value="4">Intern</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterRole('all'); fetchUsers(); }}
          style={{ padding:'8px 14px', background:'#fff', border:'1.5px solid #dde3f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          ↻
        </button>
      </div>

      <div style={{ fontSize:12, color:'#9ca3af' }}>Showing {filteredUsers.length} of {visibleUsers.length} users</div>

      {/* ── mobile cards / desktop table ── */}
      {filteredUsers.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', background:'#fff', borderRadius:14, border:'1.5px dashed #dde3f0', color:'#6b7280' }}>
          No users found.
        </div>
      ) : isMobile ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filteredUsers.map(u => (
            <div key={u.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:getRoleColor(u.role_id), color:'#fff', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#1f2933', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                </div>
                <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:getRoleColor(u.role_id)+'20', color:getRoleColor(u.role_id), flexShrink:0 }}>
                  {getRoleName(u.role_id)}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:u.is_active ? '#d1fae5' : '#fee2e2', color:u.is_active ? '#065f46' : '#991b1b' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:u.is_active ? '#059669' : '#dc2626' }} />
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleToggleStatus(u)} disabled={togglingUserId === u.id}
                  style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', background:u.is_active ? '#fee2e2' : '#d1fae5', color:u.is_active ? '#dc2626' : '#059669', opacity:togglingUserId === u.id ? 0.5 : 1 }}>
                  {togglingUserId === u.id ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dde3f0', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:520 }}>
            <thead style={{ background:'#003b5c' }}>
              <tr>
                {['#','User','Email','Role','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 14px', color:'#fff', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u.id} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9', fontSize:12, color:'#9ca3af' }}>{i+1}</td>
                  <td style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:getRoleColor(u.role_id), color:'#fff', fontWeight:800, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontWeight:600, fontSize:13, color:'#1f2933' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9', fontSize:12, color:'#6b7280' }}>{u.email}</td>
                  <td style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9' }}>
                    <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:99, fontSize:12, fontWeight:700, background:getRoleColor(u.role_id)+'20', color:getRoleColor(u.role_id) }}>
                      {getRoleName(u.role_id)}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:u.is_active ? '#d1fae5' : '#fee2e2', color:u.is_active ? '#065f46' : '#991b1b' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:u.is_active ? '#059669' : '#dc2626' }} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9' }}>
                    <button onClick={() => handleToggleStatus(u)} disabled={togglingUserId === u.id}
                      style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', background:u.is_active ? '#fee2e2' : '#d1fae5', color:u.is_active ? '#dc2626' : '#059669', opacity:togglingUserId === u.id ? 0.5 : 1 }}>
                      {togglingUserId === u.id ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Assign Manager Modal (bottom sheet on mobile) ── */}
      {showAssign && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowAssign(false); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', zIndex:2000, padding: isMobile ? 0 : 16 }}>
          <div style={{ background:'#fff', borderRadius: isMobile ? '20px 20px 0 0' : 16, width:'100%', maxWidth: isMobile ? '100%' : 480, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 -8px 40px rgba(0,0,0,0.2)' }}>

            <div style={{ padding:'18px 20px', background:'#003b5c', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0', flexShrink:0 }}>
              <h3 style={{ margin:0, color:'#fff', fontSize:16, fontWeight:700 }}>👥 Assign Manager to Intern</h3>
              <button onClick={() => setShowAssign(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer', lineHeight:1, padding:4 }}>✕</button>
            </div>

            <div style={{ padding:20, overflowY:'auto', flex:1 }}>
              {modalLoading && (
                <div style={{ textAlign:'center', padding:'30px 0', color:'#6b7280', fontSize:13 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid #dde3f0', borderTopColor:'#00b1b4', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
                  Loading interns and managers…
                </div>
              )}

              {assignMsg && (
                <div style={{ padding:'12px 14px', borderRadius:9, marginBottom:16, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#16a34a', fontWeight:600, fontSize:13 }}>
                  ✓ {assignMsg}
                </div>
              )}
              {assignErr && (
                <div style={{ padding:'12px 14px', borderRadius:9, marginBottom:16, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontWeight:600, fontSize:13 }}>
                  ✕ {assignErr}
                </div>
              )}

              {!modalLoading && (
                <form onSubmit={handleAssignManager}>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontWeight:600, fontSize:13, color:'#374151', marginBottom:7 }}>
                      Select Intern *
                      {trainees.length === 0 && <span style={{ color:'#dc2626', fontWeight:400, marginLeft:6 }}>(none found — interns need a manager-created profile)</span>}
                    </label>
                    <select value={selTrainee} onChange={e => setSelTrainee(e.target.value)} required
                      style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #dde3f0', borderRadius:9, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}>
                      <option value="">— Choose an intern ({trainees.length} total) —</option>
                      {trainees.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.user?.name || t.user?.email || `Intern #${t.id}`}
                          {t.manager_id ? ' ✓ (has manager)' : ' (unassigned)'}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize:11, color:'#9ca3af', margin:'5px 0 0' }}>
                      Only interns with an internship profile appear here.
                    </p>
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontWeight:600, fontSize:13, color:'#374151', marginBottom:7 }}>
                      Select Manager
                      {managers.length === 0 && <span style={{ color:'#dc2626', fontWeight:400, marginLeft:6 }}>(no active managers found)</span>}
                    </label>
                    <select value={selManager} onChange={e => setSelManager(e.target.value)}
                      style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #dde3f0', borderRadius:9, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}>
                      <option value="">— Unassign (remove manager) —</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} — {m.email}</option>
                      ))}
                    </select>
                    <p style={{ fontSize:11, color:'#9ca3af', margin:'5px 0 0' }}>Leave blank to remove the current manager assignment.</p>
                  </div>

                  <button type="submit" disabled={assigning || trainees.length === 0}
                    style={{ width:'100%', padding:14, borderRadius:10, border:'none',
                      background: (assigning || trainees.length === 0) ? '#94a3b8' : '#003b5c',
                      color:'#fff', fontWeight:700, fontSize:15, cursor:(assigning || trainees.length === 0) ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                    {assigning ? 'Saving…' : '✓ Save Assignment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default UsersList;
