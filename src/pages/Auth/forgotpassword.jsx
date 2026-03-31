import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/api'
import logo from '../../assets/logo.png'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)
    try {
      const res = await forgotPassword(email.trim().toLowerCase())
      setMessage(res?.data?.message || 'If this email is registered, a reset link has been sent.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo"><img src={logo} alt="Team Computers" className="login-logo-img" /></div>
          <div className="login-text">
            <span className="login-subtitle">Forget Password</span>
          </div>
        </div>
        {/* <h2 className="login-title">Forgot Password</h2> */}
        <p className="login-description"><h6>Enter your official email to reset password</h6></p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Official Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && <p style={{ color: 'green', fontSize: 14 }}>{message}</p>}
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword