// import React, { useState, useEffect } from 'react'
// import { useAuth } from '../context/authcontext.jsx'
// import { useNavigate } from 'react-router-dom'
// import api from '../api/login_api.js'

// function calculateDaysRemaining(endDate) {
//   if (!endDate) return null
//   const today = new Date()
//   const end = new Date(endDate)
//   const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
//   return Math.max(0, diff)
// }

// function getGreeting() {
//   const h = new Date().getHours()
//   if (h < 12) return { text: 'Good Morning', icon: 'ðŸŒ…' }
//   if (h < 17) return { text: 'Good Afternoon', icon: 'â˜€ï¸' }
//   return { text: 'Good Evening', icon: 'ðŸŒ™' }
// }

// function formatTime(time) {
//   if (!time) return 'â€”'
//   const [h, m] = time.split(':')
//   const hour = parseInt(h)
//   const ampm = hour >= 12 ? 'PM' : 'AM'
//   return `${hour % 12 || 12}:${m} ${ampm}`
// }

// function Dashboard() {
//   const { user, logout, loading } = useAuth()
//   const navigate = useNavigate()

//   // â”€â”€ ALL hooks must be at the top, before any early return â”€â”€
//   const [todayAttendance, setTodayAttendance] = useState(null)
//   const [myTasks, setMyTasks] = useState([])
//   const [attendanceBusy, setAttendanceBusy] = useState(false)
//   const [attendanceMsg, setAttendanceMsg] = useState('')
//   const [attendanceErr, setAttendanceErr] = useState('')
//   const [attendanceHistory, setAttendanceHistory] = useState([])
//   const [interns, setInterns] = useState([])
//   const [chartsReady, setChartsReady] = useState(false)
//   const [trainee, setTrainee] = useState(null)
//   const [traineeLoading, setTraineeLoading] = useState(false)
//   const [recentSubmissions, setRecentSubmissions] = useState([])
//   const [recentLoading, setRecentLoading] = useState(false)

//   const isIntern = user?.role_id === 4
//   const isManager = user?.role_id === 1 || user?.role_id === 2

//   // Load recharts lazily â€” won't crash if not installed yet
//   useEffect(() => {
//     import('./charts.jsx')
//       .then(mod => { setChartComponents(mod); setChartsReady(true) })
//       .catch(() => setChartsReady(false))
//   }, [])

//   useEffect(() => {
//     if (isIntern) {
//       setTraineeLoading(true)
//       api.get('/attendance/today').then(r => setTodayAttendance(r.data.data)).catch(() => { })
//       api.get('/attendance/history').then(r => setAttendanceHistory(r.data.data || [])).catch(() => { })
//       api.get('/intern/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => { })
//       api.get('/intern/profile')
//         .then(r => setTrainee(r.data.data?.trainee || null))
//         .catch(() => { })
//         .finally(() => setTraineeLoading(false))
      
//       setRecentLoading(true)
//       api.get('/intern/recent-submissions')
//         .then(r => setRecentSubmissions(r.data.data || []))
//         .catch(() => { })
//         .finally(() => setRecentLoading(false))
//     }
//     if (isManager) {
//       api.get('/manager/tasks').then(r => setMyTasks(r.data.data || [])).catch(() => { })
//       api.get('/manager/interns').then(r => setInterns(r.data.data || [])).catch(() => { })
      
//       setRecentLoading(true)
//       api.get('/manager/recent-submissions')
//         .then(r => setRecentSubmissions(r.data.data || []))
//         .catch(() => { })
//         .finally(() => setRecentLoading(false))
//     }
//   }, [isIntern, isManager])

//   // Poll intern profile every 2 minutes â€” picks up admin-extended internship dates without a full refresh
//   useEffect(() => {
//     if (!isIntern) return
//     const id = setInterval(() => {
//       api.get('/intern/profile')
//         .then(r => setTrainee(r.data.data?.trainee || null))
//         .catch(() => {})
//     }, 120000)
//     return () => clearInterval(id)
//   }, [isIntern])

//   // Early returns AFTER all hooks
//   if (loading) return <div style={{ padding: '30px' }}>Loading...</div>

//   const role = user?.role || 'Intern'
//   const remainingDays = isIntern ? calculateDaysRemaining(trainee?.expected_end_date) : null
//   const greeting = getGreeting()
//   const checkedIn = !!todayAttendance?.check_in_time
//   const checkedOut = !!todayAttendance?.check_out_time
//   const pendingTasks = myTasks.filter(t => t.status !== 'completed').length

//   // Check if internship is expired â€” compare against actual date so admin extensions are respected
//   const isInternshipExpired = isIntern && !traineeLoading &&
//     trainee?.expected_end_date &&
//     new Date(trainee.expected_end_date) < new Date(new Date().toDateString())

