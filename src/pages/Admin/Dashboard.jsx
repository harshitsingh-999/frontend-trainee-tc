import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axiosClient.get('/api/v1/admin/dashboard');
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading metrics...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Users</h3>
          <div className="metric-value">{metrics.totalUsers || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Total Trainees</h3>
          <div className="metric-value">{metrics.totalTrainees || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Departments</h3>
          <div className="metric-value">{metrics.totalDepartments || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Pending Tasks</h3>
          <div className="metric-value">{metrics.pendingTasks || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
