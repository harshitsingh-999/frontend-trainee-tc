import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import logo from "../images.png";

const roles = ["Admin", "Manager", "Intern"];

function Login({ onLogin, isAuthenticated }) {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    employeeId: "",
    password: "",
    role: "Intern",
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formValues);

    if (formValues.role === "Intern") {
      navigate("/user-form");
    } else if (formValues.role === "Manager") {
      navigate("/manager");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo-center">
          <img src={logo} alt="Company Logo" />
        </div>

        {/* TITLE */}
        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to see progress</p>

        {/* FORM */}
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formValues.password}
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
          People · Process · Technology
        </p>

      </div>
    </div>
  );
}

export default Login;