//   if (isInternshipExpired) {
//     return (
//       <div style={{
//         minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
//         flexDirection: 'column', gap: 24, padding: 32, textAlign: 'center',
//       }}>
//         <div style={{
//           background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480,
//           boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #fecaca',
//         }}>
//           <div style={{ fontSize: 56, marginBottom: 16 }}>ðŸŽ“</div>
//           <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
//             Internship Completed
//           </h2>
//           <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' }}>
//             Your internship period ended on <strong>{new Date(trainee.expected_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
//             <br /><br />
//             Your account is still active but functionality has been restricted.
//             Please contact your <strong>Admin</strong> or <strong>Manager</strong> for next steps.
//           </p>
//           <div style={{
//             background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10,
//             padding: '12px 16px', fontSize: 13, color: '#854d0e', fontWeight: 500,
//           }}>
//             ðŸ“§ Reach out to your admin/manager to extend or close your internship.
//           </div>
//           <button
//             onClick={async () => { await logout(); navigate('/login') }}
//             style={{
//               marginTop: 24, padding: '10px 28px', borderRadius: 10,
//               background: '#1f2937', color: '#fff', border: 'none',
//               fontSize: 14, fontWeight: 600, cursor: 'pointer',
//             }}>
//             Logout
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const handleCheckIn = async () => {
//     setAttendanceBusy(true); setAttendanceMsg(''); setAttendanceErr('')
//     try {
//       const res = await api.post('/attendance/checkin')
//       setAttendanceMsg(res.data.message)
//       const r = await api.get('/attendance/today')
//       setTodayAttendance(r.data.data)
//     } catch (err) {
//       setAttendanceErr(err.response?.data?.message || 'Check-in failed')
//     } finally { setAttendanceBusy(false) }
//   }

//   const handleCheckOut = async () => {
//     setAttendanceBusy(true); setAttendanceMsg(''); setAttendanceErr('')
//     try {
//       const res = await api.post('/attendance/checkout')
//       setAttendanceMsg(res.data.message)
//       const r = await api.get('/attendance/today')
//       setTodayAttendance(r.data.data)
//     } catch (err) {
//       setAttendanceErr(err.response?.data?.message || 'Check-out failed')
//     } finally { setAttendanceBusy(false) }
//   }

//   const handleLogout = async () => {
//     await logout()
//     navigate('/login')
//   }

//   // Work log data
//   // const workLog = [
//   //   { name: 'Ananya Sharma', role: 'Intern', date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
//   //   { name: 'Rohan Singh', role: 'Trainee', date: '24 Feb 2026', hours: '6', summary: 'Prepared daily MIS reports and data clean-up.' },
//   //   { name: 'Mehak Kaur', role: 'Intern', date: '23 Feb 2026', hours: '8', summary: 'Shadowed client meetings and documented minutes.' },
//   // ]

//   return (
//     <div className="dashboard">

//       {/* â”€â”€ HERO BANNER â”€â”€ */}
//       <div style={{
//         background: 'linear-gradient(135deg, #003b5c 0%, #00b1b4 60%, #ffd34d 100%)',
//         borderRadius: 16, padding: '28px 32px', marginBottom: 24,
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         flexWrap: 'wrap', gap: 16,
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
//           <div style={{
//             width: 52, height: 52, borderRadius: 14,
//             background: 'rgba(255,255,255,0.2)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
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

//         <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//           {isIntern && (
//             <button
//               onClick={checkedIn && !checkedOut ? handleCheckOut : !checkedIn ? handleCheckIn : undefined}
//               disabled={attendanceBusy || checkedOut}
//               style={{
//                 background: checkedOut ? 'rgba(255,255,255,0.15)' : checkedIn ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)',
//                 border: checkedIn && !checkedOut ? '1.5px solid #22c55e' : '1.5px solid rgba(255,255,255,0.3)',
//                 borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13,
//                 display: 'flex', alignItems: 'center', gap: 8,
//                 cursor: checkedOut ? 'default' : 'pointer',
//                 backdropFilter: 'blur(6px)', fontWeight: 600,
//               }}
//             >
//               <span>â°</span>
//               {checkedOut
//                 ? <span>Punched out âœ“</span>
//                 : checkedIn
//                   ? <span>Punched in â€” tap to punch out âœ“</span>
//                   : <span>Not punched in â€” tap to punch in</span>
//               }
//             </button>
//           )}

//           {isManager && (
//             <button
//               onClick={() => navigate('/manager')}
//               style={{
//                 background: 'rgba(255,255,255,0.15)', borderRadius: 10,
//                 padding: '10px 18px', color: '#fff', fontSize: 13,
//                 display: 'flex', alignItems: 'center', gap: 8,
//                 backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.3)',
//                 cursor: 'pointer', fontWeight: 600,
//               }}
//             >
//               <span>ðŸ“…</span>
//               <span>{pendingTasks} Task{pendingTasks !== 1 ? 's' : ''} to review â†’</span>
//             </button>
//           )}

//           <div style={{
//             background: 'rgba(255,255,255,0.15)', borderRadius: 10,
//             padding: '10px 18px', color: '#fff', fontSize: 13,
//             display: 'flex', alignItems: 'center', gap: 8,
//           }}>
//             <span>ðŸ‘¤</span><span>{role}</span>
//           </div>

//           {isIntern && (
//             <div
//               onClick={() => navigate('/my-tasks?tab=timeline')}
//               style={{
//                 background: remainingDays !== null && remainingDays <= 14 ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.15)',
//                 borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13,
//                 display: 'flex', alignItems: 'center', gap: 8,
//                 cursor: 'pointer', border: remainingDays !== null && remainingDays <= 14 ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.3)',
//                 backdropFilter: 'blur(6px)', fontWeight: 600,
//                 transition: 'transform 0.2s',
//               }}
//               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
//               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
//             >
//               <span style={{ fontSize: 16 }}>{remainingDays !== null && remainingDays <= 14 ? 'âš ï¸' : 'â³'}</span>
//               <span>
//                 {remainingDays !== null
//                   ? `${remainingDays} Days Left`
//                   : traineeLoading ? 'Loading...' : 'End date not set'}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* â”€â”€ INTERN ATTENDANCE CARD â”€â”€ */}
//       {isIntern && (
//         <section className="card" style={{ marginBottom: 24 }}>
//           <div className="card-header">
//             <div><h3>Today's Attendance</h3><p>Mark your arrival and departure for today.</p></div>
//           </div>
//           {attendanceMsg && (
//             <p style={{
//               color: '#16a34a', background: '#f0fdf4', padding: '10px 14px',
//               borderRadius: 8, marginBottom: 16, fontWeight: 600
//             }}>âœ“ {attendanceMsg}</p>
//           )}
//           {attendanceErr && (
//             <p style={{
//               color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
//               borderRadius: 8, marginBottom: 16, fontWeight: 600
//             }}>âœ— {attendanceErr}</p>
//           )}
//           <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
//             <button onClick={handleCheckIn} disabled={attendanceBusy || checkedIn}
//               style={{
//                 padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
//                 cursor: checkedIn ? 'not-allowed' : 'pointer',
//                 background: checkedIn ? '#e5e7eb' : '#00b1b4', color: checkedIn ? '#9ca3af' : '#fff'
//               }}>
//               {checkedIn ? 'âœ“ Checked In' : attendanceBusy ? 'Processingâ€¦' : 'ðŸŸ¢ Check In'}
//             </button>
//             <button onClick={handleCheckOut} disabled={attendanceBusy || !checkedIn || checkedOut}
//               style={{
//                 padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
//                 cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer',
//                 background: checkedOut ? '#e5e7eb' : checkedIn ? '#003b5c' : '#e5e7eb',
//                 color: (!checkedIn || checkedOut) ? '#9ca3af' : '#fff'
//               }}>
//               {checkedOut ? 'âœ“ Checked Out' : attendanceBusy ? 'Processingâ€¦' : 'ðŸ”´ Check Out'}
//             </button>
//             <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
//               {[
//                 { label: 'IN', value: formatTime(todayAttendance?.check_in_time) },
//                 { label: 'OUT', value: formatTime(todayAttendance?.check_out_time) },
//                 { label: 'STATUS', value: todayAttendance?.status?.replace('_', ' ') || 'Not marked' },
//               ].map(({ label, value }) => (
//                 <div key={label} style={{
//                   background: '#f8fafc', borderRadius: 8, padding: '8px 16px',
//                   border: '1px solid #e2e8f0', textAlign: 'center'
//                 }}>
//                   <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
//                   <div style={{ fontWeight: 700, color: '#003b5c', textTransform: 'capitalize', fontSize: 13 }}>{value}</div>
//                 </div>
//               ))}
//             </div>
//             <button onClick={() => navigate('/attendance')}
//               style={{
//                 marginLeft: 'auto', padding: '10px 18px', borderRadius: 8,
//                 border: '1px solid #00b1b4', background: 'transparent',
//                 color: '#00b1b4', cursor: 'pointer', fontSize: 13, fontWeight: 600
//               }}>
//               View Full History â†’
//             </button>
//           </div>
//         </section>
//       )}

//       {/* â”€â”€ MAIN GRID â”€â”€ */}
//       <div className="dashboard-grid">

//         {/* Summary Stats â€” real data from UserContext */}
//         {/* <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Summary Overview</h3>
//               <p>Real-time data from your user management system ({users.length} Total Users)</p>
//             </div>
//             <button onClick={() => fetchUsers()} disabled={usersLoading}
//               style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}>
//               {usersLoading ? 'â†» Loading...' : 'â†» Refresh'}
//             </button>
//           </div>
//           {usersError && <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>Error: {usersError}</div>}
//           <div className="stats-grid">
//             {usersLoading && stats.length === 0 ? (
//               <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>Loading user data...</div>
//             ) : stats.map(item => (
//               <div key={item.label} className="stat-card">
//                 <div className="stat-label">{item.label}</div>
//                 <div className="stat-value">{item.value}</div>
//               </div>
//             ))}
//           </div>
//         </section> */}

//         {/* â”€â”€ INTERN MY TASKS â”€â”€ */}
// {isIntern && (
//   <section className="card" style={{ marginBottom: 0 }}>
//     <div className="card-header">
//       <div>
//         <h3>My Tasks</h3>
//         <p>Tasks assigned to you by your manager.</p>
//       </div>
//       <button
//         onClick={() => navigate('/my-tasks')}
//         style={{
//           padding: '8px 16px', borderRadius: 8,
//           border: '1px solid #00b1b4', background: 'transparent',
//           color: '#00b1b4', cursor: 'pointer', fontSize: 13, fontWeight: 600
//         }}
//       >
//         View All â†’
//       </button>
//     </div>

//     {/* Stats row */}
//     <div className="stats-grid" style={{ marginBottom: 20 }}>
//       {[
//         { label: 'Total',       value: myTasks.length,                                                              color: '#003b5c' },
//         { label: 'In Progress', value: myTasks.filter(t => t.status === 'in_progress').length,                      color: '#2563eb' },
//         { label: 'Completed',   value: myTasks.filter(t => t.status === 'completed').length,                        color: '#16a34a' },
//         { label: 'Overdue',     value: myTasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length, color: '#dc2626' },
//       ].map(s => (
//         <div key={s.label} className="stat-card">
//           <div className="stat-label">{s.label}</div>
//           <div className="stat-value" style={{ color: s.value > 0 && s.label === 'Overdue' ? '#dc2626' : s.color }}>
//             {s.value}
//           </div>
//         </div>
//       ))}
//     </div>

//     {/* Task list */}
//     {myTasks.length === 0 ? (
//       <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
//         <div style={{ fontSize: 40, marginBottom: 8 }}>ðŸ“‹</div>
//         <p>No tasks assigned yet.</p>
//       </div>
//     ) : (
//       <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//         {myTasks.slice(0, 5).map(task => {
//           const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed'
//           const statusColors = {
//             todo:        { bg: '#f1f5f9', color: '#475569' },
//             in_progress: { bg: '#eff6ff', color: '#2563eb' },
//             review:      { bg: '#faf5ff', color: '#7c3aed' },
//             completed:   { bg: '#f0fdf4', color: '#16a34a' },
//             blocked:     { bg: '#fef2f2', color: '#dc2626' },
//             rejected:    { bg: '#fef2f2', color: '#dc2626' },
//           }
//           const s = statusColors[task.status] || statusColors.todo
//           return (
//             <div key={task.id} style={{
//               border: '1px solid #e2e8f0',
//               borderLeft: `4px solid ${task.status === 'completed' ? '#16a34a' : isOverdue ? '#dc2626' : '#00b1b4'}`,
//               borderRadius: 10, padding: '14px 16px',
//               background: '#fafafa',
//               display: 'flex', justifyContent: 'space-between',
//               alignItems: 'center', flexWrap: 'wrap', gap: 10,
//             }}>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontWeight: 700, color: '#003b5c', fontSize: 14, marginBottom: 4 }}>
//                   {task.title}
//                   {isOverdue && (
//                     <span style={{ marginLeft: 8, fontSize: 11, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 5, padding: '1px 7px', fontWeight: 600 }}>
//                       âš  Overdue
//                     </span>
//                   )}
//                 </div>
//                 <div style={{ fontSize: 12, color: '#6b7280' }}>
//                   Due: <strong style={{ color: isOverdue ? '#dc2626' : '#374151' }}>{task.due_date || 'â€”'}</strong>
//                   {task.tech_stack && <span style={{ marginLeft: 12 }}>ðŸ›  {task.tech_stack}</span>}
//                 </div>
//                 {/* Progress bar */}
//                 <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
//                   <div style={{ width: 120, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
//                     <div style={{ height: '100%', background: '#00b1b4', borderRadius: 99, width: `${task.completion_percentage || 0}%` }} />
//                   </div>
//                   <span style={{ fontSize: 11, color: '#6b7280' }}>{task.completion_percentage || 0}%</span>
//                 </div>
//               </div>
//               <span style={{
//                 background: s.bg, color: s.color,
//                 borderRadius: 6, padding: '3px 12px',
//                 fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
//                 whiteSpace: 'nowrap',
//               }}>
//                 {task.status?.replace('_', ' ')}
//               </span>
//             </div>
//           )
//         })}
//         {myTasks.length > 5 && (
//           <button
//             onClick={() => navigate('/my-tasks')}
//             style={{
//               padding: '10px', borderRadius: 8, border: '1px dashed #e2e8f0',
//               background: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: 13,
//             }}
//           >
//             + {myTasks.length - 5} more tasks â€” View All
//           </button>
//         )}
//       </div>
//     )}
//   </section>
// )}

//         {/* Intern Charts */}
//         {isIntern && chartsReady && ChartComponents && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>My Task Breakdown</h3><p>Status of all your tasks at a glance.</p></div>
//             </div>
//             <ChartComponents.TaskDonutChart tasks={myTasks} />
//           </section>
//         )}

//         {isIntern && chartsReady && ChartComponents && attendanceHistory.length > 0 && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Attendance This Week</h3><p>Check-in & check-out times over last 7 days.</p></div>
//             </div>
//             <ChartComponents.AttendanceLineChart history={attendanceHistory} />
//           </section>
//         )}

//         {/* Manager Charts */}
//         {isManager && chartsReady && ChartComponents && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Intern Progress</h3><p>Average task completion per intern.</p></div>
//             </div>
//             <ChartComponents.InternProgressChart interns={interns} tasks={myTasks} />
//           </section>
//         )}

//         {isManager && chartsReady && ChartComponents && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Task Status Breakdown</h3><p>All tasks by current status.</p></div>
//             </div>
//             <ChartComponents.TaskStatusBarChart tasks={myTasks} />
//           </section>
//         )}

//         {/* Work Log */}
//         {/* <section className="card">
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
//                 {recentLoading ? (
//                   <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading work logs...</td></tr>
//                 ) : recentSubmissions.length === 0 ? (
//                   <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No work logs found yet.</td></tr>
//                 ) : (
//                   recentSubmissions.map((entry) => (
//                     <tr key={entry.id}>
//                       <td style={{ fontWeight: 600, color: '#003b5c' }}>{isManager ? entry.intern?.name : user?.name}</td>
//                       <td>{isManager ? (entry.intern?.role_id === 4 ? 'Intern' : 'Trainee') : role}</td>
//                       <td>{entry.intern?.trainee?.buddy?.name || 'â€”'}</td>
//                       <td>{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
//                       <td>â€”</td>
//                       <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.work_notes}>
//                         <strong>{entry.task?.title}:</strong> {entry.work_notes}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section> */}

//         {/* Internship Timeline */}
//         {/* <section className="card">
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
//         </section> */}

//         {/* Manager View */}
//         {/* {isManager && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Manager View</h3><p>Track interns mapped to you and their buddies.</p></div>
//             </div>
//             <ul className="list">
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Ananya Sharma</div>
//                   <div className="list-subtitle">Buddy: Rahul Verma Â· Track: Frontend</div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Rohan Singh</div>
//                   <div className="list-subtitle">Track: Data &amp; Reporting</div>
//                 </div>
//                 <span className="pill pill-amber">Needs Attention</span>
//               </li>
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Mehak Kaur</div>
//                   <div className="list-subtitle">Track: Pre-sales</div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//             </ul>
//           </section>
//         )} */}
//         {isManager && (
//         <section className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/manager')}>
//          <div className="card-header">
//          <div><h3>My Interns</h3><p>Interns currently under your supervision.</p></div>
//          </div>
//          <div style={{ fontSize: 48, fontWeight: 800, color: '#00b1b4', padding: '12px 0' }}>
//          {interns.length}
//           </div>
//          <p style={{ color: '#6b7280', fontSize: 13 }}>Click to manage tasks, timelines & worklogs â†’</p>
//          </section>
// )}

//         {/* Admin Panel */}
//         {role === 'Admin' && (
//           <section className="card">
//             <div className="card-header">
//               <div><h3>Admin Actions</h3><p>Create, update and manage users across roles.</p></div>
//             </div>
//             <div className="admin-actions">
//               <button className="btn-primary btn-small" onClick={() => navigate('/user-form')}>
//                 + Create New User
//               </button>
//               <button className="btn-secondary btn-small" onClick={() => navigate('/admin/users')}>
//                 Manage Users
//               </button>
//               <button className="btn-secondary btn-small">View Access Matrix</button>
//             </div>
//           </section>
//         )}

//       </div>
//     </div>
//   )
// }

// export default Dashboard
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
  if (h < 12) return { text: 'Good Morning', icon: 'ðŸŒ…' }
  if (h < 17) return { text: 'Good Afternoon', icon: 'â˜€ï¸' }
  return { text: 'Good Evening', icon: 'ðŸŒ™' }
}

