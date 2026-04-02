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
import LeaveApproval from './pages/LeaveApproval.jsx'
import LayoutManager from './components/Layout_manager.jsx'
import { useAuth, AdminRoute, SuperAdminRoute } from './context/authcontext.jsx'
import AdminLayout from './pages/Admin/Layout.jsx'
import SuperAdmin from './pages/SuperAdmin/SuperAdmin.jsx'
import AdminDashboard from './pages/Admin/Dashboard.jsx'
import UsersList from './pages/Admin/UsersList.jsx'
import CreateUser from './pages/Admin/CreateUser.jsx'
import DocumentApproval from './pages/Admin/DocumentApproval.jsx'
import ProjectProgress from './pages/ProjectProgress.jsx'
import Calendar from './pages/Calender.jsx'
import ForgotPassword from './pages/Auth/forgotpassword.jsx'
import ResetPassword from './pages/Auth/resetpassword.jsx'
import DailyReport from './pages/dailyreports.jsx'
import ManagerDailyReports from './pages/ManagerDailyReports.jsx'
import Notification from './pages/notification.jsx'

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

// ── Branded loading screen ──────────────────────────────────
function AppLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #00b1b4 0%, #00c9b1 40%, #b8e063 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: '#ffd34d',
          color: '#003b5c',
          fontWeight: 800,
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          t:
        </div>
        <div>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: '#fff',
          }}>
            TeamComputers
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            Intern Management
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#fff',
            opacity: 0.9,
            animation: `tcBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes tcBounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
          40%            { transform: translateY(-10px); opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader />
  if (!user) return <Navigate to="/login" replace />
  return <LayoutManager>{children}</LayoutManager>
}

function App() {
  const { user, login: ctxLogin, logout: ctxLogout, loading } = useAuth()

  const handleLogin = (apiUser, authMeta = {}) => {
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
    return ctxLogin(u, authMeta)
  }

  if (loading) return <AppLoader />

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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/daily-report" element={<ProtectedRoute><DailyReport /></ProtectedRoute>} />
        <Route path="/manager/daily-reports" element={<ProtectedRoute><ManagerDailyReports /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notification /></ProtectedRoute>} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={user ? getRedirectPath(user) : '/login'} replace />} />

        {/* Manager / Intern / Buddy routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute><ManagerPage /></ProtectedRoute>} />
        <Route path="/my-tasks" element={<ProtectedRoute><InternTasks /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/my-leaves" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
        <Route path="/user-form" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/project-progress" element={<ProtectedRoute><ProjectProgress /></ProtectedRoute>} />
        <Route path="/leaves/approval" element={<ProtectedRoute><LeaveApproval /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="documents" element={<DocumentApproval />} />
          <Route path="leaves" element={<LeaveApproval />} />
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



// import React from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'

// import Login from './pages/Login.jsx'
// import UserForm from './pages/UserForm.jsx'
// import Dashboard from './pages/Dashboard.jsx'
// import Users from './pages/AdminUser.jsx'
// import ManagerPage from './pages/manager.jsx'
// import InternTasks from './pages/interntask.jsx'
// import Attendance from './pages/attendence.jsx'
// import MyLeaves from './pages/myleaves.jsx'
// import LayoutManager from './components/Layout_manager.jsx'
// import { useAuth, AdminRoute, SuperAdminRoute } from './context/authcontext.jsx'
// import AdminLayout from './pages/Admin/Layout.jsx'
// import SuperAdmin from './pages/SuperAdmin/SuperAdmin.jsx'
// import AdminDashboard from './pages/Admin/Dashboard.jsx'
// import UsersList from './pages/Admin/UsersList.jsx'
// import CreateUser from './pages/Admin/CreateUser.jsx'
// import DocumentApproval from './pages/Admin/DocumentApproval.jsx'
// import ProjectProgress from './pages/ProjectProgress.jsx'
// import Calendar from "./pages/Calender.jsx";
// import ForgotPassword from './pages/Auth/forgotpassword.jsx'
// import ResetPassword from './pages/Auth/resetpassword.jsx'
// import DailyReport from './pages/dailyreports.jsx'
// import ManagerDailyReports from './pages/ManagerDailyReports.jsx'
// import Notification from './pages/notification.jsx'

// const SUPERADMIN_EMAILS = [
//   'superadmin@company.com',
//   'superadmin@teamcomputers.com',
// ]

// const isSuperAdminUser = (user) => {
//   if (!user) return false
//   const roleId = Number(user.role_id)
//   const role = (user.role || '').toLowerCase().replace(/\s/g, '')
//   const email = (user.email || '').toLowerCase()
//   return (
//     roleId === 0 || roleId === 5 || roleId === 6 || roleId === 7 ||
//     role === 'superadmin' || role === 'super_admin' ||
//     SUPERADMIN_EMAILS.includes(email)
//   )
// }

// const isAdminUser = (user) => {
//   if (!user) return false
//   const roleId = Number(user.role_id)
//   const role = (user.role || '').toLowerCase()
//   return (roleId === 1 || role === 'admin') && !isSuperAdminUser(user)
// }

// const getRedirectPath = (user) => {
//   if (!user) return '/login'
//   if (isSuperAdminUser(user)) return '/superadmin'
//   if (isAdminUser(user)) return '/admin/dashboard'
//   return '/dashboard'
// }

// // Uses the real AuthContext — works for Manager, Intern, Buddy roles
// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth()
//   if (loading) return <div style={{ padding: 30 }}>Loading...</div>
//   if (!user) return <Navigate to="/login" replace />
//   return <LayoutManager>{children}</LayoutManager>
// }

// function App() {
//   // Read user from real AuthContext for redirect logic
//   const { user, login: ctxLogin, logout: ctxLogout, loading } = useAuth()

//   // Login handler: call AuthContext login so all consumers stay in sync
//   const handleLogin = (apiUser, authMeta = {}) => {
//     if (!apiUser) return
//     const email = (apiUser.email || '').toLowerCase()
//     const roleIdRaw =
//       apiUser.role_id !== undefined && apiUser.role_id !== null
//         ? Number(apiUser.role_id)
//         : apiUser.role?.id !== undefined
//           ? Number(apiUser.role.id)
//           : undefined
//     const roleId = Number.isNaN(roleIdRaw) ? undefined : roleIdRaw
//     const isSuperByEmail = SUPERADMIN_EMAILS.includes(email)
//     const finalRoleId = isSuperByEmail ? 0 : roleId
//     const ROLE_MAP = { 0: 'SuperAdmin', 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern', 5: 'SuperAdmin', 6: 'SuperAdmin', 7: 'SuperAdmin' }
//     const role = ROLE_MAP[finalRoleId] || apiUser.role_name || 'User'
//     const u = { id: apiUser.id, name: apiUser.name || 'Team Member', email, role, role_id: finalRoleId }
//     return ctxLogin(u, authMeta)
//   }

//   if (loading) return <div style={{ padding: 30 }}>Loading...</div>

//   return (
//     <>
//       <Routes>
//         {/* Public */}
//         <Route path="/login" element={
//           <Login
//             onLogin={handleLogin}
//             isAuthenticated={!!user}
//             currentUser={user}
//             getRedirectPath={getRedirectPath}
//           />
//         } />
        
//         <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />
//         <Route path="/daily-report" element={<ProtectedRoute><DailyReport /></ProtectedRoute>} />
//         <Route path="/manager/daily-reports" element={<ProtectedRoute><ManagerDailyReports /></ProtectedRoute>} />
//         <Route path="/notifications" element={<ProtectedRoute><Notification /></ProtectedRoute>} />

//         {/* Root redirect */}
//         <Route path="/" element={<Navigate to={user ? getRedirectPath(user) : '/login'} replace />} />

//         {/* Manager / Intern / Buddy routes — all use Layout_manager */}
//         <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
//         <Route path="/manager" element={<ProtectedRoute><ManagerPage /></ProtectedRoute>} />
//         <Route path="/my-tasks" element={<ProtectedRoute><InternTasks /></ProtectedRoute>} />
//         <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
//         <Route path="/my-leaves" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
//         <Route path="/user-form" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
//         <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
//         <Route path="/project-progress" element={<ProtectedRoute><ProjectProgress /></ProtectedRoute>} />


//         {/* Admin routes */}
//         <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
//           <Route index element={<Navigate to="dashboard" replace />} />
//           <Route path="dashboard" element={<AdminDashboard />} />
//           <Route path="users" element={<UsersList />} />
//           <Route path="create-user" element={<CreateUser />} />
//           <Route path="documents" element={<DocumentApproval />} />
//         </Route>

//         {/* SuperAdmin routes */}
//         <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
//         <Route path="/superadmin/*" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

//         {/* Fallback */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//       <Toaster position="top-center" reverseOrder={false} />
//     </>
//   )
// }

// export default App