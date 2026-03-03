import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading metrics...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard Overview</h1>
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
          <div className="metric-value">{metrics.tasks?.pending || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
