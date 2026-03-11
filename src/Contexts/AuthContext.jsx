import React, { createContext, useContext } from "react";
import { Navigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ─────────────────────────────────────────────────────
  // 🔧 DEVELOPMENT: hardcoded admin user (no login needed)
  // 🔀 MERGE DAY: replace these 2 lines with:
  //
  //   const token = localStorage.getItem("authToken");
  //   const user = localStorage.getItem("user")
  //     ? JSON.parse(localStorage.getItem("user"))
  //     : null;
  //
  // Everything else stays exactly the same ✅
  // ─────────────────────────────────────────────────────
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  return (
    <AuthContext.Provider value={{ user, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const SuperAdminRoute = ({ children }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) return <Navigate to="/login" replace />;

  const roleId = Number(user.role_id);
  const isSuperAdmin =
    user.role?.toLowerCase?.().includes('superadmin') ||
    user.role?.toLowerCase?.() === 'super admin' ||
    roleId === 0 || 
    roleId === 6 || 
    roleId === 7;

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

// ✅ AdminRoute — used in App.jsx to protect /admin routes
// 🔧 DEVELOPMENT: always allows access (user is always admin)
// 🔀 MERGE DAY: this works automatically once real user is in localStorage
export const AdminRoute = ({ children }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) return <Navigate to="/login" replace />;

  const roleId = Number(user.role_id);
  const isAdmin =
    user.role === "admin" ||
    user.role === "Admin" ||
    roleId === 1;

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};
