import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/authcontext.jsx'
import Login          from './pages/Login.jsx'
import Dashboard      from './pages/Dashboard.jsx'
import Manager        from './pages/manager.jsx'
import UserForm       from './pages/UserForm.jsx'
import Layout         from './components/Layout_manager.jsx'
import ProtectedRoute from './components/proctedroutes.jsx'
import Attendance     from './pages/attendence.jsx'

function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading…</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route
  path="/attendance"
  element={
    <ProtectedRoute>
      <Layout><Attendance /></Layout>
    </ProtectedRoute>
  }
/>

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/manager" element={
        <ProtectedRoute requiredRoleIds={[1, 2]}>
          <Layout><Manager /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/user-form" element={
        <ProtectedRoute requiredRoleIds={[1]}>
          <Layout><UserForm /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
/*
```

✅ **Everything done.**

---

## Summary — What you touched
```
backend/
  src/middlewares/
    auth.middleware.js     //← REPLACED
    role.middleware.js     //← NEW FILE

  src/api/v1/Controllers/
    manager.controller.js  // ← NEW FILE

  src/api/v1/Routes/
    manager.routes.js      // ← NEW FILE

  src/
    routes.js              //← REPLACED

frontend/
  src/components/
    Layout.jsx             //← REPLACED
    ProtectedRoute.jsx     //← REPLACED

  src/pages/
    Manager.jsx            // ← NEW FILE

  src/
    App.jsx                //← REPLACED

/*
// --------------------------------------------------------- //

// import React from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'
// import { useAuth } from "./context/authcontext.jsx";
// import Login from './pages/Login.jsx'
// import Dashboard from './pages/Dashboard.jsx'
// import ProtectedRoute from './components/proctedroutes.jsx'
// import Layout from './components/Layout.jsx'



// function App() {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return <div className="loading-screen">Loading...</div>;
//   }

//   return (
//     <Routes>
//       {/* Public */
//       <Route path="/login" element={<Login />} />

//       {/* Protected */}
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <Layout>
//               <Dashboard />
//             </Layout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Redirect root */}
//       <Route
//         path="/"
//         element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
//       />


//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

// export default App;

// ----------------------- IMPORTANT: DO NOT SUGGEST CODE DELETIONS ----------------------- //

// function App() {
//   const [user, setUser] = useState(null)

//   const handleLogin = (apiUser) => {
//     setUser({
//       id: apiUser.id,
//       name: apiUser.name || 'Team Member',
//       email: apiUser.email,
//       role: apiUser.role_id ? `Role ${apiUser.role_id}` : 'User',
//     })
//   }

//   const handleLogout = () => {
//     setUser(null)
//   }

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
//       />
//       <Route
//         path="/"
//         element={
//           <Layout user={user} onLogout={handleLogout}>
//             <Navigate to={user ? '/dashboard' : '/login'} replace />
//           </Layout>
//         }
//       />
//       <Route
//         path="/user-form"
//         element={
//           user ? (
//             <Layout user={user} onLogout={handleLogout}>
//               <UserForm />
//             </Layout>
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />
//       <Route
//         path="/dashboard"
//         element={
//           user ? (
//             <Layout user={user} onLogout={handleLogout}>
//               <Dashboard user={user} />
//             </Layout>
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }

// export default App
