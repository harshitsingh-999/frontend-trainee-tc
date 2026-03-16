import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../Contexts/UserContext'

function daysRemaining() {
  const today = new Date()
  const end = new Date()
  end.setMonth(end.getMonth() + 3)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { users, fetchUsers, loading, error } = useUser()
  const [stats, setStats] = useState([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const remainingDays = daysRemaining()

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (users && users.length > 0) {
      setStats([
        { label: 'Total Users',        value: users.length },
        { label: 'Active Users',        value: users.filter(u => u.is_active === 1 || u.is_active === true).length },
        { label: 'Managers',            value: users.filter(u => u.role_id === 2).length },
        { label: 'Trainees & Interns',  value: users.filter(u => u.role_id === 3 || u.role_id === 4).length },
      ])
    }
  }, [users])

  const workLog = [
    { name: 'Ananya Sharma', role: 'Intern',  date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
    { name: 'Rohan Singh',   role: 'Trainee', date: '24 Feb 2026', hours: '6',   summary: 'Prepared daily MIS reports and data clean-up.' },
    { name: 'Mehak Kaur',    role: 'Intern',  date: '23 Feb 2026', hours: '8',   summary: 'Shadowed client meetings and documented minutes.' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Good day, {user.name || 'Admin'}</h2>
          <p>Role: <span className="pill pill-soft">{user.role || 'Admin'}</span></p>
        </div>
        <div className="summary-badge">
          <span>Internship Time Remaining</span>
          <strong>{remainingDays} days</strong>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* Summary Overview */}
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Summary Overview</h3>
              <p>Real-time data from your user management system ({users.length} Total Users)</p>
            </div>
            <button onClick={() => fetchUsers()} disabled={loading}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}>
              {loading ? '↻ Loading...' : '↻ Refresh'}
            </button>
          </div>
          {error && <div style={{ color: 'red', padding: '10px' }}>Error: {error}</div>}
          <div className="stats-grid">
            {loading && stats.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : stats.map(item => (
              <div key={item.label} className="stat-card">
                <div className="stat-label">{item.label}</div>
                <div className="stat-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Work Log */}
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Intern & Trainee Work Log</h3>
              <p>Daily work logs for interns and trainees to track progress.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Intern / Trainee</th><th>Role</th><th>Date</th><th>Hours</th><th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {workLog.map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.name}</td><td>{entry.role}</td>
                    <td>{entry.date}</td><td>{entry.hours}</td><td>{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Internship Timeline */}
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Internship Timeline</h3>
              <p>Visualise how far you are into the internship.</p>
            </div>
          </div>
          <div className="timeline">
            <div className="timeline-labels">
              <span>Start</span><span>Mid</span><span>End</span>
            </div>
            <div className="timeline-bar">
              <div className="timeline-progress" style={{ width: '55%' }}></div>
            </div>
            <p className="timeline-caption">
              Approx. 55% of the internship period is completed.{' '}
              <strong>{remainingDays} days</strong> remaining.
            </p>
          </div>
        </section>

        {/* Admin Actions */}
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Admin Actions</h3>
              <p>Create, update and manage users across roles.</p>
            </div>
          </div>
          <div className="admin-actions">
            <button className="btn-primary btn-small" onClick={() => navigate('/admin/create-user')}>
              + Create New User
            </button>
            <button className="btn-secondary btn-small" onClick={() => navigate('/admin/users')}>
              Manage Users
            </button>
            <button className="btn-secondary btn-small" onClick={() => navigate('/admin/trainees')}>
              View Trainees
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

export default AdminDashboard