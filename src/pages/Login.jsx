import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api/login_api'
import { useAuth } from '../context/authcontext.jsx'

function Login() {
  const { user, login, getRedirectPath, loading } = useAuth()
  const navigate = useNavigate()
  const [formValues,   setFormValues]   = useState({ email: '', password: '' })
  const [errorMsg,     setErrorMsg]     = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) return <div className="loading-screen">Loading…</div>
  if (user) return <Navigate to={getRedirectPath(user)} replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const res = await api.post('/auth/login', {
        email:    formValues.email.trim().toLowerCase(),
        password: formValues.password,
      })

      const rawUser =
        res?.data?.data?.user ||
        res?.data?.user       ||
        res?.data?.data       ||
        null

      if (!rawUser) throw new Error('Login succeeded but no user data returned.')

      const token =
        res?.data?.token             ||
        res?.data?.data?.token       ||
        res?.data?.data?.accessToken ||
        res?.data?.accessToken       ||
        null
      if (token) localStorage.setItem('token', token)

      const processedUser = login(rawUser)
      navigate(getRedirectPath(processedUser))

    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error   ||
        error?.message                 ||
        'Login failed'
      setErrorMsg(msg)
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
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="login-footer">TeamComputers - People - Process - Technology</p>
      </div>
    </div>
  )
}

export default Login

// ---------------------------------- //

// import React, { useState } from 'react'
// import { Navigate, useNavigate } from 'react-router-dom'
// import api from '../api/login_api'
// import { useAuth } from '../context/authcontext.jsx'

// function Login() {
//   const { user, login, getRedirectPath } = useAuth()
//   const navigate = useNavigate()
//   const [formValues,   setFormValues]   = useState({ email: '', password: '' })
//   const [errorMsg,     setErrorMsg]     = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   // Already logged in — go to the right panel
//   if (user) return <Navigate to={getRedirectPath(user)} replace />

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormValues(prev => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setErrorMsg('')
//     setIsSubmitting(true)

//     try {
//       const res = await api.post('/auth/login', {
//         email:    formValues.email.trim().toLowerCase(),
//         password: formValues.password,
//       })

//       // Handle all common backend response shapes
//       const rawUser =
//         res?.data?.data?.user ||
//         res?.data?.user       ||
//         res?.data?.data       ||
//         null

//       if (!rawUser) throw new Error('Login succeeded but no user data returned.')

//       // Store token if backend sends one (coworker's flow)
//       const token =
//         res?.data?.token              ||
//         res?.data?.data?.token        ||
//         res?.data?.data?.accessToken  ||
//         res?.data?.accessToken        ||
//         null
//       if (token) localStorage.setItem('token', token)

//       // login() normalises + stores user in context AND localStorage
//       const processedUser = login(rawUser)

//       // Role-aware redirect (your /dashboard or coworker's /admin/dashboard etc.)
//       navigate(getRedirectPath(processedUser || rawUser))

//     } catch (error) {
//       const msg =
//         error?.response?.data?.message ||
//         error?.response?.data?.error   ||
//         error?.message                 ||
//         'Login failed'
//       setErrorMsg(msg)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="login-logo">
//           <div className="login-mark">t:</div>
//           <div className="login-text">
//             <span className="login-name">teamComputers</span>
//             <span className="login-subtitle">Intern Management</span>
//           </div>
//         </div>
//         <h2 className="login-title">Welcome back</h2>
//         <p className="login-description">
//           Sign in to manage interns, buddies, and training progress.
//         </p>
//         <form className="login-form" onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">Official Email</label>
//             <input
//               id="email" name="email" type="email"
//               placeholder="name@teamcomputers.com"
//               value={formValues.email} onChange={handleChange} required
//             />
//           </div>
//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input
//               id="password" name="password" type="password"
//               value={formValues.password} onChange={handleChange} required
//             />
//           </div>
//           {errorMsg && <p className="error-text">{errorMsg}</p>}
//           <button type="submit" className="btn-primary" disabled={isSubmitting}>
//             {isSubmitting ? 'Signing in...' : 'Login'}
//           </button>
//         </form>
//         <p className="login-footer">TeamComputers - People - Process - Technology</p>
//       </div>
//     </div>
//   )
// }

// export default Login

// ----------------------------------------------------- //

// function Login({ onLogin, isAuthenticated }) {
//   const navigate = useNavigate()
//   const [formValues, setFormValues] = useState({
//     email: '',
//     password: '',
//   })
//   const [errorMsg, setErrorMsg] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />
//   }

//   const handleChange = (event) => {
//     const { name, value } = event.target
//     setFormValues((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (event) => {
//     event.preventDefault()
//     setErrorMsg('')
//     setIsSubmitting(true)

//     try {
//       const res = await api.post('/users/login', {
//         email: formValues.email.trim().toLowerCase(),
//         password: formValues.password,
//       })

//       onLogin(res.data.data)
//       navigate('/dashboard')
//     } catch (error) {
//       setErrorMsg(error.response?.data?.message || 'Login failed')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="login-logo">
//           <div className="login-mark">t:</div>
//           <div className="login-text">
//             <span className="login-name">teamComputers</span>
//             <span className="login-subtitle">Intern Management</span>
//           </div>
//         </div>

//         <h2 className="login-title">Welcome back</h2>
//         <p className="login-description">
//           Sign in to manage interns, buddies, and training progress.
//         </p>

//         <form className="login-form" onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label htmlFor="email">Official Email</label>
//             <input
//               id="email"
//               name="email"
//               type="email"
//               placeholder="name@teamcomputers.com"
//               value={formValues.email}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input
//               id="password"
//               name="password"
//               type="password"
//               value={formValues.password}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           {errorMsg ? <p className="error-text">{errorMsg}</p> : null}

//           <button type="submit" className="btn-primary" disabled={isSubmitting}>
//             {isSubmitting ? 'Signing in...' : 'Login'}
//           </button>
//           <div className='forgotpassword'> <a href="/forgot-password">Forgot Password?</a> </div>
//         </form>

//         <p className="login-footer">TeamComputers - People - Process - Technology</p>
//       </div>
//     </div>

    
//   )
// }

// export default Login

