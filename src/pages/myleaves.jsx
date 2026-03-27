import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../api/login_api.js'

// ─── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

const today = () => new Date().toISOString().split('T')[0]

const LEAVE_TYPES = [
  { value: 'casual', label: ' Casual', desc: '2 days/year', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'sick', label: ' Sick', desc: '2 days/year', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'emergency', label: ' Emergency', desc: '2 days/year', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 'personal', label: ' Personal', desc: '2 days/year', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
]

const STATUS_INFO = {
  pending_leave: { label: ' Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  on_leave: { label: '✓ Approved', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  leave_rejected: { label: '✕ Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const TYPE_MAP = Object.fromEntries(LEAVE_TYPES.map(t => [t.value, t]))

// ─── Leave Balance Card ────────────────────────────────────────────────────────
function BalanceCard({ type, data }) {
  const info = TYPE_MAP[type]
  const pct = data.total > 0 ? Math.round(((data.used + data.pending) / data.total) * 100) : 0
  const warn = data.available <= 1

  return (
    <div style={{
      border: `1px solid ${info.border}`, borderRadius: 14, padding: '18px 20px',
      background: data.available === 0 ? '#fef2f2' : info.bg,
      display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
    }}>
      {warn && data.available === 0 && (
        <span style={{
          position: 'absolute', top: 10, right: 12, fontSize: 11,
          background: '#fecaca', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontWeight: 700
        }}>
          EXHAUSTED
        </span>
      )}
      {warn && data.available === 1 && (
        <span style={{
          position: 'absolute', top: 10, right: 12, fontSize: 11,
          background: '#fde68a', color: '#d97706', borderRadius: 6, padding: '2px 8px', fontWeight: 700
        }}>
          1 LEFT
        </span>
      )}
      <div style={{ fontWeight: 700, fontSize: 15, color: info.color }}>{info.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: info.color }}>{data.available}</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>/ {data.total} available</span>
      </div>
      {/* progress bar */}
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: data.available === 0 ? '#ef4444' : info.color,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
        <span>✓ Used: <strong style={{ color: '#374151' }}>{data.used}</strong></span>
        <span> Pending: <strong style={{ color: '#374151' }}>{data.pending}</strong></span>
      </div>
    </div>
  )
}



// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyLeaves({ onLeaveChanged }) {
  const [tab, setTab] = useState('apply')
  const [leaves, setLeaves] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [cancelId, setCancelId] = useState(null)
  const [notifications, setNotifications] = useState([]) // newly changed statuses

  // form state
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveType, setLeaveType] = useState('casual')
  const [leaveReason, setLeaveReason] = useState('')

  // track previous statuses for change-detection notifications
  const prevLeavesRef = React.useRef({})

  const notify = useCallback((msg, type = 'success') => {
    if (type === 'error') toast.error(msg);
    else toast.success(msg);
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        api.get('/intern/leaves'),
        api.get('/intern/leave-balance'),
      ])
      const newLeaves = leavesRes.data.data || []

      // Detect status changes for notifications
      const prev = prevLeavesRef.current
      const changed = []
      newLeaves.forEach(l => {
        if (prev[l.id] && prev[l.id] !== l.status) {
          const from = prev[l.id]
          const to = l.status
          if (to === 'on_leave') {
            changed.push({ id: l.id, msg: `✅ Your leave on ${formatDate(l.attendance_date)} was APPROVED!`, type: 'success' })
          } else if (to === 'leave_rejected') {
            changed.push({ id: l.id, msg: `❌ Your leave on ${formatDate(l.attendance_date)} was rejected.`, type: 'error' })
          }
        }
      })
      if (changed.length) {
        setNotifications(prev => [...changed, ...prev].slice(0, 10))
        changed.forEach(c => notify(c.msg, c.type))
      }

      // Update refs
      const newPrev = {}
      newLeaves.forEach(l => { newPrev[l.id] = l.status })
      prevLeavesRef.current = newPrev

      setLeaves(newLeaves)
      setBalance(balanceRes.data.data)
    } catch {
      notify('Failed to load leave data', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    fetchAll()
    // Poll every 30s for status change notifications
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const handleApply = async () => {
    if (!leaveDate) { notify('Please select a leave date', 'error'); return }
    const sel = TYPE_MAP[leaveType]
    const bal = balance?.[leaveType]
    if (bal && bal.available === 0) {
      notify(`${sel.label} quota exhausted for this year`, 'error'); return
    }
    setBusy(true)
    try {
      const res = await api.post('/intern/leaves', { leave_date: leaveDate, leave_reason: leaveReason, leave_type: leaveType })
      notify(res.data.message)
      setLeaveDate(''); setLeaveReason(''); setLeaveType('casual')
      await fetchAll()
      await Promise.resolve(onLeaveChanged?.())
      setTab('requests')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to apply for leave', 'error')
    } finally { setBusy(false) }
  }

  const handleCancel = async (id) => {
    setCancelId(id)
    try {
      const res = await api.delete(`/intern/leaves/${id}`)
      notify(res.data.message)
      await fetchAll()
      await Promise.resolve(onLeaveChanged?.())
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to cancel leave', 'error')
    } finally { setCancelId(null) }
  }

  const pendingCount = leaves.filter(l => l.status === 'pending_leave').length
  const newNotifCount = notifications.filter(n => !n.seen).length

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading leave data…</div>

  return (
    <div className="dashboard">

      {/* ── header ── */}
      <div className="dashboard-header">
        <div>
          <h2>🤒 My Leaves</h2>
          <p>Apply for leave, track your quota, and view request status.</p>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {balance?.year} Leave Year
        </div>
      </div>

      {/* ── balance cards ── */}
      {balance && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {['casual', 'sick', 'emergency', 'personal'].map(type => (
            <BalanceCard key={type} type={type} data={balance[type]} />
          ))}
        </div>
      )}

      {/* ── notifications strip ── */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
              🔔 Recent Notifications
            </span>
            <button onClick={() => setNotifications([])} style={{
              fontSize: 12, color: '#9ca3af',
              background: 'none', border: 'none', cursor: 'pointer'
            }}>
              Clear all
            </button>
          </div>
          {notifications.slice(0, 3).map((n, i) => {
            const isOk = n.type === 'success'
            return (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 6, fontSize: 13,
                background: isOk ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}`,
                color: isOk ? '#16a34a' : '#dc2626', fontWeight: 600,
              }}>
                {n.msg}
              </div>
            )
          })}
        </div>
      )}

      {/* ── tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'apply', label: ' Apply for Leave' },
          { key: 'requests', label: ` My Requests${pendingCount ? ` (${pendingCount} pending)` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', border: 'none', cursor: 'pointer', background: 'none',
            fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? '#00b1b4' : '#6b7280', fontSize: 14,
            borderBottom: tab === t.key ? '2px solid #00b1b4' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── APPLY TAB ── */}
      {tab === 'apply' && (
        <section className="card">
          <div className="card-header">
            <div><h3>Apply for Leave</h3><p>Select type, date and reason. Your manager will be notified.</p></div>
          </div>

          {/* Leave type picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, fontSize: 14, color: '#374151' }}>
              Leave Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {LEAVE_TYPES.map(type => {
                const bal = balance?.[type.value]
                const exhausted = bal?.available === 0
                const isSelected = leaveType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => !exhausted && setLeaveType(type.value)}
                    disabled={exhausted}
                    style={{
                      padding: '12px 14px', borderRadius: 10, cursor: exhausted ? 'not-allowed' : 'pointer',
                      border: `2px solid ${isSelected ? type.color : exhausted ? '#e5e7eb' : type.border}`,
                      background: isSelected ? type.bg : exhausted ? '#f9fafb' : '#fff',
                      opacity: exhausted ? 0.5 : 1,
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? type.color : '#374151' }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {bal ? `${bal.available} of ${bal.total} left` : type.desc}
                    </div>
                    {exhausted && (
                      <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 3 }}>EXHAUSTED</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date + Reason */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
              <label>Leave Date *</label>
              <input
                type="date"
                value={leaveDate}
                min={today()}
                onChange={e => setLeaveDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 240 }}>
              <label>Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g. Doctor appointment, family emergency…"
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                maxLength={250}
              />
            </div>
          </div>

          {/* Info banner for sick/emergency */}
          {(leaveType === 'sick' || leaveType === 'emergency') && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e'
            }}>
              💡 {leaveType === 'sick' ? 'Sick leave: You may be asked to provide a medical certificate.' : 'Emergency leave: Please inform your manager as soon as possible.'}
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={busy || !leaveDate}
            style={{
              padding: '12px 28px', borderRadius: 10, border: 'none',
              background: !leaveDate ? '#e5e7eb' : '#003b5c',
              color: !leaveDate ? '#9ca3af' : '#fff',
              fontWeight: 700, fontSize: 15,
              cursor: (!leaveDate || busy) ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Submitting…' : 'Submit Leave Request'}
          </button>
        </section>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <section className="card">
          <div className="card-header">
            <div><h3>My Leave Requests</h3><p>Track all your submitted requests and cancel pending ones.</p></div>
          </div>

          {leaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤒</div>
              <p style={{ marginBottom: 8 }}>No leave requests yet.</p>
              <button onClick={() => setTab('apply')} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#003b5c', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}>
                Apply for Leave
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaves.map(leave => {
                const si = STATUS_INFO[leave.status] || STATUS_INFO.pending_leave
                const ti = TYPE_MAP[leave.leave_type] || TYPE_MAP.casual
                const isPending = leave.status === 'pending_leave'

                return (
                  <div key={leave.id} style={{
                    border: `1px solid ${isPending ? '#fde68a' : si.border}`,
                    borderLeft: `4px solid ${isPending ? '#d97706' : si.color}`,
                    borderRadius: 10, padding: '14px 18px',
                    background: si.bg,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <strong style={{ color: '#003b5c', fontSize: 15 }}>
                          📅 {formatDate(leave.attendance_date)}
                        </strong>
                        <span style={{
                          padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: ti.bg, color: ti.color, border: `1px solid ${ti.border}`,
                        }}>
                          {ti.label}
                        </span>
                      </div>
                      {leave.leave_reason && (
                        <div style={{ fontSize: 13, color: '#374151', marginBottom: 3 }}>
                          💬 {leave.leave_reason}
                        </div>
                      )}
                      {leave.remarks && leave.status !== 'pending_leave' && (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          Manager note: {leave.remarks}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: si.bg, color: si.color, border: `1px solid ${si.border}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {si.label}
                      </span>
                      {isPending && (
                        <button
                          onClick={() => handleCancel(leave.id)}
                          disabled={cancelId === leave.id}
                          style={{
                            padding: '6px 14px', borderRadius: 8,
                            border: '1px solid #fecaca', background: '#fff',
                            color: '#dc2626', fontWeight: 700, fontSize: 12,
                            cursor: cancelId === leave.id ? 'not-allowed' : 'pointer',
                            opacity: cancelId === leave.id ? 0.6 : 1,
                          }}
                        >
                          {cancelId === leave.id ? '…' : '✕ Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
