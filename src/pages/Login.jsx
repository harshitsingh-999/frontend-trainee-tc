import React, { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import api from '../api/api'
import logo from '../assets/logo.png'

function Login({ onLogin, isAuthenticated, currentUser, getRedirectPath }) {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({ email: '', password: '' })
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let bubbles = []
    let animFrame

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const makeBubble = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 30,
      r: 10 + Math.random() * 28,
      speed: 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      opacity: 0.05 + Math.random() * 0.1,
      phase: Math.random() * Math.PI * 2,
    })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      bubbles = bubbles.filter(b => b.y + b.r > -20)
      if (bubbles.length < 18 && Math.random() < 0.06) bubbles.push(makeBubble())
      bubbles.forEach(b => {
        b.y -= b.speed
        b.x += Math.sin(b.phase) * b.drift
        b.phase += 0.015
        const alpha = b.opacity
          * Math.min(1, (canvas.height - b.y) / 80)
          * Math.min(1, (b.y + b.r) / 100)
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 1.5})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      })
      animFrame = requestAnimationFrame(draw)
    }

    resize()
    for (let i = 0; i < 14; i++) {
      const b = makeBubble()
      b.y = Math.random() * canvas.height
      bubbles.push(b)
    }
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(currentUser)} replace />
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
      const res = await api.post('/auth/login', {
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
      })
      const apiUser = res?.data?.user || res?.data?.data?.user || res?.data?.data || null
      if (!apiUser) throw new Error('Login succeeded but no user data returned.')
      const resolvedUser = apiUser?.user && typeof apiUser.user === 'object' ? apiUser.user : apiUser
      const token = res?.data?.token || res?.data?.data?.token || res?.data?.data?.accessToken || res?.data?.accessToken || null
      const accessTokenExpiresAt = res?.data?.accessTokenExpiresAt || res?.data?.data?.accessTokenExpiresAt || null
      const refreshTokenExpiresAt = res?.data?.refreshTokenExpiresAt || res?.data?.data?.refreshTokenExpiresAt || null
      const processedUser = onLogin(resolvedUser, { token, accessTokenExpiresAt, refreshTokenExpiresAt })
      navigate(getRedirectPath(processedUser || resolvedUser))
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error || error?.response?.data?.msg
      if (backendMessage) { setErrorMsg(backendMessage) }
      else if (error?.response?.status) { setErrorMsg(`Login failed (HTTP ${error.response.status})`) }
      else { setErrorMsg(error.message || 'Login failed') }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      <div className="login-card">
       <div className="login-logo">
       <img src={logo} alt="Team Computers" className="login-logo-img" />
       <div className="divider-with-text">
      <span>Intern Management Portal</span>
      </div>
       {/* <span className="login-subtitle">Intern Management System  </span> */}
       </div>
        {/* <h2 className="login-title">Welcome back</h2> */}
        <p className="login-description">Welcome</p>
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="email">Official Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formValues.email}
              onChange={handleChange}
              required
              autoComplete="new-password"
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
              autoComplete="new-password"
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#2563eb' }}>
              Forgot password?
            </Link>
          </div>
          {errorMsg && <p className="error-text">{errorMsg}</p>}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="login-footer">TeamComputers - People - Process - Technology</p>
      </div>
    </div>
  )
}

export default Login