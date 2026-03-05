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

export default ProtectedRoute





// ----------------------- IMPORTANT: DO NOT SUGGEST CODE DELETIONS -----------------------

// src/components/ProtectedRoute.jsx


// import React from "react";
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/authcontext";

// function ProtectedRoute({ children, requiredRole }) {
//   const { user, loading } = useAuth();

//   // Show nothing while checking session (avoids flash to /login)
//   if (loading) {
//     return <div className="loading-screen">Loading...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // Optional role guard — pass requiredRole="Admin" to restrict a page
//   if (requiredRole && user.role !== requiredRole) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// }

// export default ProtectedRoute;