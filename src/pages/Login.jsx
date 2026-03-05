import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Login = ({ onLogin, isAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const rawIdentifier = formData.identifier.trim();
      const isEmailLogin = rawIdentifier.includes('@');
      const loginPayload = isEmailLogin
        ? { email: rawIdentifier, password: formData.password }
        : { id: rawIdentifier, password: formData.password };

      const response = await axiosClient.post('/api/v1/auth/login', loginPayload);
      const payload = response?.data || {};

      if (!payload.success) {
        throw new Error(payload.message || 'Login failed');
      }

      const token = payload.token || payload?.data?.token;
      const user = payload.user || payload?.data?.user;

      if (!token || !user) {
        throw new Error('Invalid login response from server');
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);

      const isAdmin = user.role === 'admin' || user.role === 'Admin' || Number(user.role_id) === 1;
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a'
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 32,
          width: '100%',
          maxWidth: 400
        }}
      >
        <h2 style={{ color: '#f8fafc', marginBottom: 8, textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
          Sign in to your account
        </p>

        {error && (
          <div
            style={{
              background: '#450a0a',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Email or ID</label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="you@company.com or 1"
              required
              disabled={loading}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#f8fafc',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
              disabled={loading}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#f8fafc',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#1e3a8a' : '#1e40af',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '11px',
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
