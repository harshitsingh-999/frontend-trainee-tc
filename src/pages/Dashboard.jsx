import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/authcontext.jsx'
import { useNavigate } from 'react-router-dom'
import api from '../api/login_api.js'

function calculateDaysRemaining(endDate) {
  if (!endDate) return null
  const today = new Date()
  const end = new Date(endDate)
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
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

  // ── ALL hooks must be at the top, before any early return ──
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [attendanceBusy, setAttendanceBusy] = useState(false)
  const [attendanceMsg, setAttendanceMsg] = useState('')
  const [attendanceErr, setAttendanceErr] = useState('')
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [interns, setInterns] = useState([])
  const [chartsReady, setChartsReady] = useState(false)
  const [trainee, setTrainee] = useState(null)
  const [traineeLoading, setTraineeLoading] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [recentLoading, setRecentLoading] = useState(false)

  const isIntern = user?.role_id === 4
  const isManager = user?.role_id === 1 || user?.role_id === 2

  // Load recharts lazily — won't crash if not installed yet
  useEffect(() => {
    import('./charts.jsx')
      .then(mod => { setChartComponents(mod); setChartsReady(true) })
      .catch(() => setChartsReady(false))
  }, [])

  useEffect(() => {
    if (isIntern) {
      setTraineeLoading(true)
      api.get('/attendance/today').then(r => setTodayAttendance(r.data.data)).catch(() => { })
      api.get('/attendance/history').then(r => setAttendanceHistory(r.data.data || [])).catch(() => { })
      api.get('/intern/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => { })
      api.get('/intern/profile')
        .then(r => setTrainee(r.data.data?.trainee || null))
        .catch(() => { })
        .finally(() => setTraineeLoading(false))
      
      setRecentLoading(true)
      api.get('/intern/recent-submissions')
        .then(r => setRecentSubmissions(r.data.data || []))
        .catch(() => { })
        .finally(() => setRecentLoading(false))
    }
    if (isManager) {
      api.get('/manager/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => { })
      api.get('/manager/interns').then(r => setInterns(r.data.data || [])).catch(() => { })
      
      setRecentLoading(true)
      api.get('/manager/recent-submissions')
        .then(r => setRecentSubmissions(r.data.data || []))
        .catch(() => { })
        .finally(() => setRecentLoading(false))
    }
  }, [isIntern, isManager])

  // Early returns AFTER all hooks
  if (loading) return <div style={{ padding: '30px' }}>Loading...</div>

  const role = user?.role || 'Intern'
  const remainingDays = isIntern ? calculateDaysRemaining(trainee?.expected_end_date) : null
  const greeting = getGreeting()
  const checkedIn = !!todayAttendance?.check_in_time
  const checkedOut = !!todayAttendance?.check_out_time
  const pendingTasks = myTasks.filter(t => t.status !== 'completed').length

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
    { name: 'Ananya Sharma', role: 'Intern', date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
    { name: 'Rohan Singh', role: 'Trainee', date: '24 Feb 2026', hours: '6', summary: 'Prepared daily MIS reports and data clean-up.' },
    { name: 'Mehak Kaur', role: 'Intern', date: '23 Feb 2026', hours: '8', summary: 'Shadowed client meetings and documented minutes.' },
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

          {isIntern && (
            <div
              onClick={() => navigate('/my-tasks?tab=timeline')}
              style={{
                background: remainingDays !== null && remainingDays <= 14 ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', border: remainingDays !== null && remainingDays <= 14 ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(6px)', fontWeight: 600,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 16 }}>{remainingDays !== null && remainingDays <= 14 ? '⚠️' : '⏳'}</span>
              <span>
                {remainingDays !== null
                  ? `${remainingDays} Days Left`
                  : traineeLoading ? 'Loading...' : 'End date not set'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── INTERN ATTENDANCE CARD ── */}
      {isIntern && (
        <section className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div><h3>Today's Attendance</h3><p>Mark your arrival and departure for today.</p></div>
          </div>
          {attendanceMsg && (
            <p style={{
              color: '#16a34a', background: '#f0fdf4', padding: '10px 14px',
              borderRadius: 8, marginBottom: 16, fontWeight: 600
            }}>✓ {attendanceMsg}</p>
          )}
          {attendanceErr && (
            <p style={{
              color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
              borderRadius: 8, marginBottom: 16, fontWeight: 600
            }}>✗ {attendanceErr}</p>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleCheckIn} disabled={attendanceBusy || checkedIn}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
                cursor: checkedIn ? 'not-allowed' : 'pointer',
                background: checkedIn ? '#e5e7eb' : '#00b1b4', color: checkedIn ? '#9ca3af' : '#fff'
              }}>
              {checkedIn ? '✓ Checked In' : attendanceBusy ? 'Processing…' : '🟢 Check In'}
            </button>
            <button onClick={handleCheckOut} disabled={attendanceBusy || !checkedIn || checkedOut}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
                cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer',
                background: checkedOut ? '#e5e7eb' : checkedIn ? '#003b5c' : '#e5e7eb',
                color: (!checkedIn || checkedOut) ? '#9ca3af' : '#fff'
              }}>
              {checkedOut ? '✓ Checked Out' : attendanceBusy ? 'Processing…' : '🔴 Check Out'}
            </button>
            <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
              {[
                { label: 'IN', value: formatTime(todayAttendance?.check_in_time) },
                { label: 'OUT', value: formatTime(todayAttendance?.check_out_time) },
                { label: 'STATUS', value: todayAttendance?.status?.replace('_', ' ') || 'Not marked' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: '#f8fafc', borderRadius: 8, padding: '8px 16px',
                  border: '1px solid #e2e8f0', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
                  <div style={{ fontWeight: 700, color: '#003b5c', textTransform: 'capitalize', fontSize: 13 }}>{value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/attendance')}
              style={{
                marginLeft: 'auto', padding: '10px 18px', borderRadius: 8,
                border: '1px solid #00b1b4', background: 'transparent',
                color: '#00b1b4', cursor: 'pointer', fontSize: 13, fontWeight: 600
              }}>
              View Full History →
            </button>
          </div>
        </section>
      )}

      {/* ── MAIN GRID ── */}
      <div className="dashboard-grid">

        {/* Summary Stats — real data from UserContext */}
        {/* <section className="card">
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
        </section> */}

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
                {recentLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading work logs...</td></tr>
                ) : recentSubmissions.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No work logs found yet.</td></tr>
                ) : (
                  recentSubmissions.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontWeight: 600, color: '#003b5c' }}>{isManager ? entry.intern?.name : user?.name}</td>
                      <td>{isManager ? (entry.intern?.role_id === 4 ? 'Intern' : 'Trainee') : role}</td>
                      <td>{entry.intern?.trainee?.buddy?.name || '—'}</td>
                      <td>{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>—</td>
                      <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.work_notes}>
                        <strong>{entry.task?.title}:</strong> {entry.work_notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Internship Timeline */}
        {/* <section className="card">
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
        </section> */}

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

