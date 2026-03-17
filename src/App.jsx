import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/authcontext.jsx'

import Login      from './pages/Login.jsx'
import Dashboard  from './pages/Dashboard.jsx'
import UserForm   from './pages/UserForm.jsx'
import Attendance from './pages/attendence.jsx'
import Manager    from './pages/manager.jsx'
import InternTasks from './pages/interntask.jsx'
import MyLeaves   from './pages/myleaves.jsx'

import AdminLayout    from './pages/Admin/Layout.jsx'
import AdminDashboard from './pages/Admin/Dashboard.jsx'
import UsersList      from './pages/Admin/UsersList.jsx'
import CreateUser     from './pages/Admin/CreateUser.jsx'
import SuperAdmin     from './pages/SuperAdmin/SuperAdmin.jsx'

import Layout from './components/Layout_manager.jsx'
import ProtectedRoute, { AdminRoute, SuperAdminRoute } from './components/proctedroutes.jsx'

// ── Role ID map — add any role_id your backend uses ──
const ROLE_MAP = {
  0: 'SuperAdmin',
  1: 'Admin',
  2: 'Manager',
  3: 'Buddy',
  4: 'Intern',
  5: 'SuperAdmin',  // fallback in case backend uses 5 for SuperAdmin
  6: 'SuperAdmin',  // fallback in case backend uses 6
  7: 'SuperAdmin',  // fallback in case backend uses 7
}

// ── Hardcoded SuperAdmin emails as safety net ──
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
    roleId === 0 ||
    roleId === 5 ||
    roleId === 6 ||
    roleId === 7 ||
    role === 'superadmin' ||
    role === 'super_admin' ||
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

function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading…</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/my-tasks" element={
        <ProtectedRoute requiredRoleIds={[4]}>
          <Layout><InternTasks /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-leaves" element={
        <ProtectedRoute requiredRoleIds={[4]}>
          <Layout><MyLeaves /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout><Attendance /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/manager" element={
        <ProtectedRoute requiredRoleIds={[1, 2]}>
          <Layout><Manager /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/user-form" element={
        <ProtectedRoute requiredRoleIds={[1]}>
          <Layout><UserForm /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<AdminDashboard />} />
        <Route path="users"       element={<UsersList />} />
        <Route path="create-user" element={<CreateUser />} />
      </Route>

      <Route path="/superadmin"   element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
      <Route path="/superadmin/*" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App


// ---------------------------------- //

// import React from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'
// import { useAuth } from './context/authcontext.jsx'

// // Shared pages
// import Login      from './pages/Login.jsx'
// import Dashboard  from './pages/Dashboard.jsx'
// import UserForm   from './pages/UserForm.jsx'
// import Attendance from './pages/attendence.jsx'

// // Your pages
// import Manager    from './pages/manager.jsx'
// import InternTasks from './pages/interntask.jsx'
// import MyLeaves   from './pages/myleaves.jsx'

// // Coworker's admin pages
// import AdminLayout    from './pages/Admin/Layout.jsx'
// import AdminDashboard from './pages/Admin/Dashboard.jsx'
// import UsersList      from './pages/Admin/UsersList.jsx'
// import CreateUser     from './pages/Admin/CreateUser.jsx'
// import SuperAdmin     from './pages/SuperAdmin/SuperAdmin.jsx'

// // Layout
// import Layout from './components/Layout_manager.jsx'

// // Guards — all three live in the same file now
// import ProtectedRoute, { AdminRoute, SuperAdminRoute } from './components/proctedroutes.jsx'

// function App() {
//   const { user } = useAuth()

//   return (
//     <Routes>

//       {/* ── Public ── */}
//       <Route
//         path="/login"
//         element={user ? <Navigate to="/dashboard" replace /> : <Login />}
//       />

