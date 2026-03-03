import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

const roles = ['Admin', 'Manager', 'Intern', 'Trainee', 'Buddy']

function Login({ onLogin, isAuthenticated }) {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axiosClient.post('/api/v1/auth/login', {
        email: formValues.email,
        password: formValues.password,
      })

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Call parent's onLogin
        onLogin(response.data.user)
        
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
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

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              value={formValues.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formValues.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="login-footer">
          TeamComputers · People · Process · Technology
        </p>
      </div>
    </div>
  )
}

export default Login

