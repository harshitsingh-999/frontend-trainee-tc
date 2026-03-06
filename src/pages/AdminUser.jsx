// import React, { useState, useEffect } from 'react'
// import {
//   getUsers, createUser, updateUser,
//   deactivateUser, reactivateUser, assignRole, getRoles
// } from '../api/api'

// export default function AdminUsers() {
//   const [users, setUsers]         = useState([])
//   const [roles, setRoles]         = useState([])
//   const [total, setTotal]         = useState(0)
//   const [page, setPage]           = useState(1)
//   const [search, setSearch]       = useState('')
//   const [loading, setLoading]     = useState(false)
//   const [error, setError]         = useState('')
//   const [showModal, setShowModal] = useState(false)
//   const [modalType, setModalType] = useState('create') // create | edit | role
//   const [selected, setSelected]   = useState(null)
//   const [saving, setSaving]       = useState(false)
//   const [formError, setFormError] = useState('')

//   const emptyForm = { name: '', email: '', password: '', phone: '', address: '', role_id: 4, dept_id: '', is_active: 1 }
//   const [form, setForm] = useState(emptyForm)
//   const [newRoleId, setNewRoleId] = useState('')

//   const totalPages = Math.ceil(total / 10)

//   // stats derived from users list
//   const totalUsers    = total
//   const activeUsers   = users.filter(u => u.is_active).length
//   const inactiveUsers = users.filter(u => !u.is_active).length

//   // ── Fetch ─────────────────────────────────────────────
//   const fetchUsers = async () => {
//     setLoading(true)
//     setError('')
//     try {
//       const res = await getUsers(page, search)
//       setUsers(res.data.data.users)
//       setTotal(res.data.data.total)
//     } catch {
//       setError('Failed to load users. Make sure the backend is running.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchRoles = async () => {
//     try {
//       const res = await getRoles()
//       setRoles(res.data.data || [])
//     } catch {
//       // roles are optional, silently fail
//     }
//   }

//   useEffect(() => { fetchUsers() }, [page, search])
//   useEffect(() => { fetchRoles() }, [])

//   // ── Open modals ───────────────────────────────────────
//   const openCreate = () => {
//     setModalType('create')
//     setForm(emptyForm)
//     setFormError('')
//     setShowModal(true)
//   }

//   const openEdit = (user) => {
//     setModalType('edit')
//     setSelected(user)
//     setForm({
//       name:      user.name,
//       email:     user.email,
//       password:  '',
//       phone:     user.phone   || '',
//       address:   user.address || '',
//       role_id:   user.role_id || 4,
//       dept_id:   user.dept_id || '',
//       is_active: user.is_active,
//     })
//     setFormError('')
//     setShowModal(true)
//   }

//   const openAssignRole = (user) => {
//     setModalType('role')
//     setSelected(user)
//     setNewRoleId(user.role_id || '')
//     setFormError('')
//     setShowModal(true)
//   }

//   const closeModal = () => setShowModal(false)

//   // ── Save create / edit ────────────────────────────────
//   const handleSave = async () => {
//     if (!form.name || !form.email) { setFormError('Name and email are required.'); return }
//     if (modalType === 'create' && !form.password) { setFormError('Password is required.'); return }
//     setSaving(true)
//     setFormError('')
//     try {
//       if (modalType === 'edit') {
//         const payload = { ...form }
//         if (!payload.password) delete payload.password
//         await updateUser(selected.id, payload)
//       } else {
//         await createUser(form)
//       }
//       closeModal()
//       fetchUsers()
//     } catch (err) {
//       setFormError(err.response?.data?.message || 'Something went wrong.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   // ── Assign role ───────────────────────────────────────
//   const handleAssignRole = async () => {
//     if (!newRoleId) { setFormError('Please select a role.'); return }
//     setSaving(true)
//     try {
//       await assignRole(selected.id, parseInt(newRoleId))
//       closeModal()
//       fetchUsers()
//     } catch (err) {
//       setFormError(err.response?.data?.message || 'Failed to assign role.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   // ── Deactivate / Reactivate ───────────────────────────
//   const handleDeactivate = async (user) => {
//     if (!window.confirm(`Deactivate ${user.name}?`)) return
//     try { await deactivateUser(user.id); fetchUsers() }
//     catch { alert('Failed to deactivate.') }
//   }

//   const handleReactivate = async (user) => {
//     if (!window.confirm(`Reactivate ${user.name}?`)) return
//     try { await reactivateUser(user.id); fetchUsers() }
//     catch { alert('Failed to reactivate.') }
//   }

//   return (
//     <div className="dashboard">

//       {/* ── Header ── */}
//       <div className="dashboard-header">
//         <div>
//           <h2>View Users</h2>
//           <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tc-text-muted)' }}>
//             Manage all user accounts — create, edit, assign roles, activate / deactivate
//           </p>
//         </div>
//         <button className="btn-primary" onClick={openCreate}>+ New User</button>
//       </div>