//       {/* ── Intern routes ── */}
//       <Route path="/my-tasks" element={
//         <ProtectedRoute requiredRoleIds={[4]}>
//           <Layout><InternTasks /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/my-leaves" element={
//         <ProtectedRoute requiredRoleIds={[4]}>
//           <Layout><MyLeaves /></Layout>
//         </ProtectedRoute>
//       } />

//       {/* ── Shared routes (any logged-in user) ── */}
//       <Route path="/attendance" element={
//         <ProtectedRoute>
//           <Layout><Attendance /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/dashboard" element={
//         <ProtectedRoute>
//           <Layout><Dashboard /></Layout>
//         </ProtectedRoute>
//       } />

//       {/* ── Manager routes ── */}
//       <Route path="/manager" element={
//         <ProtectedRoute requiredRoleIds={[1, 2]}>
//           <Layout><Manager /></Layout>
//         </ProtectedRoute>
//       } />

//       {/* ── Admin: register intern (your UserForm) ── */}
//       <Route path="/user-form" element={
//         <ProtectedRoute requiredRoleIds={[1]}>
//           <Layout><UserForm /></Layout>
//         </ProtectedRoute>
//       } />

//       {/* ── Admin panel (coworker's pages, AdminRoute guard) ── */}
//       <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
//         <Route index element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard"   element={<AdminDashboard />} />
//         <Route path="users"       element={<UsersList />} />
//         <Route path="create-user" element={<CreateUser />} />
//       </Route>

//       {/* ── SuperAdmin (coworker's pages, SuperAdminRoute guard) ── */}
//       <Route path="/superadmin"   element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
//       <Route path="/superadmin/*" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

//       {/* ── Root redirect ── */}
//       <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
//       <Route path="*" element={<Navigate to="/" replace />} />

//     </Routes>
//   )
// }

// export default App

// ------------------------------------- //

// import React from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'
// <<<<<<< HEAD
// import { useAuth } from './context/authcontext.jsx'
// import Login          from './pages/Login.jsx'
// import Dashboard      from './pages/Dashboard.jsx'
// import Manager        from './pages/manager.jsx'
// import UserForm       from './pages/UserForm.jsx'
// import Layout         from './components/Layout_manager.jsx'
// import ProtectedRoute from './components/proctedroutes.jsx'
// import Attendance     from './pages/attendence.jsx'
// import InternTasks    from './pages/interntask.jsx'
// import MyLeaves       from './pages/myleaves.jsx'

// function App() {
//   const { user, loading } = useAuth()

//   if (loading) return <div className="loading-screen">Loading…</div>
// =======
// import Login from './pages/Login.jsx'
// import UserForm from './pages/UserForm.jsx'
// import Dashboard from './pages/Dashboard.jsx'
// import Users from './pages/AdminUser.jsx'
// import Layout from './components/Layout.jsx'
// import { AdminRoute, SuperAdminRoute } from './Contexts/AuthContext.jsx'
// import AdminLayout from './pages/Admin/Layout.jsx'
// import SuperAdmin from './pages/SuperAdmin/SuperAdmin.jsx'
// import AdminDashboard from './pages/Admin/Dashboard.jsx'
// import UsersList from './pages/Admin/UsersList.jsx'
// import CreateUser from './pages/Admin/CreateUser.jsx'

// // ── Role ID map — add any role_id your backend uses ──
// const ROLE_MAP = {
//   0: 'SuperAdmin',
//   1: 'Admin',
//   2: 'Manager',
//   3: 'Buddy',
//   4: 'Intern',
//   5: 'SuperAdmin',  // fallback in case backend uses 5 for SuperAdmin
//   6: 'SuperAdmin',  // fallback in case backend uses 6
//   7: 'SuperAdmin',  // fallback in case backend uses 7
// }

// // ── Hardcoded SuperAdmin emails as safety net ──
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
//     roleId === 0 ||
//     roleId === 5 ||
//     roleId === 6 ||
//     roleId === 7 ||
//     role === 'superadmin' ||
//     role === 'super_admin' ||
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

