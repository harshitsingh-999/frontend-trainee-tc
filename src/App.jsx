// import React, { useState } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import Login from "./pages/Login.jsx";
// // import UserForm from './pages/UserForm.jsx'
// import Dashboard from "./pages/Dashboard.jsx";
// import Layout from "./components/Layout.jsx";
// import Intern from "./pages/Intern.jsx";

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
//       <Route
//         path="/login"
//         element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
//       />
//       <Route
//         path="/"
//         element={
//           <Layout user={user} onLogout={handleLogout}>
//             <Navigate to={user ? "/dashboard" : "/login"} replace />
//           </Layout>
//         }
//       />
//       {/* { <Route
//         path="/user-form"
//         element={
//           <Layout user={user} onLogout={handleLogout}>
//             <UserForm />
//           </Layout>
//         } } */}

//       <Route
//         path="/intern"
//         element={
//           <Layout user={user} onLogout={handleLogout}>
//             <Intern user={user} />
//           </Layout>
//         }
//       />

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
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

// export default App;






import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Manager from "./pages/Manager.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserForm from "./pages/UserForm.jsx";
import Layout from "./components/Layout.jsx";

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

  return (
    <Routes>
      {/* LOGIN ROUTE */}
      <Route
        path="/login"
        element={<Login onLogin={handleLogin} isAuthenticated={!!user} />}
      />

      {/* ROOT REDIRECT */}
      <Route
        path="/"
        element={
          <Layout user={user} onLogout={handleLogout}>
            <Navigate to={user ? "/dashboard" : "/login"} replace />
          </Layout>
        }
      />

      {/* USER FORM — ONLY INTERN */}
      <Route
        path="/user-form"
        element={
          user?.role === "Intern" ? (
            <Layout user={user} onLogout={handleLogout}>
              <UserForm />
            </Layout>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* DASHBOARD — ALL EXCEPT INTERN */}
      <Route
        path="/dashboard"
        element={
          user?.role === "Intern" ? (
            <Navigate to="/user-form" replace />
          ) : (
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          )
        }
      />

      <Route
  path="/manager"
  element={
    user?.role === "Manager" ? (
      <Layout user={user} onLogout={handleLogout}>
        <Manager />
      </Layout>
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }
/>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;