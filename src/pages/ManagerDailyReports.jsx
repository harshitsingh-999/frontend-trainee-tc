import React, { useState, useEffect } from 'react'
import { getInternDailyReports, acknowledgeDailyReport } from '../api/api'
import toast from 'react-hot-toast'

function ManagerDailyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [ackLoading, setAckLoading] = useState({})

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await getInternDailyReports()
      setReports(res?.data?.data || [])
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const handleAcknowledge = async (id, e) => {
    e.stopPropagation()
    setAckLoading(prev => ({ ...prev, [id]: true }))
    try {
      await acknowledgeDailyReport(id)
      toast.success('Report acknowledged!')
      fetchReports()
    } catch {
      toast.error('Failed to acknowledge')
    } finally {
      setAckLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const filtered = filter === 'all' ? reports : reports.filter(r =>
    filter === 'pending' ? r.status !== 'acknowledged' : r.status === 'acknowledged'
  )

  const pendingCount = reports.filter(r => r.status !== 'acknowledged').length

  const initials = (name = '') => name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'I'

  return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
          Intern Daily Reports
        </h2>
        <p style={{ color: '#6b7280', margin: '5px 0 0', fontSize: 14 }}>
          Review work updates and acknowledge reports from your interns
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Reports', value: reports.length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Pending Review', value: pendingCount, color: '#d97706', bg: '#fffbeb' },
          { label: 'Acknowledged', value: reports.length - pendingCount, color: '#16a34a', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px 18px', borderRadius: 10, background: s.bg,
            border: `1px solid ${s.color}30`
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'acknowledged', label: 'Acknowledged' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 18px', borderRadius: 20, border: '1px solid #d1d5db',
            background: filter === f.key ? '#2563eb' : '#fff',
            color: filter === f.key ? '#fff' : '#374151',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>
            {f.label}
          </button>
        ))}
        <button onClick={fetchReports} style={{
          marginLeft: 'auto', padding: '7px 16px', borderRadius: 20,
          border: '1px solid #d1d5db', background: '#fff',
          color: '#6b7280', cursor: 'pointer', fontSize: 13,
        }}>
          ↻ Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, borderRadius: 12,
          border: '2px dashed #e5e7eb', color: '#9ca3af',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No {filter === 'all' ? '' : filter} reports found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {filter === 'pending' ? 'All reports have been acknowledged!' : 'No reports submitted yet.'}
          </div>
        </div>
      ) : (
        filtered.map(r => {
          const isPending = r.status !== 'acknowledged'
          const isExpanded = expandedId === r.id

          return (
            <div
              key={r.id}
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              style={{
                background: '#fff',
                border: `1px solid ${isPending ? '#fde68a' : '#e5e7eb'}`,
                borderLeft: `4px solid ${isPending ? '#f59e0b' : '#10b981'}`,
                borderRadius: 12, padding: '16px 20px', marginBottom: 12,
                cursor: 'pointer', transition: 'box-shadow 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
            >
              {/* Row header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: '#dbeafe', color: '#1d4ed8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14,
                  }}>
                    {initials(r.intern?.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                      {r.intern?.name || 'Intern'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {r.intern?.email} &nbsp;·&nbsp; {r.report_date}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: isPending ? '#fef3c7' : '#d1fae5',
                    color: isPending ? '#92400e' : '#065f46',
                  }}>
                    {isPending ? '⏳ Pending' : '✓ Acknowledged'}
                  </span>
                  {isPending && (
                    <button
                      onClick={e => handleAcknowledge(r.id, e)}
                      disabled={ackLoading[r.id]}
                      style={{
                        padding: '5px 16px', borderRadius: 8, border: 'none',
                        background: ackLoading[r.id] ? '#9ca3af' : '#2563eb',
                        color: '#fff', cursor: ackLoading[r.id] ? 'not-allowed' : 'pointer',
                        fontSize: 13, fontWeight: 600,
                      }}>
                      {ackLoading[r.id] ? '...' : 'Acknowledge'}
                    </button>
                  )}
                  <span style={{ color: '#9ca3af', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
              </div>

              {/* Preview line when collapsed */}
              {!isExpanded && (
                <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong style={{ color: '#374151' }}>Work: </strong>{r.work_done}
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'grid', gap: 14 }}>
                  <section>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Work Done Today</div>
                    <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.7 }}>{r.work_done}</p>
                  </section>
                  {r.blockers && (
                    <section>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Blockers / Issues</div>
                      <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.7 }}>{r.blockers}</p>
                    </section>
                  )}
                  {r.plan_tomorrow && (
                    <section>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Plan for Tomorrow</div>
                      <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.7 }}>{r.plan_tomorrow}</p>
                    </section>
                  )}
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Submitted: {new Date(r.createdAt || r.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default ManagerDailyReports
