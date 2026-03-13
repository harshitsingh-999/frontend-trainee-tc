import React,{ useEffect, useState } from 'react';
import { useUser } from '../../Contexts/UserContext';

const UsersList = () => {
  const { users, loading, error, fetchUsers, toggleUserStatus } = useUser();
  const [actionError, setActionError]     = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    setTogglingUserId(user.id);
    setActionError(''); setActionSuccess('');
    try {
      const newStatus = user.is_active ? 0 : 1;
      await toggleUserStatus(user.id, newStatus === 1);
      setActionSuccess(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Error updating user status');
    } finally { setTogglingUserId(null); }
  };

  const getRoleName  = (id) => ({ 1:'Admin', 2:'Manager', 3:'Trainee', 4:'Intern' }[id] || 'Unknown');
  const getRoleColor = (id) => ({ 1:'#6366f1', 2:'#0ea5e9', 3:'#10b981', 4:'#f59e0b' }[id] || '#94a3b8');

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role_id === parseInt(filterRole);
    return matchSearch && matchRole;
  });

  const S = {
    page:      { display:'flex', flexDirection:'column', gap:20, fontFamily:"'Inter','DM Sans',system-ui,sans-serif" },
    header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 },
    h2:        { fontSize:22, fontWeight:700, color:'#1f2933', margin:'0 0 4px' },
    desc:      { fontSize:13, color:'#6b7280', margin:0 },
    btnCreate: { display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px',
                 background:'linear-gradient(135deg,#00b1b4,#009688)', color:'white',
                 textDecoration:'none', borderRadius:10, fontSize:13, fontWeight:700, whiteSpace:'nowrap' },
    toolbar:   { display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' },
    searchBox: { display:'flex', alignItems:'center', gap:8, background:'#fff',
                 border:'1.5px solid #dde3f0', borderRadius:10, padding:'9px 14px',
                 flex:1, minWidth:220 },
    searchIcon:{ color:'#9ca3af', fontSize:16 },
    searchIn:  { border:'none', outline:'none', background:'none', fontSize:13,
                 color:'#1f2933', width:'100%', fontFamily:'inherit' },
    select:    { padding:'9px 14px', border:'1.5px solid #dde3f0', borderRadius:10,
                 fontSize:13, color:'#1f2933', background:'#fff', fontFamily:'inherit', cursor:'pointer' },
    refreshBtn:{ padding:'9px 18px', background:'#fff', border:'1.5px solid #dde3f0',
                 borderRadius:10, fontSize:13, fontWeight:600, color:'#1f2933',
                 cursor:'pointer', fontFamily:'inherit' },
    meta:      { fontSize:12, color:'#9ca3af' },
    tableWrap: { background:'#fff', borderRadius:14, border:'1px solid #dde3f0',
                 boxShadow:'0 2px 12px rgba(15,23,42,0.07)', overflow:'hidden' },
    thead:     { background:'#003b5c' },
    th:        { padding:'13px 18px', color:'white', fontSize:11, fontWeight:700,
                 textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'left' },
    td:        { padding:'13px 18px', borderBottom:'1px solid #f1f5f9', fontSize:13,
                 color:'#1f2933', verticalAlign:'middle' },
    tdMuted:   { padding:'13px 18px', borderBottom:'1px solid #f1f5f9', fontSize:12,
                 color:'#9ca3af', verticalAlign:'middle' },
    userCell:  { display:'flex', alignItems:'center', gap:10 },
    avatar:    { width:36, height:36, borderRadius:'50%', color:'white', fontWeight:800,
                 fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
    userName:  { fontWeight:600, color:'#1f2933', fontSize:13.5 },
    email:     { padding:'13px 18px', borderBottom:'1px solid #f1f5f9', fontSize:12.5,
                 color:'#6b7280', verticalAlign:'middle' },
    roleBadge: { display:'inline-block', padding:'4px 12px', borderRadius:99,
                 fontSize:12, fontWeight:700 },
    statusActive:   { display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
                      borderRadius:99, fontSize:12, fontWeight:600, background:'#d1fae5', color:'#065f46' },
    statusInactive: { display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
                      borderRadius:99, fontSize:12, fontWeight:600, background:'#fee2e2', color:'#991b1b' },
    dot:       { width:6, height:6, borderRadius:'50%', background:'currentColor', flexShrink:0 },
    deactivate:{ padding:'6px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                 border:'none', fontFamily:'inherit', background:'#fee2e2', color:'#dc2626' },
    activate:  { padding:'6px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                 border:'none', fontFamily:'inherit', background:'#d1fae5', color:'#059669' },
    empty:     { textAlign:'center', padding:'50px 20px', background:'#fff', borderRadius:14,
                 border:'1.5px dashed #dde3f0', color:'#6b7280', fontSize:14 },
    loading:   { display:'flex', alignItems:'center', justifyContent:'center', gap:12,
                 padding:60, color:'#6b7280', fontSize:14 },
    alert:     { padding:'12px 16px', borderRadius:10, fontSize:13, fontWeight:500 },
  };

  if (loading) return (
    <div style={S.loading}>
      <div style={{width:20,height:20,borderRadius:'50%',border:'2px solid #dde3f0',
        borderTopColor:'#00b1b4',animation:'spin 0.8s linear infinite'}} />
      Loading users...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.h2}>Manage Users</h2>
          <p style={S.desc}>View, activate and manage all system users</p>
        </div>
        <a href="/admin/create-user" style={S.btnCreate}>⊕ Create User</a>
      </div>

      {/* Alerts */}
      {error       && <div style={{...S.alert, background:'#fee2e2', border:'1px solid #fca5a5', color:'#991b1b'}}>{error}</div>}
      {actionError && <div style={{...S.alert, background:'#fee2e2', border:'1px solid #fca5a5', color:'#991b1b'}}>{actionError}</div>}
      {actionSuccess && <div style={{...S.alert, background:'#d1fae5', border:'1px solid #6ee7b7', color:'#065f46'}}>✓ {actionSuccess}</div>}

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>🔍</span>
          <input type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={S.searchIn} className="search-input" />
        </div>
        <div style={{display:'flex', gap:8}}>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={S.select} className="role-filter">
            <option value="all">All Roles</option>
            <option value="1">Admin</option>
            <option value="2">Manager</option>
            <option value="3">Trainee</option>
            <option value="4">Intern</option>
          </select>
          <button onClick={() => { setSearch(''); setFilterRole('all'); fetchUsers(); }} style={S.refreshBtn} className="refresh-btn">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Meta */}
      <div style={S.meta}>Showing {filteredUsers.length} of {users.length} users</div>

      {/* Table or Empty */}
      {filteredUsers.length === 0 ? (
        <div style={S.empty}>
          <div style={{fontSize:32, marginBottom:10}}>◈</div>
          <p>No users found matching your filters.</p>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead style={S.thead}>
              <tr>
                {['#','User','Email','Role','Status','Actions'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.id} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={S.tdMuted}>{i + 1}</td>
                  <td style={S.td}>
                    <div style={S.userCell}>
                      <div style={{...S.avatar, background: getRoleColor(user.role_id)}}>
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span style={S.userName}>{user.name}</span>
                    </div>
                  </td>
                  <td style={S.email}>{user.email}</td>
                  <td style={S.td}>
                    <span style={{...S.roleBadge, background: getRoleColor(user.role_id)+'20', color: getRoleColor(user.role_id)}}>
                      {getRoleName(user.role_id)}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={user.is_active ? S.statusActive : S.statusInactive}>
                      <span style={{...S.dot, background: user.is_active ? '#059669' : '#dc2626'}} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={togglingUserId === user.id}
                      style={{...(user.is_active ? S.deactivate : S.activate),
                              opacity: togglingUserId === user.id ? 0.5 : 1}}
                      className={`toggle-btn ${user.is_active ? 'toggle-deactivate' : 'toggle-activate'}`}
                    >
                      {togglingUserId === user.id ? '...' : user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersList;