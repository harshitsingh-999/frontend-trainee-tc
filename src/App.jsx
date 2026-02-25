import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import UserForm from './pages/UserForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Layout from './components/Layout.jsx'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (formValues) => {
    setUser({
      name: formValues.employeeId || 'Team Member',
      role: formValues.role,
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
          <Layout user={user} onLogout={handleLogout}>
            <UserForm />
          </Layout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Layout user={user} onLogout={handleLogout}>
            <Dashboard user={user} />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

