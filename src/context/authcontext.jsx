import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient from "../api/axiosClient.js";

const AuthContext = createContext(null);
const SESSION_STORAGE_KEY = "authSession";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  profile_picture: apiUser.profile_picture || null,
});

const toIsoString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const createDefaultSessionExpiry = () => new Date(Date.now() + ONE_DAY_MS).toISOString();

const normalizeSession = (source = {}, fallbackSession = null) => {
  const refreshTokenExpiresAt =
    toIsoString(source.refreshTokenExpiresAt) ||
    toIsoString(fallbackSession?.refreshTokenExpiresAt) ||
    createDefaultSessionExpiry();

  const accessTokenExpiresAt =
    toIsoString(source.accessTokenExpiresAt) ||
    refreshTokenExpiresAt;

  return {
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
};

const persistUser = (nextUser) => {
  localStorage.setItem("user", JSON.stringify(nextUser));
};

const persistToken = (token) => {
  if (!token) return;
  localStorage.setItem("token", token);
  localStorage.setItem("authToken", token);
};

const persistSession = (nextSession) => {
  if (nextSession?.accessTokenExpiresAt || nextSession?.refreshTokenExpiresAt) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    return;
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
};

const getPersistedToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

const getPersistedSession = () => {
  try {
    const value = localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const clearPersistedAuth = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(getPersistedSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getPersistedToken();
    const persistedSession = getPersistedSession();

    if (!token) {
      setUser(null);
      setSession(null);
      clearPersistedAuth();
      setLoading(false);
      return;
    }

    axiosClient
      .get("/auth/me", { params: { _ts: Date.now() } })
      .then((res) => {
        const payload = res?.data?.data || {};
        const normalizedUser = normalizeUser(payload);
        const normalizedSession = normalizeSession(payload, persistedSession);
        setUser(normalizedUser);
        setSession(normalizedSession);
        persistUser(normalizedUser);
        persistSession(normalizedSession);
      })
      .catch(() => {
        setUser(null);
        setSession(null);
        clearPersistedAuth();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (apiUser, authMeta = {}) => {
    const normalizedUser = normalizeUser(apiUser);
    const normalizedSession = normalizeSession(authMeta);

    persistToken(authMeta?.token);
    setUser(normalizedUser);
    setSession(normalizedSession);
    persistUser(normalizedUser);
    persistSession(normalizedSession);
    toast.success(`Welcome back, ${normalizedUser.name}!`);
    return normalizedUser;
  };

  const refreshSession = async ({ showToast = true } = {}) => {
    const res = await axiosClient.post("/auth/refresh");
    const payload = res?.data?.data || {};
    const nextUser = normalizeUser(payload?.user || payload);
    const nextSession = normalizeSession(payload, session);

    persistToken(payload?.token || payload?.accessToken);
    setUser(nextUser);
    setSession(nextSession);
    persistUser(nextUser);
    persistSession(nextSession);

    if (showToast) {
      toast.success("Session refreshed successfully");
    }

    return { user: nextUser, session: nextSession };
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {
      // Clear local state even if the API call fails.
    }

    setUser(null);
    setSession(null);
    clearPersistedAuth();
    toast.success("Logged out successfully");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    persistUser(updatedUser);
  };

  useEffect(() => {
    const expiresAt = session?.refreshTokenExpiresAt;
    if (!expiresAt) return undefined;

    const expiresAtMs = new Date(expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs)) return undefined;

    const timeoutMs = expiresAtMs - Date.now();
    const expireSession = () => {
      setUser(null);
      setSession(null);
      clearPersistedAuth();
      toast.error("Session expired. Please log in again.");
    };

    if (timeoutMs <= 0) {
      expireSession();
      return undefined;
    }

    const timerId = window.setTimeout(expireSession, timeoutMs);
    return () => window.clearTimeout(timerId);
  }, [session?.refreshTokenExpiresAt]);

  return (
    <AuthContext.Provider value={{ user, session, login, logout, loading, updateUser, refreshSession }}>
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
