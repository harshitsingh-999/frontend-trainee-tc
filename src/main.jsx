import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/authcontext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <UserProvider>
          <App />
        </UserProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)

// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
// import App from './App.jsx'
// // <<<<<<< HEAD
// import { AuthProvider } from "./context/authcontext.jsx";
// // =======
// // import { AuthProvider } from './Contexts/AuthContext.jsx'
// import { UserProvider } from './Contexts/UserContext.jsx'
// // >>>>>>> 9c98b913d670e8df40727b538e4a65ce7e1a446b
// import './style.css'

// ReactDOM.createRoot(document.getElementById('app')).render(
//   <React.StrictMode>
//     <AuthProvider>
//       <BrowserRouter>
// <<<<<<< HEAD
//         <App />
// =======
//         <UserProvider>
//           <App />
//         </UserProvider>
// >>>>>>> 9c98b913d670e8df40727b538e4a65ce7e1a446b
//       </BrowserRouter>
//     </AuthProvider>
//   </React.StrictMode>,
// )




// // ---------------------------- //

// // import React from 'react'
// // import ReactDOM from 'react-dom/client'
// // import { BrowserRouter } from 'react-router-dom'
// // import App from './App.jsx'
// // import './style.css'

// // ReactDOM.createRoot(document.getElementById('app')).render(
// //   <React.StrictMode>
// //     <BrowserRouter>
// //       <App />
// //     </BrowserRouter>
// //   </React.StrictMode>,
// // )

