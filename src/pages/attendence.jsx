import React, { useEffect, useState } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'

const formatTime = (time) => {
  if (!time) return '-'

  const rawTime = time.includes('T') ? time.split('T')[1] : time
  const [h, m] = rawTime.split(':')

  if (h === undefined || m === undefined) return time

  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'

  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr

  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_STYLE = {
  present:        { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  absent:         { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  late:           { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  half_day:       { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  on_leave:       { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  pending_leave:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  leave_rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const normalizeListPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.data?.records)) return payload.data.records
  return []
}

const getRecordDate = (record) =>
  record?.attendance_date || record?.leave_date || record?.date || record?.created_at || ''

const getRecordStatus = (record) =>
  record?.status || record?.attendance_status || record?.leave_status || 'present'

const sortByLatest = (records = []) =>
  [...records].sort((a, b) => new Date(getRecordDate(b)) - new Date(getRecordDate(a)))

function InternAttendance() {
  const [today, setToday] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [busy, setBusy] = useState(false)

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

  useEffect(() => {
    fetchAll()
  }, [])

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

  const checkedIn = !!today?.check_in_time
  const checkedOut = !!today?.check_out_time

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading attendance...</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>My Attendance</h2>
          <p>Track your daily check-in and check-out times.</p>
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      <section className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3>Today's Attendance</h3>
            <p>Mark your arrival and departure.</p>
          </div>
        </div>

        {actionMsg && (
          <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
            {actionMsg}
          </p>
        )}
        {actionErr && (
          <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
            {actionErr}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={handleCheckIn}
            disabled={busy || checkedIn}
            style={{
              padding: '12px 28px',
              borderRadius: 10,
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              cursor: checkedIn ? 'not-allowed' : 'pointer',
              background: checkedIn ? '#e5e7eb' : '#00b1b4',
              color: checkedIn ? '#9ca3af' : '#fff',
            }}
          >
            {checkedIn ? 'Checked In' : busy ? 'Processing...' : 'Check In'}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={busy || !checkedIn || checkedOut}
            style={{
              padding: '12px 28px',
              borderRadius: 10,
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              cursor: !checkedIn || checkedOut ? 'not-allowed' : 'pointer',
              background: checkedOut ? '#e5e7eb' : checkedIn ? '#003b5c' : '#e5e7eb',
              color: !checkedIn || checkedOut ? '#9ca3af' : '#fff',
            }}
          >
            {checkedOut ? 'Checked Out' : busy ? 'Processing...' : 'Check Out'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'CHECK IN', value: formatTime(today?.check_in_time) },
            { label: 'CHECK OUT', value: formatTime(today?.check_out_time) },
            { label: 'STATUS', value: today?.status?.replace('_', ' ') || 'Not marked' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                flex: 1,
                background: '#f8fafc',
                borderRadius: 10,
                padding: '14px 18px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#003b5c', textTransform: 'capitalize' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>Attendance History</h3>
            <p>Your last 30 days of records.</p>
          </div>
        </div>
        {history.length === 0 ? (
          <p style={{ padding: '20px', color: '#9ca3af' }}>No attendance records yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
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
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background: s.bg,
                            color: s.color,
                            border: `1px solid ${s.border}`,
                          }}
                        >
                          {record.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ color: '#6b7280' }}>{record.remarks || '-'}</td>
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

function ManagerAttendance() {
  const [interns, setInterns] = useState([])
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [leaveHistory, setLeaveHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    api.get('/manager/interns')
      .then(r => setInterns(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchInternAttendance = async (trainee) => {
    const attempts = [
      () => api.get(`/manager/interns/${trainee.user_id}/attendance`),
      () => api.get(`/manager/interns/${trainee.id}/attendance`),
      () => api.get(`/manager/attendance/${trainee.user_id}`),
      () => api.get('/attendance/history', { params: { user_id: trainee.user_id } }),
    ]

    for (const attempt of attempts) {
      try {
        const res = await attempt()
        return sortByLatest(normalizeListPayload(res.data))
      } catch (err) {
        if (![403, 404, 405].includes(err.response?.status)) {
          throw err
        }
      }
    }

    return []
  }

  const viewInternAttendance = async (trainee) => {
    setSelectedIntern(trainee)
    setHistoryLoading(true)
    setDetailError('')

    try {
      const [attendanceRes, leaveRes] = await Promise.all([
        fetchInternAttendance(trainee).catch(() => []),
        api.get(`/manager/leaves/${trainee.user_id}`).catch(() => null),
      ])

      setAttendanceHistory(attendanceRes)
      setLeaveHistory(sortByLatest(normalizeListPayload(leaveRes?.data)))
    } catch (err) {
      setAttendanceHistory([])
      setLeaveHistory([])
      setDetailError(err.response?.data?.message || 'Failed to load intern records')
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading...</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Intern Attendance</h2>
          <p>View attendance records for your interns.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Your Interns</h3>
              <p>Select to view attendance.</p>
            </div>
          </div>
          {interns.length === 0 ? (
            <p style={{ padding: '16px', color: '#9ca3af', fontSize: 14 }}>No interns assigned yet.</p>
          ) : (
            <ul className="list" style={{ padding: 0 }}>
              {interns.map(trainee => (
                <li
                  key={trainee.id}
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
                  <span
                    className={`pill ${trainee.current_status === 'active' ? 'pill-green' : 'pill-soft'}`}
                    style={{ textTransform: 'capitalize', fontSize: 11 }}
                  >
                    {trainee.current_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          {!selectedIntern ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>Select</div>
              <p>Select an intern from the list to view their attendance records.</p>
            </div>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <h3>{selectedIntern.user?.name}'s Attendance</h3>
                  <p>Daily attendance and leave records on file.</p>
                </div>
              </div>

              {historyLoading ? (
                <p style={{ padding: 20, color: '#9ca3af' }}>Loading records...</p>
              ) : (
                <>
                  {detailError && (
                    <p style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
                      {detailError}
                    </p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Attendance Days', value: attendanceHistory.length },
                      { label: 'Present Days', value: attendanceHistory.filter(r => getRecordStatus(r) === 'present').length },
                      { label: 'Absent / Late', value: attendanceHistory.filter(r => ['absent', 'late', 'half_day'].includes(getRecordStatus(r))).length },
                      { label: 'Leave Entries', value: leaveHistory.length },
                    ].map(card => (
                      <div key={card.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{card.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#003b5c' }}>{card.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div className="card-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div>
                        <h3>Daily Attendance</h3>
                        <p>Check-in, check-out and status records.</p>
                      </div>
                    </div>
                    {attendanceHistory.length === 0 ? (
                      <p style={{ padding: 20, color: '#9ca3af' }}>No daily attendance records found for this intern.</p>
                    ) : (
                      <div className="table-wrapper">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Check In</th>
                              <th>Check Out</th>
                              <th>Status</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceHistory.map(record => {
                              const status = getRecordStatus(record)
                              const s = STATUS_STYLE[status] || STATUS_STYLE.present
                              return (
                                <tr key={`attendance-${record.id || getRecordDate(record)}`}>
                                  <td><strong>{formatDate(getRecordDate(record))}</strong></td>
                                  <td>{formatTime(record.check_in_time)}</td>
                                  <td>{formatTime(record.check_out_time)}</td>
                                  <td>
                                    <span
                                      style={{
                                        padding: '2px 10px',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        background: s.bg,
                                        color: s.color,
                                        border: `1px solid ${s.border}`,
                                      }}
                                    >
                                      {status?.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td style={{ color: '#6b7280' }}>{record.remarks || '-'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="card-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div>
                        <h3>Leave History</h3>
                        <p>Leave requests and manager-assigned leave records.</p>
                      </div>
                    </div>
                    {leaveHistory.length === 0 ? (
                      <p style={{ padding: 20, color: '#9ca3af' }}>No leave records found for this intern.</p>
                    ) : (
                      <div className="table-wrapper">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveHistory.map(record => {
                              const status = getRecordStatus(record)
                              const s = STATUS_STYLE[status] || STATUS_STYLE.on_leave
                              return (
                                <tr key={`leave-${record.id || getRecordDate(record)}`}>
                                  <td><strong>{formatDate(getRecordDate(record))}</strong></td>
                                  <td>
                                    <span
                                      style={{
                                        padding: '2px 10px',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        background: s.bg,
                                        color: s.color,
                                        border: `1px solid ${s.border}`,
                                      }}
                                    >
                                      {status?.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td style={{ color: '#6b7280' }}>{record.remarks || record.leave_reason || '-'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default function Attendance() {
  const { user } = useAuth()
  const isManager = user?.role_id === 1 || user?.role_id === 2
  return isManager ? <ManagerAttendance /> : <InternAttendance />
}