//       {/* ── Stats Matrix ── */}
//       <div className="stats-grid" style={{ marginBottom: 4 }}>
//         <div className="stat-card">
//           <div className="stat-label">Total Users</div>
//           <div className="stat-value">{totalUsers}</div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-label">Active</div>
//           <div className="stat-value" style={{ color: '#166534' }}>{activeUsers}</div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-label">Inactive</div>
//           <div className="stat-value" style={{ color: '#92400e' }}>{inactiveUsers}</div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-label">Total Pages</div>
//           <div className="stat-value">{totalPages || 1}</div>
//         </div>
//       </div>

//       {/* ── Search ── */}
//       <div className="card" style={{ padding: '12px 16px' }}>
//         <input
//           type="text"
//           placeholder="Search by name or email..."
//           value={search}
//           onChange={e => { setSearch(e.target.value); setPage(1) }}
//           style={{
//             width: '100%', border: '1px solid var(--tc-border-subtle)',
//             borderRadius: 999, padding: '8px 14px', fontSize: 13, outline: 'none'
//           }}
//         />
//       </div>

//       {/* ── Table ── */}
//       <div className="card" style={{ padding: 0 }}>
//         {loading ? (
//           <p style={{ padding: 20, textAlign: 'center', color: 'var(--tc-text-muted)' }}>Loading...</p>
//         ) : error ? (
//           <p style={{ padding: 20, textAlign: 'center', color: '#b91c1c' }}>{error}</p>
//         ) : (
//           <div className="table-wrapper">
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Name</th>
//                   <th>Email</th>
//                   <th>Role</th>
//                   <th>Department</th>
//                   <th>Status</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.length === 0 ? (
//                   <tr>
//                     <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--tc-text-muted)' }}>
//                       No users found
//                     </td>
//                   </tr>
//                 ) : users.map((u, i) => (
//                   <tr key={u.id}>
//                     <td>{(page - 1) * 10 + i + 1}</td>
//                     <td style={{ fontWeight: 600 }}>{u.name}</td>
//                     <td>{u.email}</td>
//                     <td>{u.role?.role_name || `Role ${u.role_id}`}</td>
//                     <td>{u.department?.dept_name || '—'}</td>
//                     <td>
//                       <span className={`pill ${u.is_active ? 'pill-green' : 'pill-amber'}`}>
//                         {u.is_active ? 'Active' : 'Inactive'}
//                       </span>
//                     </td>
//                     <td>
//                       <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
//                         <button className="btn-secondary btn-small" onClick={() => openEdit(u)}>
//                           Edit
//                         </button>
//                         <button className="btn-secondary btn-small" onClick={() => openAssignRole(u)}>
//                           Role
//                         </button>
//                         {u.is_active ? (
//                           <button
//                             className="btn-secondary btn-small"
//                             style={{ color: '#92400e' }}
//                             onClick={() => handleDeactivate(u)}
//                           >
//                             Deactivate
//                           </button>
//                         ) : (
//                           <button
//                             className="btn-secondary btn-small"
//                             style={{ color: '#166534' }}
//                             onClick={() => handleReactivate(u)}
//                           >
//                             Reactivate
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
//             <button className="btn-secondary btn-small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
//             <span style={{ fontSize: 13, lineHeight: '30px' }}>Page {page} of {totalPages}</span>
//             <button className="btn-secondary btn-small" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
//           </div>
//         )}
//       </div>

//       {/* ── Modal ── */}
//       {showModal && (
//         <div style={{
//           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
//         }}>
//           <div style={{
//             background: '#fff', borderRadius: 20, padding: 28,
//             width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-soft)',
//             maxHeight: '90vh', overflowY: 'auto'
//           }}>

//             {/* CREATE / EDIT */}
//             {(modalType === 'create' || modalType === 'edit') && (
//               <>
//                 <h3 style={{ margin: '0 0 18px' }}>
//                   {modalType === 'create' ? 'Create New User' : `Edit — ${selected?.name}`}
//                 </h3>
//                 <div className="form-grid">
//                   <div className="grid-2">
//                     <div className="form-group">
//                       <label>Name *</label>
//                       <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
//                     </div>
//                     <div className="form-group">
//                       <label>Email *</label>
//                       <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
//                     </div>
//                     <div className="form-group">
//                       <label>{modalType === 'edit' ? 'New Password (optional)' : 'Password *'}</label>
//                       <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" />
//                     </div>
//                     <div className="form-group">
//                       <label>Phone</label>
//                       <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
//                     </div>
//                     <div className="form-group">
//                       <label>Role ID</label>
//                       <input type="number" value={form.role_id} onChange={e => setForm({ ...form, role_id: parseInt(e.target.value) })} />
//                     </div>
//                     <div className="form-group">
//                       <label>Department ID</label>
//                       <input type="number" value={form.dept_id} onChange={e => setForm({ ...form, dept_id: e.target.value })} placeholder="Optional" />
//                     </div>
//                   </div>
//                   <div className="form-group">
//                     <label>Address</label>
//                     <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
//                   </div>
//                   <div className="form-group">
//                     <label>Status</label>
//                     <select value={form.is_active} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}>
//                       <option value={1}>Active</option>
//                       <option value={0}>Inactive</option>
//                     </select>
//                   </div>
//                 </div>
//                 {formError && <p style={{ color: '#b91c1c', fontSize: 13, margin: '10px 0 0' }}>{formError}</p>}
//                 <div className="form-actions" style={{ marginTop: 20 }}>
//                   <button className="btn-secondary" onClick={closeModal}>Cancel</button>
//                   <button className="btn-primary" onClick={handleSave} disabled={saving}>
//                     {saving ? 'Saving...' : modalType === 'create' ? 'Create User' : 'Update User'}
//                   </button>
//                 </div>
//               </>
//             )}

