import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../Contexts/UserContext'

function daysRemaining() {
  const today = new Date()
  const end = new Date()
  end.setMonth(end.getMonth() + 3)
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  return diff
}

function Dashboard({ user }) {
  const navigate = useNavigate()
  const role = user?.role || 'Intern'
  const { users, fetchUsers, loading, error } = useUser()
  const [stats, setStats] = useState([])

  const remainingDays = daysRemaining()

  // Fetch users when component mounts
  useEffect(() => {
    console.log('Dashboard mounting - fetching users')
    fetchUsers()
  }, [fetchUsers])

  // Calculate stats from actual user data
  useEffect(() => {
    console.log('Users data updated:', users)
    console.log('Users count:', users.length)
    
    if (users && users.length > 0) {
      const totalUsers = users.length
      const activeUsers = users.filter(u => u.is_active === 1 || u.is_active === true).length
      const admins = users.filter(u => u.role_id === 1).length
      const managers = users.filter(u => u.role_id === 2).length
      const trainees = users.filter(u => u.role_id === 3).length
      const interns = users.filter(u => u.role_id === 4).length

      console.log('Calculated stats:', { totalUsers, activeUsers, admins, managers, trainees, interns })

      setStats([
        { label: 'Total Users', value: totalUsers },
        { label: 'Active Users', value: activeUsers },
        { label: 'Managers', value: managers },
        { label: 'Trainees & Interns', value: trainees + interns },
      ])
    }
  }, [users])

  const workLog = [
    {
      name: 'Ananya Sharma',
      role: 'Intern',
      date: '24 Feb 2026',
      hours: '7.5',
      summary: 'Worked on UI for intern dashboard and bug fixes.',
    },
    {
      name: 'Rohan Singh',
      role: 'Trainee',
      date: '24 Feb 2026',
      hours: '6',
      summary: 'Prepared daily MIS reports and data clean-up.',
    },
    {
      name: 'Mehak Kaur',
      role: 'Intern',
      date: '23 Feb 2026',
      hours: '8',
      summary: 'Shadowed client meetings and documented minutes.',
    },
  ]

  const showAdminPanel = role === 'Admin'
  const showManagerPanel = role === 'Admin' || role === 'Manager'

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Good day, {user?.name || 'Team Member'}</h2>
          <p>
            Role:&nbsp;
            <span className="pill pill-soft">{role}</span>
          </p>
        </div>
        <div className="summary-badge">
          <span>Internship Time Remaining</span>
          <strong>{remainingDays} days</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Summary Overview</h3>
              <p>Real-time data from your user management system ({users.length} Total Users)</p>
            </div>
            <button 
              onClick={() => fetchUsers()} 
              disabled={loading}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}
            >
              {loading ? '↻ Loading...' : '↻ Refresh'}
            </button>
          </div>
          {error && <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>Error: {error}</div>}
          <div className="stats-grid">
            {loading && stats.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>Loading user data...</div>
            ) : stats.length > 0 ? (
              stats.map((item) => (
                <div key={item.label} className="stat-card">
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-value">{item.value}</div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>No users data available</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h3>Intern & Trainee Work Log</h3>
              <p>
                Daily work logs for interns and trainees to track progress.
              </p>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Intern / Trainee</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {workLog.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.name}</td>
                    <td>{entry.role}</td>
                    <td>{entry.date}</td>
                    <td>{entry.hours}</td>
                    <td>{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h3>Internship Timeline</h3>
              <p>Visualise how far you are into the internship.</p>
            </div>
          </div>
          <div className="timeline">
            <div className="timeline-labels">
              <span>Start</span>
              <span>Mid</span>
              <span>End</span>
            </div>
            <div className="timeline-bar">
              <div
                className="timeline-progress"
                style={{ width: '55%' }}
              ></div>
            </div>
            <p className="timeline-caption">
              Approx. 55% of the internship period is completed.{' '}
              <strong>{remainingDays} days</strong> remaining.
            </p>
          </div>
        </section>

        {showManagerPanel && (
          <section className="card">
            <div className="card-header">
              <div>
                <h3>Manager View</h3>
                <p>Track interns mapped to you and their buddies.</p>
              </div>
            </div>
            <ul className="list">
              <li className="list-item">
                <div>
                  <div className="list-title">Ananya Sharma</div>
                  <div className="list-subtitle">
                    Track: Frontend
                  </div>
                </div>
                <span className="pill pill-green">On Track</span>
              </li>
              <li className="list-item">
                <div>
                  <div className="list-title">Rohan Singh</div>
                  <div className="list-subtitle">
                    Track: Data & Reporting
                  </div>
                </div>
                <span className="pill pill-amber">Needs Attention</span>
              </li>
              <li className="list-item">
                <div>
                  <div className="list-title">Mehak Kaur</div>
                  <div className="list-subtitle">
                    Track: Pre-sales
                  </div>
                </div>
                <span className="pill pill-green">On Track</span>
              </li>
            </ul>
          </section>
        )}

        {showAdminPanel && (
          <section className="card">
            <div className="card-header">
              <div>
                <h3>Admin Actions</h3>
                <p>Create, update and manage users across roles.</p>
              </div>
            </div>
            <div className="admin-actions">
              <button
                className="btn-primary btn-small"
                onClick={() => navigate('/user-form')}
              >
                + Create New User
              </button>
              <button
                className="btn-secondary btn-small"
                onClick={() => navigate('/users')}
              >
                Manage Users
              </button>
              <button className="btn-secondary btn-small">
                View Access Matrix
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default Dashboard




// import React from 'react'

// function daysRemaining() {
//   const today = new Date()
//   const end = new Date()
//   end.setMonth(end.getMonth() + 3)
//   const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
//   return diff
// }

// function Dashboard({ user }) {
//   const role = user?.role || 'Intern'

//   const remainingDays = daysRemaining()

//   const stats = [
//     { label: 'Active Interns', value: 42 },
//     { label: 'Buddies Assigned', value: 38 },
//     { label: 'Managers', value: 9 },
//     { label: 'Internships Ending This Month', value: 6 },
//   ]

//   const workLog = [
//     {
//       name: 'Ananya Sharma',
//       role: 'Intern',
//       buddy: 'Rahul Verma',
//       date: '24 Feb 2026',
//       hours: '7.5',
//       summary: 'Worked on UI for intern dashboard and bug fixes.',
//     },
//     {
//       name: 'Rohan Singh',
//       role: 'Trainee',
//       buddy: 'Priya Nair',
//       date: '24 Feb 2026',
//       hours: '6',
//       summary: 'Prepared daily MIS reports and data clean-up.',
//     },
//     {
//       name: 'Mehak Kaur',
//       role: 'Intern',
//       buddy: 'Saurabh Gupta',
//       date: '23 Feb 2026',
//       hours: '8',
//       summary: 'Shadowed client meetings and documented minutes.',
//     },
//   ]

//   const showAdminPanel = role === 'Admin'
//   const showManagerPanel = role === 'Admin' || role === 'Manager'

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <div>
//           <h2>Good day, {user?.name || 'Team Member'}</h2>
//           <p>
//             Role:&nbsp;
//             <span className="pill pill-soft">{role}</span>
//           </p>
//         </div>
//         <div className="summary-badge">
//           <span>Internship Time Remaining</span>
//           <strong>{remainingDays} days</strong>
//         </div>
//       </div>

//       <div className="dashboard-grid">
//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Summary Overview</h3>
//               <p>Key numbers for the current internship batch.</p>
//             </div>
//           </div>
//           <div className="stats-grid">
//             {stats.map((item) => (
//               <div key={item.label} className="stat-card">
//                 <div className="stat-label">{item.label}</div>
//                 <div className="stat-value">{item.value}</div>
//               </div>
//             ))}
//           </div>
//         </section>

//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Intern & Trainee Work Log</h3>
//               <p>
//                 Everyone can see daily work logs to stay aligned with their
//                 buddy and manager.
//               </p>
//             </div>
//           </div>
//           <div className="table-wrapper">
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>Intern / Trainee</th>
//                   <th>Role</th>
//                   <th>Buddy</th>
//                   <th>Date</th>
//                   <th>Hours</th>
//                   <th>Summary</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {workLog.map((entry, index) => (
//                   <tr key={index}>
//                     <td>{entry.name}</td>
//                     <td>{entry.role}</td>
//                     <td>{entry.buddy}</td>
//                     <td>{entry.date}</td>
//                     <td>{entry.hours}</td>
//                     <td>{entry.summary}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Internship Timeline</h3>
//               <p>Visualise how far you are into the internship.</p>
//             </div>
//           </div>
//           <div className="timeline">
//             <div className="timeline-labels">
//               <span>Start</span>
//               <span>Mid</span>
//               <span>End</span>
//             </div>
//             <div className="timeline-bar">
//               <div
//                 className="timeline-progress"
//                 style={{ width: '55%' }}
//               ></div>
//             </div>
//             <p className="timeline-caption">
//               Approx. 55% of the internship period is completed.{' '}
//               <strong>{remainingDays} days</strong> remaining.
//             </p>
//           </div>
//         </section>

//         {showManagerPanel && (
//           <section className="card">
//             <div className="card-header">
//               <div>
//                 <h3>Manager View</h3>
//                 <p>Track interns mapped to you and their buddies.</p>
//               </div>
//             </div>
//             <ul className="list">
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Ananya Sharma</div>
//                   <div className="list-subtitle">
//                     Buddy: Rahul Verma · Track: Frontend
//                   </div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Rohan Singh</div>
//                   <div className="list-subtitle">
//                     Buddy: Priya Nair · Track: Data & Reporting
//                   </div>
//                 </div>
//                 <span className="pill pill-amber">Needs Attention</span>
//               </li>
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Mehak Kaur</div>
//                   <div className="list-subtitle">
//                     Buddy: Saurabh Gupta · Track: Pre-sales
//                   </div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//             </ul>
//           </section>
//         )}

//         {showAdminPanel && (
//           <section className="card">
//             <div className="card-header">
//               <div>
//                 <h3>Admin Actions</h3>
//                 <p>Create, update and manage users across roles.</p>
//               </div>
//             </div>
//             <div className="admin-actions">
//               <button className="btn-primary btn-small">
//                 Create New User
//               </button>
//               <button className="btn-secondary btn-small">
//                 Manage Managers
//               </button>
//               <button className="btn-secondary btn-small">
//                 View Access Matrix
//               </button>
//             </div>
//           </section>
//         )}
//       </div>
//     </div>
//   )
// }

// export default Dashboard

