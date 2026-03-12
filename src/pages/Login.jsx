import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api/api'

function Login({ onLogin, isAuthenticated }) {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getRedirectPath = (user) => {
    const role = user?.role?.toString?.().toLowerCase?.() || ''
    const roleId = Number(user?.role_id)

    if (role.includes('superadmin') || role === 'super admin' || roleId === 0) {
      return '/superadmin/dashboard'
    }
    if (role === 'admin' || roleId === 1) {
      return '/admin/dashboard'
    }
    return '/dashboard'
  }

  if (isAuthenticated) {
    const storedUser = localStorage.getItem('user')
    const parsedUser = storedUser ? JSON.parse(storedUser) : null
    return <Navigate to={getRedirectPath(parsedUser)} replace />
  }

  // const { user, login } = useAuth();
  // const navigate = useNavigate();
  // const [formValues, setFormValues] = useState({ email: "", password: "" });
  // const [errorMsg, setErrorMsg] = useState("");
  // const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const res = await api.post('/auth/login', {
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
      })

      const apiUser =
        res?.data?.user ||
        res?.data?.data?.user ||
        res?.data?.data ||
        null

      if (!apiUser) {
        throw new Error('Login succeeded but no user data was returned.')
      }

      const resolvedUser =
        apiUser?.user && typeof apiUser.user === 'object'
          ? apiUser.user
          : apiUser

      const token =
        res?.data?.token ||
        res?.data?.data?.token ||
        res?.data?.data?.accessToken ||
        res?.data?.accessToken ||
        null

      if (token) {
        localStorage.setItem('token', token)
      }

      onLogin(resolvedUser)
      navigate(getRedirectPath(resolvedUser))
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.msg

      if (backendMessage) {
        setErrorMsg(backendMessage)
      } else if (error?.response?.status) {
        setErrorMsg(`Login failed (HTTP ${error.response.status})`)
      } else {
        setErrorMsg(error.message || 'Login failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-mark">t:</div>
          <div className="login-text">
            <span className="login-name">teamComputers</span>
            <span className="login-subtitle">Intern Management</span>
          </div>
        </div>
        <h2 className="login-title">Welcome back</h2>
        <p className="login-description">
          Sign in to manage interns, buddies, and training progress.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Official Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@teamcomputers.com"
              value={formValues.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange}
              required
            />
          </div>

          {errorMsg ? <p className="error-text">{errorMsg}</p> : null}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="login-footer">TeamComputers - People - Process - Technology</p>
      </div>
    </div>
  );
}

export default Login;
