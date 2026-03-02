import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import UserForm from './pages/UserForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Layout from './components/Layout.jsx'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (apiUser) => {
    setUser({
      id: apiUser.id,
      name: apiUser.name || 'Team Member',
      email: apiUser.email,
      role: apiUser.role_id ? `Role ${apiUser.role_id}` : 'User',
    })
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
      />
      <Route
        path="/"
        element={
          <Layout user={user} onLogout={handleLogout}>
            <Navigate to={user ? '/dashboard' : '/login'} replace />
          </Layout>
        }
      />
      <Route
        path="/user-form"
        element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <UserForm />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
