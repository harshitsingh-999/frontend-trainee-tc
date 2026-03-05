import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import UserForm from './pages/UserForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Layout from './components/Layout.jsx'
import { AdminRoute } from './Contexts/AuthContext.jsx'
import AdminLayout from './pages/Admin/Layout.jsx'
import AdminDashboard from './pages/Admin/Dashboard.jsx'
import CreateUser from './pages/Admin/CreateUser.jsx'
import UsersList from './pages/Admin/UsersList.jsx'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
  }

  if (loading) {
    return <div>Loading...</div>
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

      {/* Admin Routes - Protected for Admin users only */}
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

