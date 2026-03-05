import { createContext, useContext } from "react";
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
  const token = "mock-token-dev";
  const user = {
    id: 1,
    name: "Admin User",
    email: "admin@company.com",
    role: "admin",
    role_id: 1
  };

  return (
    <AuthContext.Provider value={{ user, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ✅ AdminRoute — used in App.jsx to protect /admin routes
// 🔧 DEVELOPMENT: always allows access (user is always admin)
// 🔀 MERGE DAY: this works automatically once real user is in localStorage
export const AdminRoute = ({ children }) => {
  // Get real user from localStorage if available, else use mock
  const storedUser = localStorage.getItem("user");
  const user = storedUser
    ? JSON.parse(storedUser)
    : { role: "admin", role_id: 1 }; // mock fallback during dev

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin =
    user.role === "admin" ||
    user.role === "Admin" ||
    user.role_id === 1;

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};
