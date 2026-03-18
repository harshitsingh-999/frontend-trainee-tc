import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './Contexts/AuthContext.jsx'
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

