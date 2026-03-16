import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/authcontext.jsx'
import { useNavigate } from 'react-router-dom'
import api from '../api/login_api.js'
import { useUser } from '../Contexts/UserContext'

function daysRemaining() {
  const today = new Date()
  const end = new Date()
  end.setMonth(end.getMonth() + 3)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good Morning', icon: '🌅' }
  if (h < 17) return { text: 'Good Afternoon', icon: '☀️' }
  return { text: 'Good Evening', icon: '🌙' }
}

function formatTime(time) {
  if (!time) return '—'
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

function Dashboard() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
  const { users, fetchUsers, loading: usersLoading, error: usersError } = useUser()

  // ── ALL hooks must be at the top, before any early return ──
  const [todayAttendance,   setTodayAttendance]   = useState(null)
  const [myTasks,           setMyTasks]           = useState([])
  const [attendanceBusy,    setAttendanceBusy]    = useState(false)
  const [attendanceMsg,     setAttendanceMsg]     = useState('')
  const [attendanceErr,     setAttendanceErr]     = useState('')
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [interns,           setInterns]           = useState([])
  const [chartsReady,       setChartsReady]       = useState(false)
  const [ChartComponents,   setChartComponents]   = useState(null)
  const [stats,             setStats]             = useState([])

  const isIntern  = user?.role_id === 4
  const isManager = user?.role_id === 1 || user?.role_id === 2

  // Load recharts lazily — won't crash if not installed yet
  useEffect(() => {
    import('./charts.jsx')
      .then(mod => { setChartComponents(mod); setChartsReady(true) })
      .catch(() => setChartsReady(false))
  }, [])

  useEffect(() => {
    if (isIntern) {
      api.get('/attendance/today').then(r => setTodayAttendance(r.data.data)).catch(() => {})
      api.get('/attendance/history').then(r => setAttendanceHistory(r.data.data || [])).catch(() => {})
      api.get('/intern/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => {})
    }
    if (isManager) {
      api.get('/manager/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => {})
      api.get('/manager/interns').then(r => setInterns(r.data.data || [])).catch(() => {})
    }
  }, [isIntern, isManager])

  // Fetch users for summary stats (admin/manager view)
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Build stats from real user data
  useEffect(() => {
    if (users && users.length > 0) {
      const activeUsers = users.filter(u => u.is_active === 1 || u.is_active === true).length
      const managers    = users.filter(u => u.role_id === 2).length
      const trainees    = users.filter(u => u.role_id === 3).length
      const internsCount = users.filter(u => u.role_id === 4).length
      setStats([
        { label: 'Total Users',         value: users.length },
        { label: 'Active Users',         value: activeUsers },
        { label: 'Managers',             value: managers },
        { label: 'Trainees & Interns',   value: trainees + internsCount },
      ])
    } else {
      // fallback while loading or no data
      setStats([
        { label: 'Active Interns',                value: '—' },
        { label: 'Buddies Assigned',              value: '—' },
        { label: 'Managers',                      value: '—' },
        { label: 'Internships Ending This Month', value: '—' },
      ])
    }
  }, [users])

  // Early returns AFTER all hooks
  if (loading) return <div style={{ padding: '30px' }}>Loading...</div>

  const role          = user?.role || 'Intern'
  const remainingDays = daysRemaining()
  const greeting      = getGreeting()
  const checkedIn     = !!todayAttendance?.check_in_time
  const checkedOut    = !!todayAttendance?.check_out_time
  const pendingTasks  = myTasks.filter(t => t.status !== 'completed').length

  const handleCheckIn = async () => {
    setAttendanceBusy(true); setAttendanceMsg(''); setAttendanceErr('')
    try {
      const res = await api.post('/attendance/checkin')
      setAttendanceMsg(res.data.message)
      const r = await api.get('/attendance/today')
      setTodayAttendance(r.data.data)
    } catch (err) {
      setAttendanceErr(err.response?.data?.message || 'Check-in failed')
    } finally { setAttendanceBusy(false) }
  }

  const handleCheckOut = async () => {
    setAttendanceBusy(true); setAttendanceMsg(''); setAttendanceErr('')
    try {
      const res = await api.post('/attendance/checkout')
      setAttendanceMsg(res.data.message)
      const r = await api.get('/attendance/today')
      setTodayAttendance(r.data.data)
    } catch (err) {
      setAttendanceErr(err.response?.data?.message || 'Check-out failed')
    } finally { setAttendanceBusy(false) }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Work log data
  const workLog = [
    { name: 'Ananya Sharma', role: 'Intern',  date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
    { name: 'Rohan Singh',   role: 'Trainee', date: '24 Feb 2026', hours: '6',   summary: 'Prepared daily MIS reports and data clean-up.' },
    { name: 'Mehak Kaur',    role: 'Intern',  date: '23 Feb 2026', hours: '8',   summary: 'Shadowed client meetings and documented minutes.' },
  ]

  return (
    <div className="dashboard">

      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #003b5c 0%, #00b1b4 60%, #ffd34d 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>
            {greeting.icon}
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700 }}>
              {greeting.text}, {user?.name?.split(' ')[0]}!
            </h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              &nbsp;|&nbsp;Let's make today productive
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isIntern && (
            <button
              onClick={checkedIn && !checkedOut ? handleCheckOut : !checkedIn ? handleCheckIn : undefined}
              disabled={attendanceBusy || checkedOut}
              style={{
                background: checkedOut ? 'rgba(255,255,255,0.15)' : checkedIn ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)',
                border: checkedIn && !checkedOut ? '1.5px solid #22c55e' : '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: checkedOut ? 'default' : 'pointer',
                backdropFilter: 'blur(6px)', fontWeight: 600,
              }}
            >
              <span>⏰</span>
              {checkedOut
                ? <span>Punched out ✓</span>
                : checkedIn
                ? <span>Punched in — tap to punch out ✓</span>
                : <span>Not punched in — tap to punch in</span>
              }
            </button>
          )}

          {isManager && (
            <button
              onClick={() => navigate('/manager')}
              style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 10,
                padding: '10px 18px', color: '#fff', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.3)',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              <span>📅</span>
              <span>{pendingTasks} Task{pendingTasks !== 1 ? 's' : ''} to review →</span>
            </button>
          )}

          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 10,
            padding: '10px 18px', color: '#fff', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>👤</span><span>{role}</span>
          </div>
        </div>
      </div>

      {/* ── INTERN ATTENDANCE CARD ── */}
      {isIntern && (
        <section className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div><h3>Today's Attendance</h3><p>Mark your arrival and departure for today.</p></div>
          </div>
          {attendanceMsg && (
            <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px',
              borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✓ {attendanceMsg}</p>
          )}
          {attendanceErr && (
            <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
              borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✗ {attendanceErr}</p>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleCheckIn} disabled={attendanceBusy || checkedIn}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
                cursor: checkedIn ? 'not-allowed' : 'pointer',
                background: checkedIn ? '#e5e7eb' : '#00b1b4', color: checkedIn ? '#9ca3af' : '#fff' }}>
              {checkedIn ? '✓ Checked In' : attendanceBusy ? 'Processing…' : '🟢 Check In'}
            </button>
            <button onClick={handleCheckOut} disabled={attendanceBusy || !checkedIn || checkedOut}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
                cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer',
                background: checkedOut ? '#e5e7eb' : checkedIn ? '#003b5c' : '#e5e7eb',
                color: (!checkedIn || checkedOut) ? '#9ca3af' : '#fff' }}>
              {checkedOut ? '✓ Checked Out' : attendanceBusy ? 'Processing…' : '🔴 Check Out'}
            </button>
            <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
              {[
                { label: 'IN',     value: formatTime(todayAttendance?.check_in_time) },
                { label: 'OUT',    value: formatTime(todayAttendance?.check_out_time) },
                { label: 'STATUS', value: todayAttendance?.status?.replace('_', ' ') || 'Not marked' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 16px',
                  border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
                  <div style={{ fontWeight: 700, color: '#003b5c', textTransform: 'capitalize', fontSize: 13 }}>{value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/attendance')}
              style={{ marginLeft: 'auto', padding: '10px 18px', borderRadius: 8,
                border: '1px solid #00b1b4', background: 'transparent',
                color: '#00b1b4', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              View Full History →
            </button>
          </div>
        </section>
      )}

      {/* ── MAIN GRID ── */}
      <div className="dashboard-grid">

        {/* Summary Stats — real data from UserContext */}
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Summary Overview</h3>
              <p>Real-time data from your user management system ({users.length} Total Users)</p>
            </div>
            <button onClick={() => fetchUsers()} disabled={usersLoading}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}>
              {usersLoading ? '↻ Loading...' : '↻ Refresh'}
            </button>
          </div>
          {usersError && <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>Error: {usersError}</div>}
          <div className="stats-grid">
            {usersLoading && stats.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>Loading user data...</div>
            ) : stats.map(item => (
              <div key={item.label} className="stat-card">
                <div className="stat-label">{item.label}</div>
                <div className="stat-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Intern Charts */}
        {isIntern && chartsReady && ChartComponents && (
          <section className="card">
            <div className="card-header">
              <div><h3>My Task Breakdown</h3><p>Status of all your tasks at a glance.</p></div>
            </div>
            <ChartComponents.TaskDonutChart tasks={myTasks} />
          </section>
        )}

        {isIntern && chartsReady && ChartComponents && attendanceHistory.length > 0 && (
          <section className="card">
            <div className="card-header">
              <div><h3>Attendance This Week</h3><p>Check-in & check-out times over last 7 days.</p></div>
            </div>
            <ChartComponents.AttendanceLineChart history={attendanceHistory} />
          </section>
        )}

        {/* Manager Charts */}
        {isManager && chartsReady && ChartComponents && (
          <section className="card">
            <div className="card-header">
              <div><h3>Intern Progress</h3><p>Average task completion per intern.</p></div>
            </div>
            <ChartComponents.InternProgressChart interns={interns} tasks={myTasks} />
          </section>
        )}

        {isManager && chartsReady && ChartComponents && (
          <section className="card">
            <div className="card-header">
              <div><h3>Task Status Breakdown</h3><p>All tasks by current status.</p></div>
            </div>
            <ChartComponents.TaskStatusBarChart tasks={myTasks} />
          </section>
        )}

        {/* Work Log */}
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Intern & Trainee Work Log</h3>
              <p>Daily work logs to stay aligned with your buddy and manager.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Intern / Trainee</th><th>Role</th><th>Buddy</th>
                  <th>Date</th><th>Hours</th><th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ananya Sharma', role: 'Intern',  buddy: 'Rahul Verma',   date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
                  { name: 'Rohan Singh',   role: 'Trainee', buddy: 'Priya Nair',    date: '24 Feb 2026', hours: '6',   summary: 'Prepared daily MIS reports and data clean-up.' },
                  { name: 'Mehak Kaur',    role: 'Intern',  buddy: 'Saurabh Gupta', date: '23 Feb 2026', hours: '8',   summary: 'Shadowed client meetings and documented minutes.' },
                ].map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.name}</td><td>{entry.role}</td><td>{entry.buddy}</td>
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
            <div><h3>Internship Timeline</h3><p>Visualise how far you are into the internship.</p></div>
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

        {/* Manager View */}
        {isManager && (
          <section className="card">
            <div className="card-header">
              <div><h3>Manager View</h3><p>Track interns mapped to you and their buddies.</p></div>
            </div>
            <ul className="list">
              <li className="list-item">
                <div>
                  <div className="list-title">Ananya Sharma</div>
                  <div className="list-subtitle">Buddy: Rahul Verma · Track: Frontend</div>
                </div>
                <span className="pill pill-green">On Track</span>
              </li>
              <li className="list-item">
                <div>
                  <div className="list-title">Rohan Singh</div>
                  <div className="list-subtitle">Track: Data &amp; Reporting</div>
                </div>
                <span className="pill pill-amber">Needs Attention</span>
              </li>
              <li className="list-item">
                <div>
                  <div className="list-title">Mehak Kaur</div>
                  <div className="list-subtitle">Track: Pre-sales</div>
                </div>
                <span className="pill pill-green">On Track</span>
              </li>
            </ul>
          </section>
        )}

        {/* Admin Panel */}
        {role === 'Admin' && (
          <section className="card">
            <div className="card-header">
              <div><h3>Admin Actions</h3><p>Create, update and manage users across roles.</p></div>
            </div>
            <div className="admin-actions">
              <button className="btn-primary btn-small" onClick={() => navigate('/user-form')}>
                + Create New User
              </button>
              <button className="btn-secondary btn-small" onClick={() => navigate('/admin/users')}>
                Manage Users
              </button>
              <button className="btn-secondary btn-small">View Access Matrix</button>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

export default Dashboard

// -------------------------------------- //



// import React, { useState, useEffect } from 'react'
// import { useAuth } from '../context/authcontext.jsx'
// import { useNavigate } from 'react-router-dom'
// import api from '../api/login_api.js'
// import { TaskDonutChart, AttendanceLineChart, InternProgressChart, TaskStatusBarChart } from './charts.jsx'


// const [attendanceHistory, setAttendanceHistory] = useState([])
// const [interns,           setInterns]           = useState([])


// function daysRemaining() {
//   const today = new Date()
//   const end = new Date()
//   end.setMonth(end.getMonth() + 3)
//   return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
// }

// function getGreeting() {
//   const h = new Date().getHours()
//   if (h < 12) return { text: 'Good Morning', icon: '🌅' }
//   if (h < 17) return { text: 'Good Afternoon', icon: '☀️' }
//   return { text: 'Good Evening', icon: '🌙' }
// }

// function formatTime(time) {
//   if (!time) return '—'
//   const [h, m] = time.split(':')
//   const hour = parseInt(h)
//   const ampm = hour >= 12 ? 'PM' : 'AM'
//   return `${hour % 12 || 12}:${m} ${ampm}`
// }

// function Dashboard() {
//   const { user, logout, loading } = useAuth()
//   const navigate = useNavigate()

//   // ALL hooks at top — before any return
//   const [todayAttendance, setTodayAttendance] = useState(null)
//   const [myTasks,         setMyTasks]         = useState([])
//   const [attendanceBusy,  setAttendanceBusy]  = useState(false)
//   const [attendanceMsg,   setAttendanceMsg]   = useState('')
//   const [attendanceErr,   setAttendanceErr]   = useState('')

//   const isIntern  = user?.role_id === 4
//   const isManager = user?.role_id === 1 || user?.role_id === 2

//   // useEffect(() => {
//     // Only fetch attendance for interns
//   //   if (isIntern) {
//   //     api.get('/attendance/today').then(r => setTodayAttendance(r.data.data)).catch(() => {})
//   //   }
//   //   // Fetch tasks for everyone
//   //   if (isManager) {
//   //     api.get('/manager/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => {})
//   //   }
//   // }, [isIntern, isManager])
//   useEffect(() => {
//   if (isIntern) {
//     api.get('/attendance/today').then(r => setTodayAttendance(r.data.data)).catch(() => {})
//     api.get('/attendance/history').then(r => setAttendanceHistory(r.data.data || [])).catch(() => {})
//     api.get('/intern/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => {})
//   }
//   if (isManager) {
//     api.get('/manager/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => {})
//     api.get('/manager/interns').then(r => setInterns(r.data.data || [])).catch(() => {})
//   }
// }, [isIntern, isManager])

//   if (loading) return <div style={{ padding: '30px' }}>Loading...</div>

//   const role = user?.role || 'Intern'
//   const remainingDays = daysRemaining()
//   const greeting = getGreeting()
//   const checkedIn  = !!todayAttendance?.check_in_time
//   const checkedOut = !!todayAttendance?.check_out_time

//   const handleCheckIn = async () => {
//     setAttendanceBusy(true)
//     setAttendanceMsg('')
//     setAttendanceErr('')
//     try {
//       const res = await api.post('/attendance/checkin')
//       setAttendanceMsg(res.data.message)
//       const r = await api.get('/attendance/today')
//       setTodayAttendance(r.data.data)
//     } catch (err) {
//       setAttendanceErr(err.response?.data?.message || 'Check-in failed')
//     } finally {
//       setAttendanceBusy(false)
//     }
//   }

//   const handleCheckOut = async () => {
//     setAttendanceBusy(true)
//     setAttendanceMsg('')
//     setAttendanceErr('')
//     try {
//       const res = await api.post('/attendance/checkout')
//       setAttendanceMsg(res.data.message)
//       const r = await api.get('/attendance/today')
//       setTodayAttendance(r.data.data)
//     } catch (err) {
//       setAttendanceErr(err.response?.data?.message || 'Check-out failed')
//     } finally {
//       setAttendanceBusy(false)
//     }
//   }

//   const handleLogout = async () => {
//     await logout()
//     navigate('/login')
//   }

//   const pendingTasks = myTasks.filter(t => t.status !== 'completed').length

//   return (
//     <div className="dashboard">

//       {/* ── HERO HEADER BANNER ── */}
//       <div style={{
//         background: 'linear-gradient(135deg, #003b5c 0%, #00b1b4 60%, #ffd34d 100%)',
//         borderRadius: 16, padding: '28px 32px', marginBottom: 24,
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         flexWrap: 'wrap', gap: 16,
//       }}>
//         {/* Left — greeting */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
//           <div style={{
//             width: 52, height: 52, borderRadius: 14,
//             background: 'rgba(255,255,255,0.2)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             fontSize: 26,
//           }}>
//             {greeting.icon}
//           </div>
//           <div>
//             <h2 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700 }}>
//               {greeting.text}, {user?.name?.split(' ')[0]}!
//             </h2>
//             <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
//               {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
//               &nbsp;|&nbsp;Let's make today productive
//             </p>
//           </div>
//         </div>

//         {/* Right — quick status pills */}
//         <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//           {/* Attendance pill — interns only */}
//          {isIntern && (
//   <button
//     onClick={checkedIn && !checkedOut ? handleCheckOut : !checkedIn ? handleCheckIn : undefined}
//     disabled={attendanceBusy || checkedOut}
//     style={{
//       background: checkedOut ? 'rgba(255,255,255,0.15)' : checkedIn ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)',
//       border: checkedIn && !checkedOut ? '1.5px solid #22c55e' : '1.5px solid rgba(255,255,255,0.3)',
//       borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13,
//       display: 'flex', alignItems: 'center', gap: 8,
//       cursor: checkedOut ? 'default' : 'pointer',
//       backdropFilter: 'blur(6px)', fontWeight: 600,
//       transition: 'all 0.2s',
//     }}
//   >
//     <span>⏰</span>
//     {checkedOut
//       ? <span>Punched out <span style={{ background: '#6b7280', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>✓</span></span>
//       : checkedIn
//       ? <span>Punched in — <span style={{ textDecoration: 'underline', fontSize: 12 }}>tap to punch out</span> <span style={{ background: '#22c55e', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>✓</span></span>
//       : <span style={{ opacity: 0.85 }}>Not punched in — tap to punch in</span>
//     }
//   </button>
// )}

//           {/* Tasks pill — managers */}
//           {isManager && (
//   <button
//     onClick={() => navigate('/manager')}
//     style={{
//       background: 'rgba(255,255,255,0.15)', borderRadius: 10,
//       padding: '10px 18px', color: '#fff', fontSize: 13,
//       display: 'flex', alignItems: 'center', gap: 8,
//       backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.3)',
//       cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
//     }}
//     onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
//     onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
//   >
//     <span>📅</span>
//     <span>{pendingTasks} Task{pendingTasks !== 1 ? 's' : ''} to review →</span>
//   </button>
// )}
//           {/* Role pill */}
//           <div style={{
//             background: 'rgba(255,255,255,0.15)', borderRadius: 10,
//             padding: '10px 18px', color: '#fff', fontSize: 13,
//             display: 'flex', alignItems: 'center', gap: 8,
//           }}>
//             <span>👤</span>
//             <span>{role}</span>
//           </div>
//         </div>
//       </div>

//       {/* ── INTERN ATTENDANCE CARD — only shown to interns ── */}
//       {isIntern && (
//         <section className="card" style={{ marginBottom: 24 }}>
//           <div className="card-header">
//             <div>
//               <h3>Today's Attendance</h3>
//               <p>Mark your arrival and departure for today.</p>
//             </div>
//           </div>

//           {attendanceMsg && (
//             <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px',
//               borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✓ {attendanceMsg}</p>
//           )}
//           {attendanceErr && (
//             <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
//               borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✗ {attendanceErr}</p>
//           )}

//           <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

//             {/* Check In button */}
//             <button
//               onClick={handleCheckIn}
//               disabled={attendanceBusy || checkedIn}
//               style={{
//                 padding: '12px 28px', borderRadius: 10, border: 'none',
//                 fontSize: 15, fontWeight: 700,
//                 cursor: checkedIn ? 'not-allowed' : 'pointer',
//                 background: checkedIn ? '#e5e7eb' : '#00b1b4',
//                 color: checkedIn ? '#9ca3af' : '#fff',
//               }}
//             >
//               {checkedIn ? '✓ Checked In' : attendanceBusy ? 'Processing…' : '🟢 Check In'}
//             </button>

//             {/* Check Out button */}
//             <button
//               onClick={handleCheckOut}
//               disabled={attendanceBusy || !checkedIn || checkedOut}
//               style={{
//                 padding: '12px 28px', borderRadius: 10, border: 'none',
//                 fontSize: 15, fontWeight: 700,
//                 cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer',
//                 background: checkedOut ? '#e5e7eb' : checkedIn ? '#003b5c' : '#e5e7eb',
//                 color: (!checkedIn || checkedOut) ? '#9ca3af' : '#fff',
//               }}
//             >
//               {checkedOut ? '✓ Checked Out' : attendanceBusy ? 'Processing…' : '🔴 Check Out'}
//             </button>

//             {/* Time display */}
//             <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
//               <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 16px',
//                 border: '1px solid #e2e8f0', textAlign: 'center' }}>
//                 <div style={{ fontSize: 11, color: '#6b7280' }}>IN</div>
//                 <div style={{ fontWeight: 700, color: '#003b5c' }}>
//                   {formatTime(todayAttendance?.check_in_time)}
//                 </div>
//               </div>
//               <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 16px',
//                 border: '1px solid #e2e8f0', textAlign: 'center' }}>
//                 <div style={{ fontSize: 11, color: '#6b7280' }}>OUT</div>
//                 <div style={{ fontWeight: 700, color: '#003b5c' }}>
//                   {formatTime(todayAttendance?.check_out_time)}
//                 </div>
//               </div>
//               <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 16px',
//                 border: '1px solid #e2e8f0', textAlign: 'center' }}>
//                 <div style={{ fontSize: 11, color: '#6b7280' }}>STATUS</div>
//                 <div style={{ fontWeight: 700, fontSize: 13,
//                   color: todayAttendance ? '#16a34a' : '#9ca3af',
//                   textTransform: 'capitalize' }}>
//                   {todayAttendance?.status?.replace('_', ' ') || 'Not marked'}
//                 </div>
//               </div>
//             </div>

//             {/* Link to full attendance page */}
//             <button
//               onClick={() => navigate('/attendance')}
//               style={{
//                 marginLeft: 'auto', padding: '10px 18px', borderRadius: 8,
//                 border: '1px solid #00b1b4', background: 'transparent',
//                 color: '#00b1b4', cursor: 'pointer', fontSize: 13, fontWeight: 600,
//               }}
//             >
//               View Full History →
//             </button>
//           </div>
//         </section>
//       )}

//       {/* ── MAIN GRID ── */}
//       <div className="dashboard-grid">

//         {/* Summary Stats */}
//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Summary Overview</h3>
//               <p>Key numbers for the current internship batch.</p>
//             </div>
//           </div>
//           <div className="stats-grid">
//             {[
//               { label: 'Active Interns',                value: 42 },
//               { label: 'Buddies Assigned',              value: 38 },
//               { label: 'Managers',                      value: 9  },
//               { label: 'Internships Ending This Month', value: 6  },
//             ].map(item => (
//               <div key={item.label} className="stat-card">
//                 <div className="stat-label">{item.label}</div>
//                 <div className="stat-value">{item.value}</div>
//               </div>
//               ))}
//               {/* Charts — Intern */}
// {isIntern && (
//   <section className="card">
//     <div className="card-header"><div><h3>My Task Breakdown</h3><p>Status of all your tasks at a glance.</p></div></div>
//     <TaskDonutChart tasks={myTasks} />
//   </section>
// )}

// {isIntern && (
//   <section className="card">
//     <div className="card-header"><div><h3>My Attendance This Week</h3><p>Check-in and check-out times over last 7 days.</p></div></div>
//     <AttendanceLineChart history={attendanceHistory} />
//   </section>
// )}

// {/* Charts — Manager */}
// {isManager && (
//   <section className="card">
//     <div className="card-header"><div><h3>Intern Progress</h3><p>Average task completion per intern.</p></div></div>
//     <InternProgressChart interns={interns} tasks={myTasks} />
//   </section>
// )}

// {isManager && (
//   <section className="card">
//     <div className="card-header"><div><h3>Task Status Breakdown</h3><p>All tasks across your interns by status.</p></div></div>
//     <TaskStatusBarChart tasks={myTasks} />
//   </section>
// )}
//           </div>
//         </section>

//         {/* Work Log */}
//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Intern & Trainee Work Log</h3>
//               <p>Daily work logs to stay aligned with your buddy and manager.</p>
//             </div>
//           </div>
//           <div className="table-wrapper">
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>Intern / Trainee</th><th>Role</th><th>Buddy</th>
//                   <th>Date</th><th>Hours</th><th>Summary</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[
//                   { name: 'Ananya Sharma', role: 'Intern',   buddy: 'Rahul Verma',   date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
//                   { name: 'Rohan Singh',   role: 'Trainee',  buddy: 'Priya Nair',    date: '24 Feb 2026', hours: '6',   summary: 'Prepared daily MIS reports and data clean-up.' },
//                   { name: 'Mehak Kaur',    role: 'Intern',   buddy: 'Saurabh Gupta', date: '23 Feb 2026', hours: '8',   summary: 'Shadowed client meetings and documented minutes.' },
//                 ].map((entry, i) => (
//                   <tr key={i}>
//                     <td>{entry.name}</td><td>{entry.role}</td><td>{entry.buddy}</td>
//                     <td>{entry.date}</td><td>{entry.hours}</td><td>{entry.summary}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* Timeline */}
//         <section className="card">
//           <div className="card-header">
//             <div><h3>Internship Timeline</h3><p>Visualise how far you are into the internship.</p></div>
//           </div>
//           <div className="timeline">
//             <div className="timeline-labels">
//               <span>Start</span><span>Mid</span><span>End</span>
//             </div>
//             <div className="timeline-bar">
//               <div className="timeline-progress" style={{ width: '55%' }}></div>
//             </div>
//             <p className="timeline-caption">
//               Approx. 55% of the internship period is completed.{' '}
//               <strong>{remainingDays} days</strong> remaining.
//             </p>
//           </div>
//         </section>

//         {/* Manager View */}
//         {isManager && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Manager View</h3><p>Track interns mapped to you and their buddies.</p></div>
//             </div>
//             <ul className="list">
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Ananya Sharma</div>
//                   <div className="list-subtitle">Buddy: Rahul Verma · Track: Frontend</div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//             </ul>
//           </section>
//         )}

//         {/* Admin Panel */}
//         {role === 'Admin' && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Admin Actions</h3><p>Create, update and manage users across roles.</p></div>
//             </div>
//             <div className="admin-actions">
//               <button className="btn-primary btn-small">Create New User</button>
//               <button className="btn-secondary btn-small">Manage Managers</button>
//               <button className="btn-secondary btn-small">View Access Matrix</button>
//             </div>
//           </section>
//         )}

//       </div>
//     </div>
//   )
// }

// export default Dashboard


//  ---------------------------------------------- //


/*

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authcontext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../api/login_api.js";

function daysRemaining() {
  const today = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",").pop() || "");
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Wait until session check completes
  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  const role = user?.role || "Intern";
  const roleId = user?.role_id;
  const roleLabel = typeof role === "string" ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Intern";
  const remainingDays = daysRemaining();

  const [statsData, setStatsData] = useState({
    activeInterns: 42,
    buddiesAssigned: 38,
    managers: 9,
    internshipsEndingThisMonth: 6
  });
  const [myAssignedTasks, setMyAssignedTasks] = useState([]);
  const [taskSubmitLoadingId, setTaskSubmitLoadingId] = useState(null);
  const [taskSubmitError, setTaskSubmitError] = useState("");
  const [taskSubmitSuccess, setTaskSubmitSuccess] = useState("");
  const [viewTask, setViewTask] = useState(null);
  const [submitTask, setSubmitTask] = useState(null);
  const [submitFormError, setSubmitFormError] = useState("");
  const [submitForm, setSubmitForm] = useState({
    work_notes: "",
    status: "review",
    completion_percentage: 100,
    file: null
  });

  useEffect(() => {
    api.get("/users/stats")
      .then((res) => {
        const data = res.data?.data || {};
        setStatsData((prev) => ({
          ...prev,
          activeInterns: typeof data.activeInterns === "number" ? data.activeInterns : prev.activeInterns,
          buddiesAssigned: typeof data.buddiesAssigned === "number" ? data.buddiesAssigned : prev.buddiesAssigned,
          managers: typeof data.managers === "number" ? data.managers : prev.managers
        }));
      })
      .catch(() => {
        // Keep fallback values if stats endpoint fails.
      });
  }, []);

  useEffect(() => {
    if (roleId !== 4) return;

    api.get("/intern/tasks")
      .then((res) => {
        setMyAssignedTasks(res.data?.data || []);
      })
      .catch(() => {
        setTaskSubmitError("Failed to load assigned tasks");
      });
  }, [roleId]);

  const stats = [
    { label: "Active Interns", value: statsData.activeInterns },
    { label: "Buddies Assigned", value: statsData.buddiesAssigned },
    { label: "Managers", value: statsData.managers },
    { label: "Internships Ending This Month", value: statsData.internshipsEndingThisMonth },
  ];

  const workLog = [
    {
      // name: "Ananya Sharma",
      // role: "Intern",
      // buddy: "Rahul Verma",
      // date: "24 Feb 2026",
      // hours: "7.5",
      // summary: "Worked on UI for intern dashboard and bug fixes.",
    },
    {
      // name: "Rohan Singh",
      // role: "Trainee",
      // buddy: "Priya Nair",
      // date: "24 Feb 2026",
      // hours: "6",
      // summary: "Prepared daily MIS reports and data clean-up.",
    },
    {
      // name: "Mehak Kaur",
      // role: "Intern",
      // buddy: "Saurabh Gupta",
      // date: "23 Feb 2026",
      // hours: "8",
      // summary: "Shadowed client meetings and documented minutes.",
    },
  ];

  const showAdminPanel = roleId === 1;
  const showManagerPanel = roleId === 1 || roleId === 2;
  const showInternPanel = roleId === 4;

  const openSubmitTaskModal = (task) => {
    setSubmitTask(task);
    setSubmitFormError("");
    setSubmitForm({
      work_notes: "",
      status: "review",
      completion_percentage: task?.completion_percentage > 0 ? task.completion_percentage : 100,
      file: null
    });
  };

  const closeSubmitTaskModal = () => {
    setSubmitTask(null);
    setSubmitFormError("");
    setSubmitForm({
      work_notes: "",
      status: "review",
      completion_percentage: 100,
      file: null
    });
  };

  const submitMyTask = async (e) => {
    e.preventDefault();
    if (!submitTask) return;

    const workNotes = String(submitForm.work_notes || "").trim();
    if (!workNotes) {
      setSubmitFormError("Please write your work summary before submitting.");
      return;
    }

    setTaskSubmitLoadingId(submitTask.id);
    setTaskSubmitError("");
    setTaskSubmitSuccess("");
    setSubmitFormError("");

    try {
      const payload = {
        work_notes: workNotes,
        status: submitForm.status,
        completion_percentage: Number(submitForm.completion_percentage) || 0
      };

      if (submitForm.file) {
        const base64 = await fileToBase64(submitForm.file);
        payload.file = {
          name: submitForm.file.name,
          type: submitForm.file.type || "application/octet-stream",
          data: base64
        };
      }

      await api.post(`/intern/tasks/${submitTask.id}/submit`, payload);

      setMyAssignedTasks((prev) =>
        prev.map((task) =>
          task.id === submitTask.id
            ? {
                ...task,
                status: payload.status,
                completion_percentage: payload.completion_percentage
              }
            : task
        )
      );
      setTaskSubmitSuccess("Task submitted successfully");
      closeSubmitTaskModal();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit task";
      setTaskSubmitError(message);
      setSubmitFormError(message);
    } finally {
      setTaskSubmitLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Good day, {user?.name || "Team Member"}</h2>
          <p>
            Role:&nbsp;
            <span className="pill pill-soft">{roleLabel}</span>
          </p>
        </div>

        <div className="summary-badge">
          <span>Internship Time Remaining</span>
          <strong>{remainingDays} days</strong>
        </div>

        // {/* Logout Button */
//         <button
//           onClick={handleLogout}
//           style={{
//             marginLeft: "20px",
//             padding: "8px 14px",
//             backgroundColor: "#e53935 ",
//             color: "#fff",
//             border: "none",
//             cursor: "pointer",
//           }}
//         >
//           Logout
//         </button>
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

//         {showInternPanel && (
//           <section className="card">
//             <div className="card-header">
//               <div>
//                 <h3>My Assigned Tasks</h3>
//                 <p>Tasks assigned by your manager. Use Submit when your work is ready for review.</p>
//               </div>
//             </div>

//             {taskSubmitSuccess && (
//               <p style={{ color: "#16a34a", marginBottom: 12 }}>{taskSubmitSuccess}</p>
//             )}
//             {taskSubmitError && (
//               <p className="error-text" style={{ marginBottom: 12 }}>{taskSubmitError}</p>
//             )}

//             {myAssignedTasks.length === 0 ? (
//               <div style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af" }}>
//                 No tasks assigned yet.
//               </div>
//             ) : (
//               <div className="table-wrapper" style={{ overflowX: "auto", overflowY: "hidden" }}>
//                 <table className="table" style={{ minWidth: 860 }}>
//                   <thead>
//                     <tr>
//                       <th>Task</th>
//                       <th>Assigned By</th>
//                       <th>Due Date</th>
//                       <th>Status</th>
//                       <th>Progress</th>
//                       <th>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {myAssignedTasks.map((task) => {
//                       const isSubmitted = task.status === "review" || task.status === "completed";
//                       return (
//                         <tr key={task.id}>
//                           <td>
//                             <strong>{task.title}</strong>
//                             {task.tech_stack ? <div style={{ fontSize: 12, color: "#6b7280" }}>{task.tech_stack}</div> : null}
//                           </td>
//                           <td>{task.assigner?.name || `User #${task.assigned_by}`}</td>
//                           <td>{task.due_date || "-"}</td>
//                           <td style={{ textTransform: "capitalize" }}>{String(task.status || "").replace("_", " ")}</td>
//                           <td>{task.completion_percentage || 0}%</td>
//                           <td>
//                             <div style={{ display: "flex", gap: 8 }}>
//                               <button
//                                 className="btn-secondary btn-small"
//                                 onClick={() => setViewTask(task)}
//                               >
//                                 View Task
//                               </button>
//                               <button
//                                 className="btn-primary btn-small"
//                                 onClick={() => openSubmitTaskModal(task)}
//                                 disabled={isSubmitted || taskSubmitLoadingId === task.id}
//                               >
//                                 {taskSubmitLoadingId === task.id ? "Submitting..." : isSubmitted ? "Submitted" : "Submit"}
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}

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
//                 style={{ width: "55%" }}
//               ></div>
//             </div>

//             <p className="timeline-caption">
//               Approx. 55% of the internship period is completed.{" "}
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

//       {viewTask && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1000,
//             padding: 16
//           }}
//         >
//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 16,
//               padding: 24,
//               width: "100%",
//               maxWidth: 560,
//               boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
//             }}
//           >
//             <h3 style={{ marginTop: 0, marginBottom: 12 }}>{viewTask.title}</h3>
//             <p style={{ marginTop: 0, color: "#4b5563" }}>{viewTask.description || "No description provided."}</p>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14 }}>
//               <div><strong>Assigned By:</strong> {viewTask.assigner?.name || `User #${viewTask.assigned_by}`}</div>
//               <div><strong>Due Date:</strong> {viewTask.due_date || "-"}</div>
//               <div><strong>Status:</strong> {String(viewTask.status || "").replace("_", " ")}</div>
//               <div><strong>Priority:</strong> {viewTask.priority || "-"}</div>
//               <div><strong>Progress:</strong> {viewTask.completion_percentage || 0}%</div>
//               <div><strong>Project ID:</strong> {viewTask.project_id || "-"}</div>
//               <div><strong>Start Date:</strong> {viewTask.start_date || "-"}</div>
//               <div><strong>Tech Stack:</strong> {viewTask.tech_stack || "-"}</div>
//             </div>
//             <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
//               <button className="btn-secondary btn-small" onClick={() => setViewTask(null)}>
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {submitTask && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1100,
//             padding: 16
//           }}
//         >
//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 16,
//               padding: 24,
//               width: "100%",
//               maxWidth: 560,
//               boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
//               maxHeight: "90vh",
//               overflowY: "auto"
//             }}
//           >
//             <h3 style={{ marginTop: 0, marginBottom: 8 }}>Submit Task Work</h3>
//             <p style={{ marginTop: 0, color: "#6b7280", marginBottom: 16 }}>
//               <strong>{submitTask.title}</strong>
//             </p>

//             <form onSubmit={submitMyTask} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//               <div className="form-group" style={{ marginBottom: 0 }}>
//                 <label>Work Summary *</label>
//                 <textarea
//                   value={submitForm.work_notes}
//                   onChange={(e) =>
//                     setSubmitForm((prev) => ({ ...prev, work_notes: e.target.value }))
//                   }
//                   rows={5}
//                   placeholder="Describe what you completed, challenges faced, and current result."
//                   required
//                   style={{
//                     width: "100%",
//                     borderRadius: 10,
//                     border: "1px solid #dde3f0",
//                     padding: "10px 12px",
//                     fontSize: 14,
//                     fontFamily: "inherit",
//                     resize: "vertical"
//                   }}
//                 />
//               </div>

//               <div className="grid-2">
//                 <div className="form-group" style={{ marginBottom: 0 }}>
//                   <label>Status</label>
//                   <select
//                     value={submitForm.status}
//                     onChange={(e) =>
//                       setSubmitForm((prev) => ({
//                         ...prev,
//                         status: e.target.value,
//                         completion_percentage: e.target.value === "completed" ? 100 : prev.completion_percentage
//                       }))
//                     }
//                   >
//                     <option value="in_progress">In Progress</option>
//                     <option value="review">Review</option>
//                     <option value="completed">Completed</option>
//                   </select>
//                 </div>

//                 <div className="form-group" style={{ marginBottom: 0 }}>
//                   <label>Completion %</label>
//                   <input
//                     type="number"
//                     min={0}
//                     max={100}
//                     value={submitForm.completion_percentage}
//                     disabled={submitForm.status === "completed"}
//                     onChange={(e) =>
//                       setSubmitForm((prev) => ({ ...prev, completion_percentage: e.target.value }))
//                     }
//                   />
//                 </div>
//               </div>

//               <div className="form-group" style={{ marginBottom: 0 }}>
//                 <label>Attachment (optional)</label>
//                 <input
//                   type="file"
//                   onChange={(e) =>
//                     setSubmitForm((prev) => ({
//                       ...prev,
//                       file: e.target.files && e.target.files[0] ? e.target.files[0] : null
//                     }))
//                   }
//                 />
//                 {submitForm.file ? (
//                   <div style={{ fontSize: 12, color: "#6b7280" }}>{submitForm.file.name}</div>
//                 ) : null}
//               </div>

//               {submitFormError && (
//                 <p className="error-text" style={{ margin: 0 }}>{submitFormError}</p>
//               )}

//               <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
//                 <button type="button" className="btn-secondary" onClick={closeSubmitTaskModal}>
//                   Cancel
//                 </button>
//                 <button type="submit" className="btn-primary" disabled={taskSubmitLoadingId === submitTask.id}>
//                   {taskSubmitLoadingId === submitTask.id ? "Submitting..." : "Submit Task"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Dashboard;

// /*


/////////////////////////
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

//////////////////////

//  function Dashboard() {
//   const { user } = useAuth();  // ← get user from context, not props
//   const role = user?.role || "Intern";

//   // ... rest of your existing Dashboard code stays exactly the same
// ```

// ---

// ## Final Folder Structure After All Changes
// ```
// backend/src/
//   api/v1/
//     Controllers/
//       auth.controller.js   ← UPDATED (JWT, /me, /logout)
//       user.controller.js   ← unchanged
//     Routes/
//       auth.route.js        ← UPDATED (added /me, /logout routes)
//       user.routes.js       ← UPDATED (added role-protected routes)
//     Models/ ...unchanged
//   middlewares/
//     auth.middleware.js     ← UPDATED (reads cookie, correct paths)
//     role.middleware.js     ← NEW (requireAdmin, requireManager, etc.)

// frontend/src/
//   context/
//     AuthContext.jsx        ← NEW
//   components/
//     Layout.jsx             ← UPDATED (uses useAuth)
//     ProtectedRoute.jsx     ← NEW
//   pages/
//     Login.jsx              ← UPDATED (uses useAuth)
//     Dashboard.jsx          ← UPDATED (uses useAuth)
//   App.jsx                  ← UPDATED (uses useAuth + ProtectedRoute)
//   main.jsx                 ← UPDATED (wraps in AuthProvider)
// ```

// ---

// ## How it all flows
// ```
// User visits /dashboard
//   → ProtectedRoute checks useAuth()
//   → AuthContext called /me on startup
//   → If cookie exists → user is set → page loads
//   → If no cookie → redirect to /login

// User logs in
//   → POST /auth/login → backend sets httpOnly cookie
//   → frontend stores user in AuthContext state
//   → navigate to /dashboard

// User refreshes page
//   → AuthContext useEffect calls GET /auth/me
//   → Backend reads cookie → returns user data
//   → User state restored → no redirect to login

// User logs out
//   → POST /auth/logout → backend clears cookie
//   → AuthContext sets user to null
//   → navigate to /login

