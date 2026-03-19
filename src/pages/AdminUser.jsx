

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
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.msg
      if (backendMessage) {
        const status = err?.response?.status
        setErrorMsg(status ? `${backendMessage} (HTTP ${status})` : backendMessage)
      } else if (err?.response?.status) {
        setErrorMsg(`Failed to update status (HTTP ${err.response.status}).`)
      } else {
        setErrorMsg('Failed to update status.')
      }
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
