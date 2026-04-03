import React, { useCallback, useEffect, useState } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'
import MyLeaves from './myleaves.jsx'

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
  const [activeTab, setActiveTab] = useState('attendance')

  const fetchAll = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAll()
    }
  }, [activeTab, fetchAll])

  const handleCheckIn = async () => {
    setBusy(true)
    setActionMsg('')
    setActionErr('')
    try {
      const res = await api.post('/attendance/checkin')
      setActionMsg(res.data.message)
      await fetchAll()
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
      await fetchAll()
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Check-out failed')
    } finally {
      setBusy(false)
    }
  }

  const checkedIn = !!today?.check_in_time
  const checkedOut = !!today?.check_out_time

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading attendance...</div>

  const sortedHistory = sortByLatest(history)
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const statusKey = today?.status || 'present'
  const todayStyle = STATUS_STYLE[statusKey] || STATUS_STYLE.present
  return (
    <div className="dashboard">
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'attendance', label: 'Attendance' },
          { key: 'leaves', label: 'My Leaves' },
        ].map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setActiveTab(tabItem.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: activeTab === tabItem.key ? '1px solid #003b5c' : '1px solid #dbe4ef',
              background: activeTab === tabItem.key ? '#003b5c' : '#fff',
              color: activeTab === tabItem.key ? '#fff' : '#6b7280',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === tabItem.key ? '0 12px 28px rgba(0, 59, 92, 0.16)' : 'none',
            }}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <>
          <section className="card" style={{ marginBottom: 22, border: '1px solid #dbe4ef' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{todayLabel}</div>
              <span style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', background: todayStyle.bg, color: todayStyle.color, border: `1px solid ${todayStyle.border}` }}>{statusKey.replace('_', ' ')}</span>
            </div>
            {actionMsg && <p style={{ color: '#166534', background: '#f0fdf4', padding: '10px 14px', borderRadius: 10, margin: '0 0 16px', fontWeight: 600, border: '1px solid #bbf7d0' }}>{actionMsg}</p>}
            {actionErr && <p style={{ color: '#b91c1c', background: '#fef2f2', padding: '10px 14px', borderRadius: 10, margin: '0 0 16px', fontWeight: 600, border: '1px solid #fecaca' }}>{actionErr}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <button type="button" onClick={handleCheckIn} disabled={busy || checkedIn} style={{ padding: '12px 20px', minWidth: 140, borderRadius: 12, border: 'none', background: checkedIn ? '#e5e7eb' : '#00b1b4', color: checkedIn ? '#9ca3af' : '#fff', fontSize: 14, fontWeight: 800, cursor: checkedIn ? 'not-allowed' : 'pointer' }}>
                {checkedIn ? 'Checked In' : busy ? 'Processing...' : 'Check In'}
              </button>
              <button type="button" onClick={handleCheckOut} disabled={busy || !checkedIn || checkedOut} style={{ padding: '12px 20px', minWidth: 140, borderRadius: 12, border: '1px solid #dbe4ef', background: checkedOut ? '#e5e7eb' : '#fff', color: checkedOut ? '#9ca3af' : '#003b5c', fontSize: 14, fontWeight: 800, cursor: !checkedIn || checkedOut ? 'not-allowed' : 'pointer' }}>
                {checkedOut ? 'Checked Out' : busy ? 'Processing...' : 'Check Out'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Check In', value: formatTime(today?.check_in_time) },
                { label: 'Check Out', value: formatTime(today?.check_out_time) },
                { label: 'Status', value: statusKey.replace('_', ' ') },
              ].map((item) => (
                <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #dbe4ef' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e6edf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 22 }}>Attendance History</h3>
                <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>Recent attendance records from your intern management account.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Records</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{sortedHistory.length}</div>
              </div>
            </div>
            {sortedHistory.length === 0 ? (
              <div style={{ padding: 28, color: '#94a3b8', textAlign: 'center' }}>No attendance records yet.</div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ fontSize: 13 }}>
                  <thead style={{ background: '#f8fbff' }}>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map((record) => {
                      const recordStatus = getRecordStatus(record)
                      const style = STATUS_STYLE[recordStatus] || STATUS_STYLE.present
                      return (
                        <tr key={record.id || `${getRecordDate(record)}-${recordStatus}`}>
                          <td><strong style={{ color: '#0f172a' }}>{formatDate(getRecordDate(record))}</strong></td>
                          <td style={{ fontWeight: 700, color: '#f97316' }}>{formatTime(record.check_in_time)}</td>
                          <td style={{ fontWeight: 700, color: '#334155' }}>{formatTime(record.check_out_time)}</td>
                          <td>
                            <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                              {recordStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ color: '#64748b' }}>{record.remarks || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'leaves' && <MyLeaves onLeaveChanged={fetchAll} />}
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
