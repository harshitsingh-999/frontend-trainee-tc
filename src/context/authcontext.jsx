// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/login_api.js";
import { Navigate } from "react-router-dom";

const AuthContext = createContext(null);

const SUPERADMIN_EMAILS = [
  'superadmin@company.com',
  'superadmin@teamcomputers.com',
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(true); // true while checking session

  // On app load, call /me to restore session from cookie
  useEffect(() => {
    api.get("/auth/me", { params: { _ts: Date.now() } })
      .then((res) => {
        const u = res.data.data;
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          role_id: u.role_id,
          role: u.role_name || "User",
        });
      })
      .catch(() => {
        setUser(null); // Not logged in, cookie missing or expired
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (apiUser) => {
    setUser({
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role_id: apiUser.role_id,
      role: apiUser.role_name || "User",
    });
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — use this in any component
export function useAuth() {
  return useContext(AuthContext);
}