//             {/* ASSIGN ROLE */}
//             {modalType === 'role' && (
//               <>
//                 <h3 style={{ margin: '0 0 8px' }}>Assign Role</h3>
//                 <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--tc-text-muted)' }}>
//                   Changing role for <strong>{selected?.name}</strong>
//                 </p>
//                 <div className="form-group">
//                   <label>Select Role ID</label>
//                   <input
//                     type="number"
//                     value={newRoleId}
//                     onChange={e => setNewRoleId(e.target.value)}
//                     placeholder="Enter role ID (e.g. 1 = Admin, 4 = Intern)"
//                   />
//                   {roles.length > 0 && (
//                     <div style={{ marginTop: 8, fontSize: 12, color: 'var(--tc-text-muted)' }}>
//                       Available roles: {roles.map(r => `${r.id} = ${r.role_name}`).join(', ')}
//                     </div>
//                   )}
//                 </div>
//                 {formError && <p style={{ color: '#b91c1c', fontSize: 13, margin: '10px 0 0' }}>{formError}</p>}
//                 <div className="form-actions" style={{ marginTop: 20 }}>
//                   <button className="btn-secondary" onClick={closeModal}>Cancel</button>
//                   <button className="btn-primary" onClick={handleAssignRole} disabled={saving}>
//                     {saving ? 'Saving...' : 'Assign Role'}
//                   </button>
//                 </div>
//               </>
//             )}

//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, toggleUserStatus } from '../api/api'

function Users() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await getUsers({
        page: 1,
        limit: 50,
      })
      const payload = res?.data
      const rawUsers = Array.isArray(payload)
        ? payload
        : payload?.users || payload?.data?.users || payload?.data || []

      // Normalize backend field names for UI.
      const normalized = (Array.isArray(rawUsers) ? rawUsers : []).map((u) => ({
        ...u,
        isActive: u?.isActive ?? u?.is_active ?? true,
      }))

      setUsers(normalized)
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.msg
      if (backendMessage) {
        const status = err?.response?.status
        setErrorMsg(status ? `${backendMessage} (HTTP ${status})` : backendMessage)
      } else if (err?.response?.status) {
        setErrorMsg(`Failed to load users (HTTP ${err.response.status}).`)
      } else {
        setErrorMsg('Failed to load users.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleStatus = async (user) => {
    const currentStatus = user.isActive ?? user.is_active ?? true
    const newStatus = !currentStatus
    setTogglingId(user.id)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await toggleUserStatus(user.id, newStatus)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
      )
      setSuccessMsg(
        `${user.name || user.email} has been ${newStatus ? 'activated' : 'deactivated'}.`
      )
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update status.')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <div>
          <h2>User Management</h2>
          <p>Create, edit, and manage user access across all roles.</p>
        </div>
        <button
          className="btn-primary btn-small"
          onClick={() => navigate('/user-form')}
        >
          + Add New User
        </button>
      </div>

      {/* Status messages */}
      {successMsg && <p className="success-text">{successMsg}</p>}
      {errorMsg && <p className="error-text">{errorMsg}</p>}

      {/* Search */}
      <div className="users-toolbar">
        <input
          className="users-search"
          type="text"
          placeholder="Search by name, email or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-secondary btn-small" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="users-loading">Loading users…</p>
      ) : filtered.length === 0 ? (
        <p className="users-empty">
          {search ? 'No users match your search.' : 'No users found. Add one!'}
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => (
                <tr key={user.id ?? index}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="user-cell-name">
                      <div className="user-avatar user-avatar-sm">
                        {(user.name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      {user.name || '—'}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="pill pill-soft">
                      {user.role || `Role ${user.role_id}` || 'User'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        user.isActive !== false
                          ? 'pill pill-green'
                          : 'pill pill-red'
                      }
                    >
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {/* Edit button */}
                      <button
                        className="btn-secondary btn-small"
                        onClick={() =>
                          navigate('/user-form', { state: { user } })
                        }
                      >
                        ✏️ Edit
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        className={
                          user.isActive !== false
                            ? 'btn-danger btn-small'
                            : 'btn-success btn-small'
                        }
                        disabled={togglingId === user.id}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {togglingId === user.id
                          ? '…'
                          : user.isActive !== false
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Users
