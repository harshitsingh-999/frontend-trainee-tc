import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import UserForm from './pages/UserForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/AdminUser.jsx'
import Layout from './components/Layout.jsx'

// Map numeric role IDs to friendly names (adjust to match your backend)
const ROLE_MAP = {
  1: 'Admin',
  2: 'Manager',
  3: 'Buddy',
  4: 'Intern',
  5: 'Trainee',
}

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (apiUser) => {
    if (!apiUser) return

    const roleFromApi =
      typeof apiUser.role === 'string'
        ? apiUser.role
        : apiUser.role?.role_name

    const role =
      roleFromApi ||
      ROLE_MAP[apiUser.role_id] ||
      `Role ${apiUser.role_id}` ||
      'User'
    setUser({
      id: apiUser.id,
      name: apiUser.name || 'Team Member',
      email: apiUser.email,
      role,
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
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
