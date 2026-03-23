import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext.jsx'

function ProtectedRoute({ children, requiredRoleIds }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user)   return <Navigate to="/login" replace />

  if (requiredRoleIds && !requiredRoleIds.includes(user.role_id)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRoleIds={[1]}>
      {children}
    </ProtectedRoute>
  )
}

export function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user)   return <Navigate to="/login" replace />

  const roleId = Number(user.role_id)
  const role   = (user.role || "").toLowerCase().replace(/\s/g, "")
  const isSuperAdmin = roleId === 5 || role === "superadmin"

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default ProtectedRoute



