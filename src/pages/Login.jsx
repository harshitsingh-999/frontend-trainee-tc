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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const res = await api.post('/users/login', {
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
      })

      onLogin(res.data.data)
      navigate('/dashboard')
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Login failed')
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
  )
}

export default Login
