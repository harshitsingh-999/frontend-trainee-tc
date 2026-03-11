import { useEffect } from 'react'
import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import UserForm from './pages/UserForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/AdminUser.jsx'
import Layout from './components/Layout.jsx'
import { AdminRoute, SuperAdminRoute } from './Contexts/AuthContext.jsx'
import AdminLayout from './pages/Admin/Layout.jsx'
import SuperAdmin from './pages/SuperAdmin/SuperAdmin.jsx'
import AdminDashboard from './pages/Admin/Dashboard.jsx'
import UsersList from './pages/Admin/UsersList.jsx'
import CreateUser from './pages/Admin/CreateUser.jsx'

// Map numeric role IDs to friendly names (adjust to match your backend)
const ROLE_MAP = {
  0: 'SuperAdmin',
  1: 'Admin',
  2: 'Manager',
  3: 'Buddy',
  4: 'Intern',
  5: 'Trainee',
}
const SUPERADMIN_EMAILS = ['superadmin@company.com']

function App() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = (apiUser) => {
    if (!apiUser) return

    const email = (apiUser.email || '').toLowerCase()

    const roleFromApi =
      typeof apiUser.role === 'string'
        ? apiUser.role
        : apiUser.role?.role_name

    const roleIdRaw =
      apiUser.role_id !== undefined && apiUser.role_id !== null
        ? Number(apiUser.role_id)
        : apiUser.role?.id !== undefined && apiUser.role?.id !== null
        ? Number(apiUser.role.id)
        : apiUser.role?.role_id !== undefined && apiUser.role?.role_id !== null
        ? Number(apiUser.role.role_id)
        : undefined
    const roleId = Number.isNaN(roleIdRaw) ? undefined : roleIdRaw

    const isSuperAdminByEmail = SUPERADMIN_EMAILS.includes(email)
    const enforcedRoleId = isSuperAdminByEmail ? 0 : roleId
    const enforcedRole = isSuperAdminByEmail ? 'SuperAdmin' : roleFromApi

    const role =
      enforcedRole ||
      ROLE_MAP[enforcedRoleId] ||
      (enforcedRoleId !== undefined ? `Role ${enforcedRoleId}` : undefined) ||
      'User'
    const u = {
      id: apiUser.id,
      name: apiUser.name || 'Team Member',
      email,
      role,
      role_id: enforcedRoleId,
    }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const ProtectedRoute = ({ children }) =>
    user ? (
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    ) : (
      <Navigate to="/login" replace />
    )

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-form"
        element={
          <ProtectedRoute>
            <UserForm />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="create-user" element={<CreateUser />} />
      </Route>

      {/* SuperAdmin Routes */}
      {/* <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdmin />
          </SuperAdminRoute>
        }
      /> */}
      <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdmin />
          </SuperAdminRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdmin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App





// ---------------------------------------- //

// import React, { useState, useEffect } from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'
// import Login from './pages/Login.jsx'
// import Dashboard from './pages/Dashboard.jsx'
// import AdminUsers from './pages/AdminUser.jsx'
// import Layout from './components/Layout.jsx'

// function App() {
//   const [user, setUser] = useState(null)

//   // Keep user logged in on page refresh
//   useEffect(() => {
//     const stored = localStorage.getItem('user')
//     if (stored) setUser(JSON.parse(stored))
//   }, [])

//   const handleLogin = (apiUser, token) => {
//     const u = {
//       id:    apiUser.id,
//       name:  apiUser.name  || 'Team Member',
//       email: apiUser.email,
//       role:  apiUser.role?.role_name || `Role ${apiUser.role_id}`,
//     }
//     localStorage.setItem('token', token)
//     localStorage.setItem('user', JSON.stringify(u))
//     setUser(u)
//   }

//   const handleLogout = () => {
//     localStorage.removeItem('token')
//     localStorage.removeItem('user')
//     setUser(null)
//   }

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
//       />
//       <Route
//         path="/dashboard"
//         element={
//           user ? (
//             <Layout user={user} onLogout={handleLogout}>
//               <Dashboard user={user} />
//             </Layout>
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />
//       <Route
//         path="/admin/users"
//         element={
//           user ? (
//             <Layout user={user} onLogout={handleLogout}>
//               <AdminUsers />
//             </Layout>
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />
//       <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }

// export default App
