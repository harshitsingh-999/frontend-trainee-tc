import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosClient from "../api/axiosClient.js";

const AuthContext = createContext(null);

const SUPERADMIN_EMAILS = [
  "superadmin@company.com",
  "superadmin@teamcomputers.com",
];

const normalizeUser = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  role_id: apiUser.role_id,
  role: apiUser.role_name || apiUser.role || "User",
});

const persistUser = (nextUser) => {
  localStorage.setItem("user", JSON.stringify(nextUser));
};

const getPersistedToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

const clearPersistedUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getPersistedToken();

    if (!token) {
      setUser(null);
      clearPersistedUser();
      setLoading(false);
      return;
    }

    axiosClient
      .get("/auth/me", { params: { _ts: Date.now() } })
      .then((res) => {
        const normalizedUser = normalizeUser(res.data.data);
        setUser(normalizedUser);
        persistUser(normalizedUser);
      })
      .catch(() => {
        setUser(null);
        clearPersistedUser();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (apiUser) => {
    const normalizedUser = normalizeUser(apiUser);
    setUser(normalizedUser);
    persistUser(normalizedUser);
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {
      // Clear local state even if the API call fails.
    }

    setUser(null);
    clearPersistedUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

const isSuperAdminUser = (user) => {
  if (!user) return false;

  const roleId = Number(user.role_id);
  const role = (user.role || "").toLowerCase().replace(/\s/g, "");
  const email = (user.email || "").toLowerCase();

  return (
    roleId === 0 ||
    roleId === 5 ||
    roleId === 6 ||
    roleId === 7 ||
    role === "superadmin" ||
    role === "super_admin" ||
    SUPERADMIN_EMAILS.includes(email)
  );
};

const isAdminUser = (user) => {
  if (!user) return false;

  const roleId = Number(user.role_id);
  const role = (user.role || "").toLowerCase().replace(/\s/g, "");

  return (roleId === 1 || role === "admin") && !isSuperAdminUser(user);
};

export const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdminUser(user)) return <Navigate to="/" replace />;

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdminUser(user)) return <Navigate to="/" replace />;

  return children;
};
