import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { resetPassword } from '../../api/api'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="error-text">Invalid or missing reset token. Please request a new reset link.</p>
          <Link to="/forgot-password">Request new link</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token, password)
      navigate('/login', {
        state: { message: 'Password reset successfully. Please log in.' }
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password. The link may have expired.')
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
        <h2 className="login-title">Reset Password</h2>
        <p className="login-description">Enter your new password below.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min 8 chars, upper, lower, number, symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword