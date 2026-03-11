import React, { useState, useEffect } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'

const formatTime = (time) => {
  if (!time) return '—'
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

const STATUS_STYLE = {
  present:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  absent:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  late:     { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  half_day: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  on_leave: { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
}

// ── INTERN VIEW ──────────────────────────────────────────
function InternAttendance() {
  const [today,     setToday]     = useState(null)
  const [history,   setHistory]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [busy,      setBusy]      = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/history'),
      ])
      setToday(todayRes.data.data)
      setHistory(historyRes.data.data || [])
    } catch {
      setActionErr('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setBusy(true); setActionMsg(''); setActionErr('')
    try {
      const res = await api.post('/attendance/checkin')
      setActionMsg(res.data.message)
      fetchAll()
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Check-in failed')
    } finally { setBusy(false) }
  }

  const handleCheckOut = async () => {
    setBusy(true); setActionMsg(''); setActionErr('')
    try {
      const res = await api.post('/attendance/checkout')
      setActionMsg(res.data.message)
      fetchAll()
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Check-out failed')
    } finally { setBusy(false) }
  }

  const checkedIn  = !!today?.check_in_time
  const checkedOut = !!today?.check_out_time

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading attendance…</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>My Attendance</h2>
          <p>Track your daily check-in and check-out times.</p>
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Today's card */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div><h3>Today's Attendance</h3><p>Mark your arrival and departure.</p></div>
        </div>

        {actionMsg && <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✓ {actionMsg}</p>}
        {actionErr && <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✗ {actionErr}</p>}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={handleCheckIn} disabled={busy || checkedIn} style={{
            padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
            cursor: checkedIn ? 'not-allowed' : 'pointer',
            background: checkedIn ? '#e5e7eb' : '#00b1b4',
            color: checkedIn ? '#9ca3af' : '#fff',
          }}>
            {checkedIn ? '✓ Checked In' : busy ? 'Processing…' : '🟢 Check In'}
          </button>

          <button onClick={handleCheckOut} disabled={busy || !checkedIn || checkedOut} style={{
            padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
            cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer',
            background: checkedOut ? '#e5e7eb' : checkedIn ? '#003b5c' : '#e5e7eb',
            color: (!checkedIn || checkedOut) ? '#9ca3af' : '#fff',
          }}>
            {checkedOut ? '✓ Checked Out' : busy ? 'Processing…' : '🔴 Check Out'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'CHECK IN',  value: formatTime(today?.check_in_time) },
            { label: 'CHECK OUT', value: formatTime(today?.check_out_time) },
            { label: 'STATUS',    value: today?.status?.replace('_', ' ') || 'Not marked' },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, background: '#f8fafc', borderRadius: 10,
              padding: '14px 18px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#003b5c', textTransform: 'capitalize' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* History table */}
      <section className="card">
        <div className="card-header">
          <div><h3>Attendance History</h3><p>Your last 30 days of records.</p></div>
        </div>
        {history.length === 0 ? (
          <p style={{ padding: '20px', color: '#9ca3af' }}>No attendance records yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {history.map(record => {
                  const s = STATUS_STYLE[record.status] || STATUS_STYLE.present
                  return (
                    <tr key={record.id}>
                      <td><strong>{formatDate(record.attendance_date)}</strong></td>
                      <td>{formatTime(record.check_in_time)}</td>
                      <td>{formatTime(record.check_out_time)}</td>
                      <td>
                        <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12,
                          fontWeight: 600, textTransform: 'capitalize',
                          background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          {record.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ color: '#6b7280' }}>{record.remarks || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ── MANAGER VIEW ─────────────────────────────────────────
function ManagerAttendance() {
  const [interns,        setInterns]        = useState([])
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [internHistory,  setInternHistory]  = useState([])
  const [loading,        setLoading]        = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    api.get('/manager/interns')
      .then(r => setInterns(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const viewInternAttendance = async (trainee) => {
    setSelectedIntern(trainee)
    setHistoryLoading(true)
    try {
      const res = await api.get(`/manager/leaves/${trainee.user_id}`)
      setInternHistory(res.data.data || [])
    } catch {
      setInternHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading…</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Intern Attendance</h2>
          <p>View attendance records for your interns.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Intern list */}
        <section className="card">
          <div className="card-header">
            <div><h3>Your Interns</h3><p>Select to view attendance.</p></div>
          </div>
          {interns.length === 0 ? (
            <p style={{ padding: '16px', color: '#9ca3af', fontSize: 14 }}>No interns assigned yet.</p>
          ) : (
            <ul className="list" style={{ padding: 0 }}>
              {interns.map(trainee => (
                <li key={trainee.id}
                  onClick={() => viewInternAttendance(trainee)}
                  className="list-item"
                  style={{
                    cursor: 'pointer',
                    background: selectedIntern?.id === trainee.id ? '#e5f8f8' : 'transparent',
                    borderLeft: selectedIntern?.id === trainee.id ? '3px solid #00b1b4' : '3px solid transparent',
                  }}
                >
                  <div>
                    <div className="list-title">{trainee.user?.name || 'Unknown'}</div>
                    <div className="list-subtitle">{trainee.user?.email}</div>
                  </div>
                  <span className={`pill ${trainee.current_status === 'active' ? 'pill-green' : 'pill-soft'}`}
                    style={{ textTransform: 'capitalize', fontSize: 11 }}>
                    {trainee.current_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Attendance detail */}
        <section className="card">
          {!selectedIntern ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
              <p>Select an intern from the list to view their attendance records.</p>
            </div>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <h3>{selectedIntern.user?.name}'s Attendance</h3>
                  <p>Leave and attendance records on file.</p>
                </div>
              </div>
              {historyLoading ? (
                <p style={{ padding: 20, color: '#9ca3af' }}>Loading records…</p>
              ) : internHistory.length === 0 ? (
                <p style={{ padding: 20, color: '#9ca3af' }}>No leave records found for this intern.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr><th>Date</th><th>Status</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {internHistory.map(record => {
                        const s = STATUS_STYLE[record.status] || STATUS_STYLE.present
                        return (
                          <tr key={record.id}>
                            <td><strong>{formatDate(record.attendance_date)}</strong></td>
                            <td>
                              <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12,
                                fontWeight: 600, textTransform: 'capitalize',
                                background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                                {record.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ color: '#6b7280' }}>{record.remarks || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// ── MAIN EXPORT — shows correct view based on role ───────
export default function Attendance() {
  const { user } = useAuth()
  const isManager = user?.role_id === 1 || user?.role_id === 2
  return isManager ? <ManagerAttendance /> : <InternAttendance />
}




/*
    Attendance.jsx - Employee Attendance Tracking Page
import React, { useState, useEffect } from 'react'
import api from '../api/login_api.js'

const formatTime = (time) => {
  if (!time) return '—'
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default function Attendance() {
  const [today,     setToday]     = useState(null)
  const [history,   setHistory]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [busy,      setBusy]      = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/history'),
      ])
      setToday(todayRes.data.data)
      setHistory(historyRes.data.data || [])
    } catch (e) {
      setActionErr('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setBusy(true)
    setActionMsg('')
    setActionErr('')
    try {
      const res = await api.post('/attendance/checkin')
      setActionMsg(res.data.message)
      fetchAll()
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Check-in failed')
    } finally {
      setBusy(false)
    }
  }

  const handleCheckOut = async () => {
    setBusy(true)
    setActionMsg('')
    setActionErr('')
    try {
      const res = await api.post('/attendance/checkout')
      setActionMsg(res.data.message)
      fetchAll()
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Check-out failed')
    } finally {
      setBusy(false)
    }
  }

  const checkedInToday  = !!today?.check_in_time
  const checkedOutToday = !!today?.check_out_time

  const STATUS_STYLE = {
    present:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    absent:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    late:     { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    half_day: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    on_leave: { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading attendance…</div>

  return (
    <div className="dashboard">

//       {/* Header */
//       <div className="dashboard-header">
//         <div>
//           <h2>My Attendance</h2>
//           <p>Track your daily check-in and check-out times.</p>
//         </div>
//         <div style={{ fontSize: 14, color: '#6b7280' }}>
//           {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
//         </div>
//       </div>

//       {/* Today's Card */}
//       <section className="card" style={{ marginBottom: 24 }}>
//         <div className="card-header">
//           <div>
//             <h3>Today's Attendance</h3>
//             <p>Mark your check-in when you arrive and check-out when you leave.</p>
//           </div>
//         </div>

//         {/* Action messages */}
//         {actionMsg && (
//           <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px',
//             borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
//             ✓ {actionMsg}
//           </p>
//         )}
//         {actionErr && (
//           <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
//             borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
//             ✗ {actionErr}
//           </p>
//         )}

//         {/* Check-in / Check-out buttons */}
//         <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>

//           <button
//             onClick={handleCheckIn}
//             disabled={busy || checkedInToday}
//             style={{
//               padding: '14px 32px', borderRadius: 10, border: 'none',
//               fontSize: 16, fontWeight: 700, cursor: checkedInToday ? 'not-allowed' : 'pointer',
//               background: checkedInToday ? '#e5e7eb' : '#00b1b4',
//               color: checkedInToday ? '#9ca3af' : '#fff',
//               transition: 'all 0.2s',
//             }}
//           >
//             {checkedInToday ? '✓ Checked In' : busy ? 'Processing…' : '🟢 Check In'}
//           </button>

//           <button
//             onClick={handleCheckOut}
//             disabled={busy || !checkedInToday || checkedOutToday}
//             style={{
//               padding: '14px 32px', borderRadius: 10, border: 'none',
//               fontSize: 16, fontWeight: 700,
//               cursor: (!checkedInToday || checkedOutToday) ? 'not-allowed' : 'pointer',
//               background: checkedOutToday ? '#e5e7eb' : checkedInToday ? '#003b5c' : '#e5e7eb',
//               color: (!checkedInToday || checkedOutToday) ? '#9ca3af' : '#fff',
//               transition: 'all 0.2s',
//             }}
//           >
//             {checkedOutToday ? '✓ Checked Out' : busy ? 'Processing…' : '🔴 Check Out'}
//           </button>
//         </div>

//         {/* Today's times */}
//         <div style={{ display: 'flex', gap: 16 }}>
//           <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10,
//             padding: '16px 20px', border: '1px solid #e2e8f0' }}>
//             <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>CHECK IN TIME</div>
//             <div style={{ fontSize: 24, fontWeight: 700, color: '#003b5c' }}>
//               {formatTime(today?.check_in_time)}
//             </div>
//           </div>
//           <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10,
//             padding: '16px 20px', border: '1px solid #e2e8f0' }}>
//             <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>CHECK OUT TIME</div>
//             <div style={{ fontSize: 24, fontWeight: 700, color: '#003b5c' }}>
//               {formatTime(today?.check_out_time)}
//             </div>
//           </div>
//           <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10,
//             padding: '16px 20px', border: '1px solid #e2e8f0' }}>
//             <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>STATUS</div>
//             <div style={{ fontSize: 18, fontWeight: 700 }}>
//               {today ? (
//                 <span style={{
//                   padding: '4px 12px', borderRadius: 6,
//                   fontSize: 14, textTransform: 'capitalize',
//                   background: STATUS_STYLE[today.status]?.bg,
//                   color:      STATUS_STYLE[today.status]?.color,
//                   border:     `1px solid ${STATUS_STYLE[today.status]?.border}`,
//                 }}>
//                   {today.status?.replace('_', ' ')}
//                 </span>
//               ) : (
//                 <span style={{ color: '#9ca3af', fontSize: 14 }}>Not marked yet</span>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* History Table */}
//       <section className="card">
//         <div className="card-header">
//           <div>
//             <h3>Attendance History</h3>
//             <p>Your last 30 days of attendance records.</p>
//           </div>
//         </div>

//         {history.length === 0 ? (
//           <p style={{ padding: '20px', color: '#9ca3af' }}>No attendance records yet.</p>
//         ) : (
//           <div className="table-wrapper">
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>Date</th>
//                   <th>Check In</th>
//                   <th>Check Out</th>
//                   <th>Status</th>
//                   <th>Remarks</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history.map((record) => {
//                   const s = STATUS_STYLE[record.status] || STATUS_STYLE.present
//                   return (
//                     <tr key={record.id}>
//                       <td><strong>{formatDate(record.attendance_date)}</strong></td>
//                       <td>{formatTime(record.check_in_time)}</td>
//                       <td>{formatTime(record.check_out_time)}</td>
//                       <td>
//                         <span style={{
//                           padding: '2px 10px', borderRadius: 6,
//                           fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
//                           background: s.bg, color: s.color, border: `1px solid ${s.border}`,
//                         }}>
//                           {record.status?.replace('_', ' ')}
//                         </span>
//                       </td>
//                       <td style={{ color: '#6b7280' }}>{record.remarks || '—'}</td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </section>

//     </div>
//   )
// }

// /*