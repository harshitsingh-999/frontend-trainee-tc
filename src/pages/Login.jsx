import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

const roles = ['Admin', 'Manager', 'Intern', 'Trainee', 'Buddy']

function Login({ onLogin, isAuthenticated }) {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({
    employeeId: '',
    role: 'Intern',
  })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onLogin(formValues)
    navigate('/dashboard')
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
            <label htmlFor="employeeId">Employee / Intern ID</label>
            <input
              id="employeeId"
              name="employeeId"
              type="text"
              placeholder="TC-00123"
              value={formValues.employeeId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formValues.role}
              onChange={handleChange}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Login
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

