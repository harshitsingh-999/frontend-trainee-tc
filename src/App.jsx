import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Login from './pages/Login.jsx'
import UserForm from './pages/UserForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/AdminUser.jsx'
import ManagerPage from './pages/manager.jsx'
import InternTasks from './pages/interntask.jsx'
import Attendance from './pages/attendence.jsx'
import MyLeaves from './pages/myleaves.jsx'
import LayoutManager from './components/Layout_manager.jsx'
import { useAuth, AdminRoute, SuperAdminRoute } from './context/authcontext.jsx'
import AdminLayout from './pages/Admin/Layout.jsx'
import SuperAdmin from './pages/SuperAdmin/SuperAdmin.jsx'
import AdminDashboard from './pages/Admin/Dashboard.jsx'
import UsersList from './pages/Admin/UsersList.jsx'
import CreateUser from './pages/Admin/CreateUser.jsx'
import ProjectProgress from './pages/ProjectProgress.jsx'
import Calendar from "./pages/Calender.jsx";

const SUPERADMIN_EMAILS = [
  'superadmin@company.com',
  'superadmin@teamcomputers.com',
]

const isSuperAdminUser = (user) => {
  if (!user) return false
  const roleId = Number(user.role_id)
  const role = (user.role || '').toLowerCase().replace(/\s/g, '')
  const email = (user.email || '').toLowerCase()
  return (
    roleId === 0 || roleId === 5 || roleId === 6 || roleId === 7 ||
    role === 'superadmin' || role === 'super_admin' ||
    SUPERADMIN_EMAILS.includes(email)
  )
}

const isAdminUser = (user) => {
  if (!user) return false
  const roleId = Number(user.role_id)
  const role = (user.role || '').toLowerCase()
  return (roleId === 1 || role === 'admin') && !isSuperAdminUser(user)
}

const getRedirectPath = (user) => {
  if (!user) return '/login'
  if (isSuperAdminUser(user)) return '/superadmin'
  if (isAdminUser(user)) return '/admin/dashboard'
  return '/dashboard'
}

// Uses the real AuthContext — works for Manager, Intern, Buddy roles
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 30 }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <LayoutManager>{children}</LayoutManager>
}

function App() {
  // Read user from real AuthContext for redirect logic
  const { user, login: ctxLogin, logout: ctxLogout, loading } = useAuth()

  // Login handler: call AuthContext login so all consumers stay in sync
  const handleLogin = (apiUser) => {
    if (!apiUser) return
    const email = (apiUser.email || '').toLowerCase()
    const roleIdRaw =
      apiUser.role_id !== undefined && apiUser.role_id !== null
        ? Number(apiUser.role_id)
        : apiUser.role?.id !== undefined
          ? Number(apiUser.role.id)
          : undefined
    const roleId = Number.isNaN(roleIdRaw) ? undefined : roleIdRaw
    const isSuperByEmail = SUPERADMIN_EMAILS.includes(email)
    const finalRoleId = isSuperByEmail ? 0 : roleId
    const ROLE_MAP = { 0: 'SuperAdmin', 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern', 5: 'SuperAdmin', 6: 'SuperAdmin', 7: 'SuperAdmin' }
    const role = ROLE_MAP[finalRoleId] || apiUser.role_name || 'User'
    const u = { id: apiUser.id, name: apiUser.name || 'Team Member', email, role, role_id: finalRoleId }
    ctxLogin(u)
    return u
  }

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={
          <Login
            onLogin={handleLogin}
            isAuthenticated={!!user}
            currentUser={user}
            getRedirectPath={getRedirectPath}
          />
        } />
        
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />


        {/* Root redirect */}
        <Route path="/" element={<Navigate to={user ? getRedirectPath(user) : '/login'} replace />} />

        {/* Manager / Intern / Buddy routes — all use Layout_manager */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute><ManagerPage /></ProtectedRoute>} />
        <Route path="/my-tasks" element={<ProtectedRoute><InternTasks /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/my-leaves" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
        <Route path="/user-form" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/project-progress" element={<ProtectedRoute><ProjectProgress /></ProtectedRoute>} />


        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="create-user" element={<CreateUser />} />
        </Route>

        {/* SuperAdmin routes */}
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
        <Route path="/superadmin/*" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  )
}

export default App
