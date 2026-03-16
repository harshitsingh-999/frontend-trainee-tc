import React, { createContext, useContext } from "react";
import { Navigate } from "react-router-dom";

const AuthContext = createContext();

const SUPERADMIN_EMAILS = [
  'superadmin@company.com',
  'superadmin@teamcomputers.com',
]

export const AuthProvider = ({ children }) => {
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
  const role = (user.role || '').toLowerCase().replace(/\s/g, '');
  const email = (user.email || '').toLowerCase();

  const isSuperAdmin =
    roleId === 0 ||
    roleId === 5 ||
    roleId === 6 ||
    roleId === 7 ||
    role === 'superadmin' ||
    role === 'super_admin' ||
    SUPERADMIN_EMAILS.includes(email);

  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return children;
};

export const AdminRoute = ({ children }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) return <Navigate to="/login" replace />;

  const roleId = Number(user.role_id);
  const role = (user.role || '').toLowerCase().replace(/\s/g, '');
  const email = (user.email || '').toLowerCase();

  // SuperAdmin should NOT be redirected to admin panel
  const isSuperAdmin =
    roleId === 0 || roleId === 6 || roleId === 7 ||
    role === 'superadmin' || SUPERADMIN_EMAILS.includes(email);

  const isAdmin = (roleId === 1 || role === 'admin') && !isSuperAdmin;

  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};