// function App() {
//   const [user, setUser] = useState(() => {
//     const stored = localStorage.getItem('user')
//     return stored ? JSON.parse(stored) : null
//   })

//   const handleLogin = (apiUser) => {
//     if (!apiUser) return

//     const email = (apiUser.email || '').toLowerCase()

//     const roleFromApi =
//       typeof apiUser.role === 'string'
//         ? apiUser.role
//         : apiUser.role?.role_name || ''

//     const roleIdRaw =
//       apiUser.role_id !== undefined && apiUser.role_id !== null
//         ? Number(apiUser.role_id)
//         : apiUser.role?.id !== undefined
//         ? Number(apiUser.role.id)
//         : apiUser.role?.role_id !== undefined
//         ? Number(apiUser.role.role_id)
//         : undefined

//     const roleId = Number.isNaN(roleIdRaw) ? undefined : roleIdRaw

//     // If email matches superadmin list, force role to SuperAdmin
//     const isSuperByEmail = SUPERADMIN_EMAILS.includes(email)
//     const finalRoleId = isSuperByEmail ? 0 : roleId
//     const role = ROLE_MAP[finalRoleId] || roleFromApi || 'User'

//     const u = {
//       id: apiUser.id,
//       name: apiUser.name || 'Team Member',
//       email,
//       role,
//       role_id: finalRoleId,
//     }

//     localStorage.setItem('user', JSON.stringify(u))
//     setUser(u)
//     return u
//   }

//   const handleLogout = () => {
//     localStorage.removeItem('token')
//     localStorage.removeItem('authToken')
//     localStorage.removeItem('user')
//     setUser(null)
//   }
// >>>>>>> 9c98b913d670e8df40727b538e4a65ce7e1a446b

//   const ProtectedRoute = ({ children }) =>
//     user ? (
//       <Layout user={user} onLogout={handleLogout}>
//         {children}
//       </Layout>
//     ) : (
//       <Navigate to="/login" replace />
//     )

//   return (
//     <Routes>
// <<<<<<< HEAD
//       <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

//       <Route path="/my-tasks" element={
//         <ProtectedRoute>
//           <Layout><InternTasks /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/my-leaves" element={
//         <ProtectedRoute requiredRoleIds={[4]}>
//           <Layout><MyLeaves /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/attendance" element={
//         <ProtectedRoute>
//           <Layout><Attendance /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/dashboard" element={
//         <ProtectedRoute>
//           <Layout><Dashboard /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/manager" element={
//         <ProtectedRoute requiredRoleIds={[1, 2]}>
//           <Layout><Manager /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/user-form" element={
//         <ProtectedRoute requiredRoleIds={[1]}>
//           <Layout><UserForm /></Layout>
//         </ProtectedRoute>
//       } />

//       <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
// =======
//       <Route
//         path="/login"
//         element={
//           <Login
//             onLogin={handleLogin}
//             isAuthenticated={!!user}
//             getRedirectPath={getRedirectPath}
//           />
//         }
//       />

//       <Route
//         path="/"
//         element={<Navigate to={user ? getRedirectPath(user) : '/login'} replace />}
//       />

//       {/* Manager / Intern / Buddy routes */}
//       <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
//       <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
//       <Route path="/user-form" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />

//       {/* Admin Routes */}
//       <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
//         <Route index element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard" element={<AdminDashboard />} />
//         <Route path="users" element={<UsersList />} />
//         <Route path="create-user" element={<CreateUser />} />
//       </Route>

//       {/* SuperAdmin Route — flat, no children needed */}
//       <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
//       <Route path="/superadmin/*" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

// >>>>>>> 9c98b913d670e8df40727b538e4a65ce7e1a446b
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }

// <<<<<<< HEAD
// export default App

// export default App
// >>>>>>> 9c98b913d670e8df40727b538e4a65ce7e1a446b