function formatTime(time) {
  if (!time) return 'â€”'
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

function Dashboard() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()

  // â”€â”€ ALL hooks must be at the top, before any early return â”€â”€
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [attendanceBusy, setAttendanceBusy] = useState(false)
  const [attendanceMsg, setAttendanceMsg] = useState('')
  const [attendanceErr, setAttendanceErr] = useState('')
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [interns, setInterns] = useState([])
  const [chartsReady, setChartsReady] = useState(false)
  const [ChartComponents, setChartComponents] = useState(null)
  const [trainee, setTrainee] = useState(null)
  const [traineeLoading, setTraineeLoading] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [recentLoading, setRecentLoading] = useState(false)

  const isIntern = user?.role_id === 4
  const isManager = user?.role_id === 1 || user?.role_id === 2

  // Load recharts lazily â€” won't crash if not installed yet
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

  // Poll intern profile every 2 minutes â€” picks up admin-extended internship dates without a full refresh
  useEffect(() => {
    if (!isIntern) return
    const id = setInterval(() => {
      api.get('/intern/profile')
        .then(r => setTrainee(r.data.data?.trainee || null))
        .catch(() => {})
    }, 120000)
    return () => clearInterval(id)
  }, [isIntern])

  // Early returns AFTER all hooks
  if (loading) return <div style={{ padding: '30px' }}>Loading...</div>

  const role = user?.role || 'Intern'
  const remainingDays = isIntern ? calculateDaysRemaining(trainee?.expected_end_date) : null
  const greeting = getGreeting()
  const checkedIn = !!todayAttendance?.check_in_time
  const checkedOut = !!todayAttendance?.check_out_time
  const pendingTasks = myTasks.filter(t => t.status !== 'completed').length
  const completedTasks = myTasks.filter(t => t.status === 'completed').length
  const overdueTasks = myTasks.filter(t => {
    if (!t?.due_date || t.status === 'completed') return false
    return new Date(t.due_date) < new Date(new Date().toDateString())
  }).length
  const activeTasks = myTasks.filter(t => t.status !== 'completed' && !(t?.due_date && new Date(t.due_date) < new Date(new Date().toDateString()))).length
  const todayTaskItems = [...myTasks]
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a?.due_date || 0) - new Date(b?.due_date || 0))
    .slice(0, 3)
  const recentTaskItems = [...myTasks]
    .sort((a, b) => new Date(b?.updatedAt || b?.due_date || 0) - new Date(a?.updatedAt || a?.due_date || 0))
    .slice(0, 4)
  const notificationItems = recentSubmissions.slice(0, 4)
  const managerName = trainee?.manager?.name || trainee?.buddy?.name || 'Your manager'
  const feedbackMessage = overdueTasks > 0
    ? `There are ${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''}. Focus on closing the delayed work first, then move to the next priority item.`
    : pendingTasks > 0
      ? `Good momentum so far. You have ${pendingTasks} active task${pendingTasks !== 1 ? 's' : ''} left, so keep updating progress and submit your work on time.`
      : 'Everything looks on track. Keep your updates clean and continue maintaining this pace.'

  // Check if internship is expired â€” compare against actual date so admin extensions are respected
  const isInternshipExpired = isIntern && !traineeLoading &&
    trainee?.expected_end_date &&
    new Date(trainee.expected_end_date) < new Date(new Date().toDateString())

  if (isInternshipExpired) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 24, padding: 32, textAlign: 'center',
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480,
          boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #fecaca',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>ðŸŽ“</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
            Internship Completed
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' }}>
            Your internship period ended on <strong>{new Date(trainee.expected_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            <br /><br />
            Your account is still active but functionality has been restricted.
            Please contact your <strong>Admin</strong> or <strong>Manager</strong> for next steps.
          </p>
          <div style={{
            background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10,
            padding: '12px 16px', fontSize: 13, color: '#854d0e', fontWeight: 500,
          }}>
            ðŸ“§ Reach out to your admin/manager to extend or close your internship.
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            style={{
              marginTop: 24, padding: '10px 28px', borderRadius: 10,
              background: '#1f2937', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
            Logout
          </button>
        </div>
      </div>
    )
  }

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
  // const workLog = [
  //   { name: 'Ananya Sharma', role: 'Intern', date: '24 Feb 2026', hours: '7.5', summary: 'Worked on UI for intern dashboard and bug fixes.' },
  //   { name: 'Rohan Singh', role: 'Trainee', date: '24 Feb 2026', hours: '6', summary: 'Prepared daily MIS reports and data clean-up.' },
  //   { name: 'Mehak Kaur', role: 'Intern', date: '23 Feb 2026', hours: '8', summary: 'Shadowed client meetings and documented minutes.' },
  // ]

  return (
    <div className="dashboard">

      {isIntern ? (
        <div style={{ display: 'grid', gap: 24, marginBottom: 24 }}>
          <section style={{
            background: 'linear-gradient(135deg, #f8fbff 0%, #eef8ff 52%, #f7fcfb 100%)',
            border: '1px solid #d9ecf2',
            borderRadius: 24,
            padding: '24px clamp(18px, 3vw, 30px)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #0f76d3, #2ca7ff)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: '0 14px 28px rgba(15, 118, 211, 0.25)',
                }}>
                  {greeting.icon}
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#1e293b', fontSize: 'clamp(1.6rem, 2.2vw, 2rem)', fontWeight: 800 }}>
                    Intern Dashboard
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                    {greeting.text}, {user?.name?.split(' ')[0]}. Stay on top of tasks, attendance, and feedback.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  padding: '9px 14px',
                  borderRadius: 999,
                  border: '1px solid #dbeafe',
                  background: '#fff',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: 12,
                }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: '0 10px 24px rgba(249, 115, 22, 0.22)',
                }}>
                  {(user?.name || 'I').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            {(attendanceMsg || attendanceErr) && (
              <div style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 14,
                background: attendanceErr ? '#fef2f2' : '#ecfdf5',
                border: attendanceErr ? '1px solid #fecaca' : '1px solid #bbf7d0',
                color: attendanceErr ? '#b91c1c' : '#166534',
                fontWeight: 600,
                fontSize: 14,
              }}>
                {attendanceErr || attendanceMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Tasks', value: myTasks.length, detail: 'Assigned to you', bg: 'linear-gradient(135deg, #2678f3, #1d4ed8)', icon: '□' },
                { label: 'Completed', value: completedTasks, detail: 'Tasks finished', bg: 'linear-gradient(135deg, #1fbf9f, #0f9f8a)', icon: '✓' },
                { label: 'Pending', value: activeTasks, detail: 'Tasks in progress', bg: 'linear-gradient(135deg, #ffb547, #ff8a18)', icon: '◔' },
                { label: 'Overdue', value: overdueTasks, detail: 'Tasks past deadline', bg: 'linear-gradient(135deg, #fb7185, #ef4444)', icon: '!' },
              ].map(card => (
                <div key={card.label} style={{
                  background: card.bg,
                  color: '#fff',
                  borderRadius: 18,
                  padding: '18px 18px 16px',
                  minHeight: 128,
                  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 18,
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{card.label}</div>
                    <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{card.value}</div>
                    <div style={{ marginTop: 8, opacity: 0.92, fontSize: 14 }}>{card.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <section className="card" style={{ borderRadius: 20 }}>
              <div className="card-header">
                <div>
                  <h3>Today's Tasks</h3>
                  <p>Priority work queued for your day.</p>
                </div>
                <button
                  onClick={() => navigate('/my-tasks')}
                  style={{
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#2563eb',
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View All
                </button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {todayTaskItems.length === 0 ? (
                  <div style={{ color: '#64748b', padding: '10px 2px' }}>No active tasks right now.</div>
                ) : todayTaskItems.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#0f76d3', marginTop: 2 }}>■</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{task.title}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          Due {task?.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'soon'}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}>
                      {(task.status || 'todo').replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card" style={{ borderRadius: 20 }}>
              <div className="card-header">
                <div>
                  <h3>Notifications</h3>
                  <p>Recent updates from your task activity.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {recentLoading ? (
                  <div style={{ color: '#64748b', padding: '10px 2px' }}>Loading updates...</div>
                ) : notificationItems.length === 0 ? (
                  <div style={{ color: '#64748b', padding: '10px 2px' }}>No updates yet.</div>
                ) : notificationItems.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#0f766e', marginTop: 2 }}>•</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>
                          {entry.task?.title || 'Task update received'}
                        </div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          {entry.work_notes ? entry.work_notes.slice(0, 60) : 'Recent activity recorded in your dashboard.'}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <section className="card" style={{ borderRadius: 20 }}>
              <div className="card-header">
                <div>
                  <h3>Performance Overview</h3>
                  <p>{attendanceHistory.length > 0 ? 'Your attendance pattern over the last week.' : 'A quick view of your current task distribution.'}</p>
                </div>
                <div style={{ padding: '7px 12px', borderRadius: 999, background: '#f1f5f9', color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                  This Week
                </div>
              </div>
              {chartsReady && ChartComponents ? (
                attendanceHistory.length > 0
                  ? <ChartComponents.AttendanceLineChart history={attendanceHistory} />
                  : <ChartComponents.TaskDonutChart tasks={myTasks} />
              ) : (
                <div style={{ color: '#64748b', padding: '16px 0' }}>Preparing your chart...</div>
              )}
              <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700, textAlign: 'center' }}>
                {myTasks.length > 0 ? `${Math.round((completedTasks / Math.max(myTasks.length, 1)) * 100)}% completion rate` : 'No tasks assigned yet'}
              </div>
            </section>

            <section className="card" style={{ borderRadius: 20 }}>
              <div className="card-header">
                <div>
                  <h3>Recent Tasks</h3>
                  <p>Latest work items from your queue.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                {recentTaskItems.length === 0 ? (
                  <div style={{ color: '#64748b' }}>No tasks available.</div>
                ) : recentTaskItems.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: task.status === 'completed' ? '#16a34a' : task.status === 'in_progress' ? '#2563eb' : task.status === 'review' ? '#7c3aed' : '#ef4444', marginTop: 2 }}>
                        ●
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{task.title}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          {task?.due_date ? `Due ${new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'No due date'}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      color: task.status === 'completed' ? '#16a34a' : task.status === 'in_progress' ? '#2563eb' : task.status === 'review' ? '#7c3aed' : '#f59e0b',
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}>
                      {(task.status || 'todo').replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card" style={{ borderRadius: 20 }}>
            <div className="card-header">
              <div>
                <h3>Manager's Feedback</h3>
                <p>Quick direction to help you stay aligned.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 280px' }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}>
                  {managerName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>{managerName}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>Project guidance</div>
                </div>
              </div>
              <div style={{
                flex: '2 1 460px',
                padding: '16px 18px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #f8fafc, #eef4ff)',
                color: '#334155',
                fontSize: 15,
                lineHeight: 1.7,
                border: '1px solid #e2e8f0',
              }}>
                {feedbackMessage}
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', color: '#334155', fontSize: 14 }}>
              <span><strong>Attendance:</strong> {checkedOut ? 'Checked out' : checkedIn ? 'Checked in' : 'Not marked'}</span>
              <span><strong>Internship:</strong> {remainingDays !== null ? `${remainingDays} days left` : traineeLoading ? 'Loading...' : 'End date not set'}</span>
              <button
                onClick={() => navigate('/attendance')}
                style={{
                  marginLeft: 'auto',
                  border: '1px solid #99f6e4',
                  background: '#ecfeff',
                  color: '#0f766e',
                  borderRadius: 999,
                  padding: '8px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Open Attendance
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div style={{
          background: 'rgba(0, 177, 180, 0.06)',
          border: '1px solid rgba(0, 177, 180, 0.15)',
          borderRadius: 16, padding: '28px 32px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(0, 177, 180, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>
              {greeting.icon}
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#003b5c', fontSize: 22, fontWeight: 700 }}>
                {greeting.text}, {user?.name?.split(' ')[0]}!
              </h2>
              <p style={{ margin: 0, color: '#4b7a8a', fontSize: 13 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                &nbsp;|&nbsp;Let's make today productive
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/manager')}
              style={{
                background: 'rgba(0,177,180,0.08)', borderRadius: 10,
                padding: '10px 18px', color: '#003b5c', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                backdropFilter: 'blur(6px)', border: '1.5px solid rgba(0,177,180,0.3)',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              <span>📋</span>
              <span>{pendingTasks > 0 ? `${pendingTasks} Pending Task${pendingTasks !== 1 ? 's' : ''} — Review Now` : 'All Tasks Up to Date ✓'}</span>
            </button>

            <div style={{
              background: 'rgba(0,177,180,0.08)', borderRadius: 10,
              padding: '10px 18px', color: '#003b5c', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid rgba(0,177,180,0.2)',
            }}>
              <span>👤</span><span>{role}</span>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ MAIN GRID â”€â”€ */}
      <div className="dashboard-grid">

        {/* Summary Stats â€” real data from UserContext */}
        {/* <section className="card">
          <div className="card-header">
            <div>
              <h3>Summary Overview</h3>
              <p>Real-time data from your user management system ({users.length} Total Users)</p>
            </div>
            <button onClick={() => fetchUsers()} disabled={usersLoading}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}>
              {usersLoading ? 'â†» Loading...' : 'â†» Refresh'}
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
        {/* <section className="card">
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
                      <td>{entry.intern?.trainee?.buddy?.name || 'â€”'}</td>
                      <td>{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>â€”</td>
                      <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.work_notes}>
                        <strong>{entry.task?.title}:</strong> {entry.work_notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section> */}

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
        {/* {isManager && (
          <section className="card">
            <div className="card-header">
              <div><h3>Manager View</h3><p>Track interns mapped to you and their buddies.</p></div>
            </div>
            <ul className="list">
              <li className="list-item">
                <div>
                  <div className="list-title">Ananya Sharma</div>
                  <div className="list-subtitle">Buddy: Rahul Verma Â· Track: Frontend</div>
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
        )} */}
        {isManager && (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>My Interns</h3>
              <p>Interns currently under your supervision.</p>
            </div>
            <button
              onClick={() => navigate('/manager')}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #00b1b4', background: 'transparent',
                color: '#00b1b4', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Manage â†’
            </button>
          </div>
          {interns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>ðŸ‘¥</div>
              <p>No interns assigned to you yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Course</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Enrolled</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>End Date</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Progress</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern, idx) => {
                    const trainee = intern.trainee || intern
                    const progress = trainee.completion_percentage || intern.completion_percentage || 0
                    const status = trainee.current_status || intern.current_status || 'active'
                    const statusStyle = status === 'completed'
                      ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
                      : status === 'inactive'
                      ? { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
                      : { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
                    const enrollDate = trainee.enrollment_date || intern.enrollment_date
                    const endDate = trainee.expected_end_date || intern.expected_end_date
                    return (
                      <tr key={intern.id || idx}
                        style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fbfc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => navigate('/manager')}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#003b5c', fontSize: 14 }}>{intern.name || 'â€”'}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{intern.email || 'â€”'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{trainee.course || 'â€”'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>
                          {enrollDate ? new Date(enrollDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'â€”'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>
                          {endDate ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'â€”'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#00b1b4', borderRadius: 99, width: `${progress}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: statusStyle.bg, color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            borderRadius: 6, padding: '3px 10px',
                            fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                          }}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
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

