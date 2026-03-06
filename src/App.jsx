
// import React, { useState } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import Manager from "./pages/Manager.jsx";

// import Login from "./pages/Login.jsx";
// import Dashboard from "./pages/Dashboard.jsx";
// import UserForm from "./pages/UserForm.jsx";
// import Layout from "./components/Layout.jsx";

// function App() {
//   const [user, setUser] = useState(null);

//   const handleLogin = (formValues) => {
//     setUser({
//       name: formValues.employeeId || "Team Member",
//       role: formValues.role,
//     });
//   };

//   const handleLogout = () => {
//     setUser(null);
//   };

//   return (
//     <Routes>
//       {/* LOGIN ROUTE */}
//       <Route
//         path="/login"
//         element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
//       />

//       {/* ROOT REDIRECT */}
//       <Route
//         path="/"
//         element={
//           <Layout user={user} onLogout={handleLogout}>
//             <Navigate to={user ? "/dashboard" : "/login"} replace />
//           </Layout>
//         }
//       />

//       {/* USER FORM — ONLY INTERN */}
//       <Route
//         path="/user-form"
//         element={
//           user?.role === "Intern" ? (
//             <Layout user={user} onLogout={handleLogout}>
//               <UserForm />
//             </Layout>
//           ) : (
//             <Navigate to="/dashboard" replace />
//           )
//         }
//       />

//       {/* DASHBOARD — ALL EXCEPT INTERN */}
//       <Route
//         path="/dashboard"
//         element={
//           user?.role === "Intern" ? (
//             <Navigate to="/user-form" replace />
//           ) : (
//             <Layout user={user} onLogout={handleLogout}>
//               <Dashboard user={user} />
//             </Layout>
//           )
//         }
//       />

//       <Route
//   path="/manager"
//   element={
//     user?.role === "Manager" ? (
//       <Layout user={user} onLogout={handleLogout}>
//         <Manager />
//       </Layout>
//     ) : (
//       <Navigate to="/dashboard" replace />
//     )
//   }
// />

//       {/* FALLBACK */}
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

// export default App;



import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Layout from "./components/Layout.jsx";
import Intern from "./pages/Intern.jsx";

import Attendance from "./pages/Attendance.jsx";
import Task from "./pages/Task.jsx";
import Notifications from "./pages/Notifications.jsx";
import Leave from "./pages/Leave.jsx";
import Manager from "./pages/Manager.jsx";
import UserForm from "./pages/UserForm.jsx";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (formValues) => {
    setUser({
      name: formValues.employeeId || "Team Member",
      role: formValues.role,
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const ProtectedRoute = ({ component: Component, ...props }) => {
    return (
      <Layout user={user} onLogout={handleLogout}>
        {Component}
      </Layout>
    );
  };

  return (
    <Routes>

      {/* Login Page */}
      <Route path="/" element={<Login onLogin={handleLogin} isAuthenticated={!!user} />} />

      {/* Dashboard - for Admin and Manager only */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <Navigate to="/attendance" replace />
              ) : (
                <Dashboard user={user} />
              )
            }
          />
        } 
      />

      {/* Intern - for Interns */}
      <Route 
        path="/intern" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <Intern user={user} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      {/* Attendance - for Interns */}
      <Route 
        path="/attendance" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <Attendance />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      {/* Tasks - for Interns */}
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <Task />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      {/* Notifications - for Interns */}
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <Notifications />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      {/* Leave - for Interns */}
      <Route 
        path="/leave" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <Leave />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      {/* Manager Panel - for Managers only */}
      <Route 
        path="/manager" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Manager" ? (
                <Manager />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      {/* User Form - for Interns */}
      <Route 
        path="/user-form" 
        element={
          <ProtectedRoute 
            component={
              user?.role === "Intern" ? (
                <UserForm />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;