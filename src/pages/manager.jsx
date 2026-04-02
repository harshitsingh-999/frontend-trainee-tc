import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'

// ─── constants ────────────────────────────────────────────
const PRIORITY_COLORS = {
  low:      { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  medium:   { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  high:     { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
}
const STATUS_COLORS = {
  todo:        { bg: '#f1f5f9', text: '#475569' },
  in_progress: { bg: '#eff6ff', text: '#2563eb' },
  review:      { bg: '#faf5ff', text: '#7c3aed' },
  completed:   { bg: '#f0fdf4', text: '#16a34a' },
  blocked:     { bg: '#fef2f2', text: '#dc2626' },
  rejected:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
}
const LEAVE_STATUS = {
  pending_leave:  { label: ' Pending',  bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  on_leave:       { label: '✓ Approved', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  leave_rejected: { label: '✕ Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}
const LEAVE_TYPES = {
  casual:    { label: ' Casual',   color: '#2563eb' },
  sick:      { label: ' Sick',     color: '#16a34a' },
  emergency: { label: ' Emergency',color: '#dc2626' },
  personal:  { label: ' Personal', color: '#7c3aed' },
}
const EMPTY_TASK = {
  title: '', description: '', assigned_to: '', project_id: '',
  start_date: '', due_date: '', priority: 'medium', tech_stack: '',
  status: 'todo', completion_percentage: 0,
}

// ─── helpers ──────────────────────────────────────────────
function Badge({ value, map }) {
  const s = map[value] || { bg: '#f1f5f9', text: '#475569' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      border: `1px solid ${s.border || s.bg}`,
      borderRadius: 6, padding: '2px 10px',
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {value?.replace(/_/g, ' ')}
    </span>
  )
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
const formatDateTime = (d) => {
  if (!d) return '—'
  const p = new Date(d)
  if (isNaN(p)) return d
  return p.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Internship Timeline component (reused by manager) ────
function InternshipTimeline({ trainee }) {
  if (!trainee) return null

  const start = trainee.enrollment_date ? new Date(trainee.enrollment_date) : null
  const end   = trainee.expected_end_date ? new Date(trainee.expected_end_date) : null
  const now   = new Date()

  let pct = 0
  let daysLeft = null
  let totalDays = null
  if (start && end) {
    totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
    const elapsed = Math.round((now - start) / (1000 * 60 * 60 * 24))
    pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)))
    daysLeft = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)))
  }

  const isCompleted = trainee.current_status === 'completed' || (end && now > end)
  const isLate = daysLeft !== null && daysLeft <= 14 && !isCompleted

  const milestones = []
  if (start && end) {
    milestones.push({ label: 'Start', date: start, pct: 0 })
    milestones.push({ label: '25%', date: new Date(start.getTime() + (end - start) * 0.25), pct: 25 })
    milestones.push({ label: 'Mid', date: new Date(start.getTime() + (end - start) * 0.5), pct: 50 })
    milestones.push({ label: '75%', date: new Date(start.getTime() + (end - start) * 0.75), pct: 75 })
    milestones.push({ label: 'End', date: end, pct: 100 })
  }

  return (
    <div>
      {/* Info row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'College',    value: trainee.college_name || '—' },
          { label: 'Course',     value: trainee.course || '—' },
          { label: 'Batch Year', value: trainee.batch_year || '—' },
          { label: 'GPA',        value: trainee.gpa ? `${trainee.gpa} / 10` : '—' },
        ].map(item => (
          <div key={item.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontWeight: 600, color: '#003b5c', fontSize: 14 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      {start && end ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Internship Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: isCompleted ? '#16a34a' : isLate ? '#dc2626' : '#00b1b4' }}>
              {isCompleted ? '✓ Completed' : isLate ? `⚠ ${daysLeft} days left` : `${daysLeft} days remaining`}
            </span>
          </div>

          {/* Progress bar with milestones */}
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{ height: 10, background: '#e5e7eb', borderRadius: 99, overflow: 'visible', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: isCompleted ? '#16a34a' : isLate ? '#ef4444' : 'linear-gradient(90deg, #00b1b4, #003b5c)',
                width: `${pct}%`, transition: 'width 0.5s ease',
              }} />
            </div>

            {/* Milestone dots */}
            {milestones.map(m => {
              const isPast = pct >= m.pct
              return (
                <div key={m.label} style={{ position: 'absolute', top: -3, left: `${m.pct}%`, transform: 'translateX(-50%)' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: isPast ? '#003b5c' : '#e5e7eb',
                    border: `2px solid ${isPast ? '#00b1b4' : '#d1d5db'}`,
                    transition: 'all 0.3s',
                  }} />
                  <div style={{
                    position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: 10, color: '#6b7280', textAlign: 'center',
                  }}>
                    <div style={{ fontWeight: 600 }}>{m.label}</div>
                    <div>{m.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            <span>Started: <strong>{formatDate(trainee.enrollment_date)}</strong></span>
            <span style={{ fontWeight: 700, color: '#003b5c', fontSize: 15 }}>{pct}% complete</span>
            <span>Ends: <strong>{formatDate(trainee.expected_end_date)}</strong></span>
          </div>

          {totalDays && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Total duration: {totalDays} days
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: 20, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
          ⚠ Enrollment date or expected end date not set for this intern.
        </div>
      )}
    </div>
  )
}

// ─── Worklog view ──────────────────────────────────────────
function WorklogView({ traineeUserId, intern }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    api.get(`/manager/interns/${traineeUserId}/worklog`)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [traineeUserId])

  if (loading) return <div style={{ padding: 20, color: '#9ca3af' }}>Loading worklog…</div>
  if (!data)   return <div style={{ padding: 20, color: '#dc2626' }}>Failed to load worklog.</div>

  const { tasks, totalSubmissions } = data

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Tasks',     value: tasks.length },
          { label: 'Submissions',     value: totalSubmissions },
          { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'completed').length },
          { label: 'In Progress',     value: tasks.filter(t => t.status === 'in_progress').length },
        ].map(s => (
          <div key={s.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 18px', border: '1px solid #e2e8f0', minWidth: 100 }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#003b5c' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>No tasks assigned to this intern yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(task => {
            const isOpen = expanded[task.id]
            const s = STATUS_COLORS[task.status] || STATUS_COLORS.todo
            return (
              <div key={task.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                {/* Task row */}
                <div
                  onClick={() => setExpanded(prev => ({ ...prev, [task.id]: !isOpen }))}
                  style={{
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: 'pointer', background: isOpen ? '#f0f9ff' : '#fff',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#003b5c' }}>{task.title}</strong>
                      <Badge value={task.status} map={STATUS_COLORS} />
                      <Badge value={task.priority} map={PRIORITY_COLORS} />
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                      Due: {formatDate(task.due_date)} · {task.submissions.length} submission{task.submissions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                    <div style={{ width: 70, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#00b1b4', borderRadius: 99, width: `${task.completion_percentage || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{task.completion_percentage || 0}%</span>
                  </div>
                  <span style={{ fontSize: 16, color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Submissions */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa', padding: '12px 16px' }}>
                    {task.submissions.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: 13 }}>No submissions yet for this task.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {task.submissions.map((sub, i) => (
                          <div key={sub.id} style={{
                            padding: '10px 14px', borderRadius: 8,
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderLeft: i === 0 ? '3px solid #00b1b4' : '3px solid #e2e8f0',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {i === 0 && (
                                  <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb',
                                    borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>Latest</span>
                                )}
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                                  Submission #{task.submissions.length - i}
                                </span>
                              </div>
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDateTime(sub.createdAt)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                              {sub.work_notes}
                            </p>
                            {sub.file_name && (
                              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>📎 {sub.file_name}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Intern Detail Modal ───────────────────────────────────
function InternDetailModal({ trainee, onClose }) {
  const [detailTab, setDetailTab] = useState('timeline')

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <h3 style={{ margin: 0, color: '#003b5c' }}>{trainee.user?.name}</h3>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>{trainee.user?.email}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
              background: trainee.current_status === 'active' ? '#f0fdf4' : '#f1f5f9',
              color: trainee.current_status === 'active' ? '#16a34a' : '#475569',
            }}>
              {trainee.current_status}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { key: 'timeline', label: ' Internship Timeline' },
            { key: 'worklog',  label: ' Task Worklog' },
          ].map(t => (
            <button key={t.key} onClick={() => setDetailTab(t.key)} style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', background: 'none',
              fontWeight: detailTab === t.key ? 700 : 400,
              color: detailTab === t.key ? '#00b1b4' : '#6b7280', fontSize: 13,
              borderBottom: detailTab === t.key ? '2px solid #00b1b4' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {detailTab === 'timeline' && <InternshipTimeline trainee={trainee} />}
          {detailTab === 'worklog'  && <WorklogView traineeUserId={trainee.user_id} intern={trainee} />}
        </div>
      </div>
    </div>
  )
}

// ─── Project Create Card ──────────────────────────────────
function ProjectCreateCard({ projects, onCreated }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    project_name: '', description: '', start_date: '', end_date: '',
    status: 'active', priority: 'medium',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.post('/manager/projects', form)
      setSuccess('Project created successfully!')
      setForm({ project_name: '', description: '', start_date: '', end_date: '', status: 'active', priority: 'medium' })
      setShowForm(false)
      onCreated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally { setSaving(false) }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3>Projects</h3>
          <p>Projects are used to group tasks. Each task must belong to a project.</p>
        </div>
        <button className="btn-primary btn-small" onClick={() => { setShowForm(s => !s); setError(''); setSuccess('') }}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontWeight: 600, fontSize: 13, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
          ✓ {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))} required placeholder="e.g. Customer Portal" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>No projects yet. Create one to start assigning tasks.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
              padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
            }}>
              <div>
                <span style={{ fontWeight: 700, color: '#003b5c' }}>#{p.id} — {p.project_name}</span>
                {p.description && <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{p.description}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  textTransform: 'capitalize',
                  background: p.status === 'active' ? '#eff6ff' : p.status === 'completed' ? '#f0fdf4' : '#f1f5f9',
                  color: p.status === 'active' ? '#2563eb' : p.status === 'completed' ? '#16a34a' : '#475569',
                }}>{p.status?.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Main Manager Component ────────────────────────────────
// ─── All Interns Tab Component ────────────────────────────────────────────────
function AllInternsTab({ allInterns, myId, onAssigned }) {
  const [assigning, setAssigning] = useState(null)
  const [msg,       setMsg]       = useState('')
  const [msgType,   setMsgType]   = useState('ok')
  const [search,    setSearch]    = useState('')

  const filtered = allInterns.filter(t =>
    !search ||
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    (t.course || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = async (trainee) => {
    setAssigning(trainee.id)
    setMsg('')
    try {
      await api.put(`/manager/interns/${trainee.id}/assign-manager`, {})
      setMsg(`✓ You are now the manager for ${trainee.user?.name}!`)
      setMsgType('ok')
      onAssigned()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to assign manager')
      setMsgType('err')
    } finally {
      setAssigning(null)
    }
  }

  const getManagerLabel = (trainee) => {
    if (!trainee.manager_id)          return { text: 'Unassigned',            color: '#dc2626', bg: '#fef2f2' }
    if (trainee.manager_id === myId)  return { text: 'You',                   color: '#16a34a', bg: '#f0fdf4' }
    return                                   { text: `Manager #${trainee.manager_id}`, color: '#2563eb', bg: '#eff6ff' }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3>All Interns in the System</h3>
          <p>View every intern. Click <strong>+ Assign Me</strong> on unassigned interns to take them under your supervision.</p>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          fontWeight: 600, fontSize: 13,
          background: msgType === 'ok' ? '#f0fdf4' : '#fef2f2',
          color:      msgType === 'ok' ? '#16a34a' : '#dc2626',
          border: `1px solid ${msgType === 'ok' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {msg}
        </div>
      )}

      <input
        type="text" placeholder="Search by name, email or course…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '9px 14px', borderRadius: 9, marginBottom: 16,
          border: '1.5px solid #dde3f0', fontSize: 13, fontFamily: 'inherit',
          outline: 'none', boxSizing: 'border-box' }}
      />

      {/* Counters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',      value: allInterns.length,                                                    color: '#003b5c' },
          { label: 'Unassigned', value: allInterns.filter(t => !t.manager_id).length,                        color: '#dc2626' },
          { label: 'Mine',       value: allInterns.filter(t => t.manager_id === myId).length,                color: '#16a34a' },
          { label: 'Others',     value: allInterns.filter(t => t.manager_id && t.manager_id !== myId).length, color: '#2563eb' },
        ].map(s => (
          <div key={s.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 18px',
            border: '1px solid #e2e8f0', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>No interns found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Course</th><th>Status</th><th>Manager</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(trainee => {
                const ml       = getManagerLabel(trainee)
                const isMe     = trainee.manager_id === myId
                const hasOther = trainee.manager_id && !isMe
                return (
                  <tr key={trainee.id}>
                    <td><strong>{trainee.user?.name || '—'}</strong></td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{trainee.user?.email || '—'}</td>
                    <td>{trainee.course || '—'}</td>
                    <td>
                      <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        textTransform: 'capitalize',
                        background: trainee.current_status === 'active' ? '#f0fdf4' : '#f1f5f9',
                        color:      trainee.current_status === 'active' ? '#16a34a' : '#475569' }}>
                        {trainee.current_status}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12,
                        fontWeight: 600, background: ml.bg, color: ml.color }}>
                        {ml.text}
                      </span>
                    </td>
                    <td>
                      {isMe ? (
                        <span style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12,
                          background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Your Intern
                        </span>
                      ) : hasOther ? (
                        <span style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12,
                          background: '#f1f5f9', color: '#9ca3af', fontWeight: 500 }}>
                          Already assigned
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAssign(trainee)}
                          disabled={assigning === trainee.id}
                          style={{ padding: '5px 14px', borderRadius: 7, border: 'none',
                            background: assigning === trainee.id ? '#e5e7eb' : '#003b5c',
                            color: assigning === trainee.id ? '#9ca3af' : '#fff',
                            fontWeight: 700, fontSize: 12,
                            cursor: assigning === trainee.id ? 'default' : 'pointer' }}>
                          {assigning === trainee.id ? 'Assigning…' : '+ Assign Me'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function Manager() {
  const { user } = useAuth()

  // data
  const [interns,        setInterns]        = useState([])
  const [allInterns,     setAllInterns]     = useState([])
  const [tasks,          setTasks]          = useState([])
  const [pendingLeaves,  setPendingLeaves]  = useState([])
  const [projects,       setProjects]       = useState([])
  const [projectProgress, setProjectProgress] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')

  // tabs
  const [tab, setTab] = useState('overview')
  const [taskStatusFilter, setTaskStatusFilter] = useState('')

  // task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask,  setEditingTask]  = useState(null)
  const [taskForm,     setTaskForm]     = useState(EMPTY_TASK)
  const [taskSaving,   setTaskSaving]   = useState(false)
  const [taskError,    setTaskError]    = useState('')

  // leave (manual assign)
  const [leaveForm,    setLeaveForm]    = useState({ trainee_user_id: '', leave_date: '', remarks: '' })
  const [leaveSaving,  setLeaveSaving]  = useState(false)
  const [leaveError,   setLeaveError]   = useState('')
  const [leaveSuccess, setLeaveSuccess] = useState('')

  // leave requests
  const [respondingId, setRespondingId] = useState(null)
  const [leaveMsg,     setLeaveMsg]     = useState('')
  const [leaveTab,     setLeaveTab]     = useState('requests') // 'requests' | 'assign'

  // submissions modal
  const [submissionTask,    setSubmissionTask]    = useState(null)
  const [taskSubmissions,   setTaskSubmissions]   = useState([])
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const [submissionError,   setSubmissionError]   = useState('')

  // evaluation
  const [evalIntern,   setEvalIntern]   = useState(null)
  const [evalForm,     setEvalForm]     = useState({ technical_skills: 3, communication: 3, teamwork: 3, problem_solving: 3, punctuality: 3, comments: '' })
  const [evalSaving,   setEvalSaving]   = useState(false)
  const [evalSuccess,  setEvalSuccess]  = useState('')
  const [evaluatedIds, setEvaluatedIds] = useState(new Set())

  // intern detail
  const [detailIntern, setDetailIntern] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    const [internsRes, allInternsRes, tasksRes, leavesRes, projectsRes, progressRes] = await Promise.all([
      api.get('/manager/interns').catch(() => null),
      api.get('/manager/all-interns').catch(() => null),
      api.get('/manager/tasks').catch(() => null),
      api.get('/manager/leave-requests').catch(() => null),
      api.get('/manager/projects').catch(() => null),
      api.get('/manager/project-progress').catch(() => null),
    ])
    if (internsRes)    setInterns(internsRes.data.data || [])
    if (allInternsRes) setAllInterns(allInternsRes.data.data || [])
    if (tasksRes)      setTasks(tasksRes.data.data || [])
    if (leavesRes)     setPendingLeaves(leavesRes.data.data || [])
    if (projectsRes)   setProjects(projectsRes.data.data || [])
    if (progressRes)   setProjectProgress(progressRes.data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    // FIX 10: auto-refresh manager data every 60s
    const id = setInterval(fetchAll, 60000)
    return () => clearInterval(id)
  }, [fetchAll])

  // ── task handlers ──
  const openCreate = () => { setEditingTask(null); setTaskForm(EMPTY_TASK); setTaskError(''); setShowTaskForm(true) }
  const openEdit   = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title, description: task.description || '',
      assigned_to: task.assigned_to, project_id: task.project_id,
      start_date: task.start_date || '', due_date: task.due_date,
      priority: task.priority, tech_stack: task.tech_stack || '',
      status: task.status, completion_percentage: task.completion_percentage || 0,
    })
    setTaskError('')
    setShowTaskForm(true)
  }
  const handleTaskChange = (e) => {
    const { name, value } = e.target
    setTaskForm(prev => ({ ...prev, [name]: value }))
  }
  const submitTask = async (e) => {
    e.preventDefault()
    setTaskSaving(true); setTaskError('')
    try {
      if (editingTask) await api.put(`/manager/tasks/${editingTask.id}`, taskForm)
      else             await api.post('/manager/tasks', taskForm)
      setShowTaskForm(false); fetchAll()
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task')
    } finally { setTaskSaving(false) }
  }
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    try { await api.delete(`/manager/tasks/${id}`); setTasks(prev => prev.filter(t => t.id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete') }
  }

  // ── submissions ──
  const openSubmissions = async (task) => {
    setSubmissionTask(task); setTaskSubmissions([]); setSubmissionError(''); setSubmissionLoading(true)
    try {
      const res = await api.get(`/manager/tasks/${task.id}/submissions`)
      setTaskSubmissions(res.data?.data || [])
    } catch (err) { setSubmissionError(err.response?.data?.message || 'Failed to load') }
    finally { setSubmissionLoading(false) }
  }
  const closeSubmissions = () => { setSubmissionTask(null); setTaskSubmissions([]); setSubmissionError('') }
  const rejectTask = async (taskId) => {
    if (!window.confirm('Reject this submission? The intern will be asked to resubmit.')) return
    try {
      await api.put(`/manager/tasks/${taskId}`, { status: 'rejected' })
      const res = await api.get('/manager/tasks').catch(() => null)
      if (res) setTasks(res.data.data || [])
      setSubmissionTask(prev => prev ? { ...prev, status: 'rejected' } : null)
    } catch (err) { alert(err.response?.data?.message || 'Failed to reject') }
  }

  // ── evaluation ──
  const submitEvaluation = async () => {
    setEvalSaving(true)
    try {
      await api.post('/manager/evaluations', { trainee_id: evalIntern.id, ...evalForm })
      setEvaluatedIds(prev => new Set([...prev, evalIntern.id]))
      setEvalSuccess(`Evaluation saved for ${evalIntern.user?.name}!`)
      setEvalIntern(null)
    } catch (err) { alert(err.response?.data?.message || 'Failed to save evaluation') }
    finally { setEvalSaving(false) }
  }

  // ── leave assign ──
  const submitLeave = async (e) => {
    e.preventDefault(); setLeaveSaving(true); setLeaveError(''); setLeaveSuccess('')
    try {
      await api.post('/manager/leaves', leaveForm)
      setLeaveSuccess('Leave assigned successfully!')
      setLeaveForm({ trainee_user_id: '', leave_date: '', remarks: '' })
    } catch (err) { setLeaveError(err.response?.data?.message || 'Failed to assign leave') }
    finally { setLeaveSaving(false) }
  }

  // ── leave request approve/reject ──
  const respondLeave = async (id, action) => {
    setRespondingId(id); setLeaveMsg('')
    try {
      const res = await api.put(`/manager/leave-requests/${id}`, { action })
      setLeaveMsg(res.data.message)
      setPendingLeaves(prev => prev.filter(l => l.id !== id))
    } catch (err) { setLeaveMsg(err.response?.data?.message || 'Action failed') }
    finally { setRespondingId(null) }
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading manager dashboard…</div>

  // ── derived stats ──
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const reviewTasks    = tasks.filter(t => t.status === 'review').length
  const overdueCount   = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length

  const TABS = [
    { key: 'overview',          label: ' Overview' },
    { key: 'interns',           label: ` My Interns (${interns.length})` },
    // { key: 'all-interns',       label: ` All Interns (${allInterns.length})` },
    { key: 'tasks',             label: ` Tasks (${tasks.length})` },
    { key: 'project-progress',  label: ' Project Progress' },
    { key: 'leaves',            label: ` Leaves${pendingLeaves.length ? ` (${pendingLeaves.length} pending)` : ''}` },
  ]

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h2>Intern Dashboard</h2>
          <p>Manage your interns, assign tasks, and approve leaves.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary btn-small" onClick={openCreate}>+ New Task</button>
          <button className="btn-secondary btn-small" onClick={() => { setTab('leaves'); setLeaveTab('assign') }}>+ Assign Leave</button>
        </div>
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', border: 'none', cursor: 'pointer', background: 'none',
            fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? '#00b1b4' : '#6b7280', fontSize: 14,
            borderBottom: tab === t.key ? '2px solid #00b1b4' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stats grid */}
          <div className="stats-grid">
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setTab('interns')}>
              <div className="stat-label">My Interns</div>
              <div className="stat-value">{interns.length}</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setTab('tasks')}>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-value">{tasks.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">In Progress</div>
              <div className="stat-value">{inProgressTasks}</div>
            </div>
            <div className="stat-card"
              style={{ cursor: reviewTasks > 0 ? 'pointer' : 'default', background: reviewTasks > 0 ? '#faf5ff' : undefined, border: reviewTasks > 0 ? '1px solid #e9d5ff' : undefined }}
              onClick={() => { if (reviewTasks > 0) { setTaskStatusFilter('review'); setTab('tasks') } }}>
              <div className="stat-label" style={{ color: reviewTasks > 0 ? '#7c3aed' : undefined }}>In Review</div>
              <div className="stat-value" style={{ color: reviewTasks > 0 ? '#7c3aed' : undefined }}>{reviewTasks}</div>
              {reviewTasks > 0 && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 2 }}>Click to review →</div>}
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value" style={{ color: '#16a34a' }}>{completedTasks}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label" style={{ color: overdueCount > 0 ? '#dc2626' : undefined }}>Overdue</div>
              <div className="stat-value" style={{ color: overdueCount > 0 ? '#dc2626' : undefined }}>{overdueCount}</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setTab('leaves'); setLeaveTab('requests') }}>
              <div className="stat-label">Pending Leaves</div>
              <div className="stat-value" style={{ color: pendingLeaves.length > 0 ? '#d97706' : undefined }}>{pendingLeaves.length}</div>
            </div>
          </div>

          {/* Intern status summary */}
          <section className="card">
            <div className="card-header">
              <div><h3>Intern Summary</h3><p>Quick overview of all interns under your supervision.</p></div>
            </div>
            {interns.length === 0 ? (
              <p style={{ color: '#9ca3af', padding: 8 }}>No interns assigned yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Name</th><th>Course</th><th>Enrolled</th><th>Ends</th><th>Progress</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {interns.map(t => {
                      const start = t.enrollment_date ? new Date(t.enrollment_date) : null
                      const end   = t.expected_end_date ? new Date(t.expected_end_date) : null
                      const now   = new Date()
                      let pct = 0
                      if (start && end) {
                        const total   = end - start
                        const elapsed = now - start
                        pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
                      }
                      const myTasks = tasks.filter(tk => tk.assigned_to === t.user_id)
                      return (
                        <tr key={t.id}>
                          <td><strong>{t.user?.name}</strong><div style={{ fontSize: 11, color: '#9ca3af' }}>{t.user?.email}</div></td>
                          <td>{t.course || '—'}</td>
                          <td>{formatDate(t.enrollment_date)}</td>
                          <td>{formatDate(t.expected_end_date)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#00b1b4', borderRadius: 99, width: `${pct}%` }} />
                              </div>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`pill ${t.current_status === 'active' ? 'pill-green' : 'pill-soft'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                              {t.current_status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => setDetailIntern(t)} style={{
                              padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
                              background: '#f8fafc', color: '#003b5c', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                            }}>View →</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Pending leave requests quick view */}
          {pendingLeaves.length > 0 && (
            <section className="card">
              <div className="card-header">
                <div><h3> Pending Leave Requests</h3><p>{pendingLeaves.length} request{pendingLeaves.length !== 1 ? 's' : ''} awaiting your action.</p></div>
                <button className="btn-secondary btn-small" onClick={() => { setTab('leaves'); setLeaveTab('requests') }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingLeaves.slice(0, 3).map(leave => (
                  <div key={leave.id} style={{
                    border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px',
                    background: '#fffbeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <strong style={{ color: '#003b5c' }}>{leave.trainee?.user?.name}</strong>
                      <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 10 }}>📅 {formatDate(leave.attendance_date)}</span>
                      {leave.leave_reason && <span style={{ fontSize: 13, color: '#374151', marginLeft: 10 }}>· {leave.leave_reason}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => respondLeave(leave.id, 'approve')} disabled={respondingId === leave.id}
                        style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => respondLeave(leave.id, 'reject')} disabled={respondingId === leave.id}
                        style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          INTERNS TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'interns' && (
        <section className="card">
          <div className="card-header">
            <div><h3>My Interns</h3><p>All interns currently assigned under your supervision. Click View to see timeline & worklog.</p></div>
          </div>
          {evalSuccess && (
            <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
              ⭐ {evalSuccess}
            </p>
          )}
          {interns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>No interns assigned to you yet.</div>
          ) : (
            <ul className="list">
              {interns.map(trainee => (
                <li key={trainee.id} className="list-item">
                  <div>
                    <div className="list-title">{trainee.user?.name || 'Unknown'}</div>
                    <div className="list-subtitle">
                      {trainee.user?.email} · {trainee.course || 'N/A'} · Ends: {formatDate(trainee.expected_end_date)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`pill ${trainee.current_status === 'active' ? 'pill-green' : 'pill-soft'}`} style={{ textTransform: 'capitalize' }}>
                      {trainee.current_status}
                    </span>
                    <button onClick={() => setDetailIntern(trainee)} style={{
                      padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0',
                      background: '#f8fafc', color: '#003b5c', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    }}>
                      Timeline / Worklog
                    </button>
                    {evaluatedIds.has(trainee.id) ? (
                      <span style={{ padding: '5px 12px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                         Evaluated
                      </span>
                    ) : (
                      <button
                        onClick={() => { setEvalIntern(trainee); setEvalForm({ technical_skills: 3, communication: 3, teamwork: 3, problem_solving: 3, punctuality: 3, comments: '' }) }}
                        style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#003b5c', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                         Evaluate
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          ALL INTERNS TAB
      ══════════════════════════════════════════════════════ */}
      {/* {tab === 'all-interns' && (
        <AllInternsTab allInterns={allInterns} myId={user?.id} onAssigned={fetchAll} />
      )} */}

      {/* ══════════════════════════════════════════════════════
          TASKS TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'tasks' && (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Tasks Assigned by You</h3>
              <p>Create, edit or delete tasks for your interns. Tasks are grouped by <strong>Project</strong>.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={taskStatusFilter}
                onChange={e => setTaskStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 12, background: '#f8fafc', cursor: 'pointer' }}>
                <option value="">All Statuses</option>
                <option value="review">⚡ In Review</option>
                <option value="in_progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="pending">⏳ Pending</option>
              </select>
              {taskStatusFilter && (
                <button onClick={() => setTaskStatusFilter('')}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}>
                  Clear ✕
                </button>
              )}
              <button className="btn-secondary btn-small" onClick={() => setTab('project-progress')}>
                📁 Manage Projects
              </button>
            </div>
          </div>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              No tasks yet. Click <strong>+ New Task</strong> to create one.
            </div>
          ) : (() => {
              const filtered = taskStatusFilter ? tasks.filter(t => t.status === taskStatusFilter) : tasks;
              return filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
                  No tasks with status <strong>"{taskStatusFilter}"</strong>.
                </div>
              ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Title</th><th>Assigned To</th><th>Due Date</th><th>Priority</th><th>Status</th><th>Progress</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(task => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        {task.tech_stack && <div style={{ fontSize: 11, color: '#9ca3af' }}>{task.tech_stack}</div>}
                      </td>
                      <td>{task.assignee?.name || `User #${task.assigned_to}`}</td>
                      <td>{formatDate(task.due_date)}</td>
                      <td><Badge value={task.priority} map={PRIORITY_COLORS} /></td>
                      <td><Badge value={task.status}   map={STATUS_COLORS} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{ height: '100%', background: '#00b1b4', borderRadius: 99, width: `${task.completion_percentage || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{task.completion_percentage || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary btn-small" onClick={() => openSubmissions(task)}>Submissions</button>
                          <button className="btn-secondary btn-small" onClick={() => openEdit(task)}>Edit</button>
                          <button onClick={() => handleDelete(task.id)} style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              );
            })()}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          PROJECT PROGRESS TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'project-progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Create Project form */}
          <ProjectCreateCard projects={projects} onCreated={fetchAll} />

          {/* Progress cards */}
          {projectProgress.length === 0 ? (
            <section className="card">
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                <p>No projects yet. Create a project above to start tracking intern progress.</p>
              </div>
            </section>
          ) : (
            projectProgress.map(({ project, interns: internList }) => (
              <section key={project.id} className="card">
                {/* Project header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  flexWrap: 'wrap', gap: 10, marginBottom: 16,
                  paddingBottom: 14, borderBottom: '1px solid #e5e7eb'
                }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#003b5c', fontSize: 17 }}>{project.project_name}</h3>
                    {project.description && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{project.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: project.status === 'active' ? '#eff6ff' : project.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                        color: project.status === 'active' ? '#2563eb' : project.status === 'completed' ? '#16a34a' : '#d97706',
                        textTransform: 'capitalize',
                      }}>{project.status?.replace('_', ' ')}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: '#f1f5f9', color: '#475569', textTransform: 'capitalize',
                      }}>Priority: {project.priority}</span>
                      {project.start_date && (
                        <span style={{ fontSize: 11, color: '#9ca3af', padding: '2px 6px' }}>
                          {formatDate(project.start_date)} → {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '8px 16px', textAlign: 'center', minWidth: 80,
                  }}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Interns</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#003b5c' }}>{internList.length}</div>
                  </div>
                </div>

                {internList.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>
                    No tasks assigned under this project yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {internList.map(internData => {
                      const pct = internData.avgCompletion
                      const completionColor = pct >= 80 ? '#16a34a' : pct >= 40 ? '#00b1b4' : '#d97706'
                      return (
                        <div key={internData.user?.id} style={{
                          border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px',
                          background: '#fafafa',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #003b5c, #00b1b4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
                              }}>
                                {(internData.user?.name || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#003b5c', fontSize: 14 }}>
                                  {internData.user?.name || `User #${internData.user?.id}`}
                                </div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{internData.user?.email}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {[
                                { label: 'Tasks',       value: internData.totalTasks,     color: '#003b5c' },
                                { label: 'Done',        value: internData.completedTasks, color: '#16a34a' },
                                { label: 'In Progress', value: internData.inProgressTasks, color: '#2563eb' },
                                { label: 'Review',      value: internData.reviewTasks,    color: '#7c3aed' },
                              ].map(s => (
                                <div key={s.label} style={{
                                  background: '#fff', border: '1px solid #e2e8f0',
                                  borderRadius: 8, padding: '5px 12px', textAlign: 'center', minWidth: 55,
                                }}>
                                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.label}</div>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                                Overall Progress
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: completionColor }}>
                                {pct}%
                              </span>
                            </div>
                            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 99, width: `${pct}%`,
                                background: pct >= 80
                                  ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                                  : pct >= 40
                                  ? 'linear-gradient(90deg,#003b5c,#00b1b4)'
                                  : 'linear-gradient(90deg,#d97706,#fbbf24)',
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                            {internData.totalTasks > 0 && (
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                {internData.completedTasks} of {internData.totalTasks} tasks completed
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      )}
    
      {tab === 'leaves' && (
        <div>
          {/* Sub-tab switcher */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
            {[
              { key: 'requests', label: ` Leave Requests${pendingLeaves.length ? ` (${pendingLeaves.length})` : ''}` },
              { key: 'assign',   label: '+ Manually Assign Leave' },
            ].map(t => (
              <button key={t.key} onClick={() => setLeaveTab(t.key)} style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', background: 'none',
                fontWeight: leaveTab === t.key ? 700 : 400,
                color: leaveTab === t.key ? '#00b1b4' : '#6b7280', fontSize: 13,
                borderBottom: leaveTab === t.key ? '2px solid #00b1b4' : '2px solid transparent',
                marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Leave requests */}
          {leaveTab === 'requests' && (
            <section className="card">
              <div className="card-header">
                <div><h3>Pending Leave Requests</h3><p>Approve or reject leave requests from your interns.</p></div>
              </div>
              {leaveMsg && (
                <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✓ {leaveMsg}</p>
              )}
              {pendingLeaves.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                  <p>No pending leave requests. All caught up!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingLeaves.map(leave => {
                    const lt = LEAVE_TYPES[leave.leave_type] || LEAVE_TYPES.casual
                    return (
                      <div key={leave.id} style={{
                        border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px',
                        background: '#fffbeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#003b5c', marginBottom: 4 }}>
                            {leave.trainee?.user?.name || `Trainee #${leave.trainee_id}`}
                            <span style={{ marginLeft: 10, fontSize: 12, color: lt.color, fontWeight: 600 }}>{lt.label}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>
                            📅 <strong>{formatDate(leave.attendance_date)}</strong>
                          </div>
                          {leave.leave_reason && <div style={{ fontSize: 13, color: '#374151' }}>💬 {leave.leave_reason}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => respondLeave(leave.id, 'approve')} disabled={respondingId === leave.id}
                            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => respondLeave(leave.id, 'reject')} disabled={respondingId === leave.id}
                            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Manual assign */}
          {leaveTab === 'assign' && (
            <section className="card">
              <div className="card-header"><div><h3>Manually Assign Leave</h3><p>Directly mark a leave day for one of your interns.</p></div></div>
              {leaveSuccess && (
                <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✓ {leaveSuccess}</p>
              )}
              <form onSubmit={submitLeave} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Select Intern</label>
                  <select name="trainee_user_id" value={leaveForm.trainee_user_id} onChange={e => setLeaveForm(p => ({ ...p, trainee_user_id: e.target.value }))} required>
                    <option value="">-- Choose intern --</option>
                    {interns.map(t => <option key={t.id} value={t.user_id}>{t.user?.name || `User #${t.user_id}`}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Leave Date</label>
                  <input type="date" name="leave_date" value={leaveForm.leave_date} onChange={e => setLeaveForm(p => ({ ...p, leave_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Remarks (optional)</label>
                  <input type="text" value={leaveForm.remarks} onChange={e => setLeaveForm(p => ({ ...p, remarks: e.target.value }))} placeholder="e.g. Medical leave" />
                </div>
                {leaveError && <p className="error-text">{leaveError}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary" disabled={leaveSaving}>{leaveSaving ? 'Saving…' : 'Assign Leave'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setLeaveForm({ trainee_user_id: '', leave_date: '', remarks: '' })}>Clear</button>
                </div>
              </form>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          INTERN DETAIL MODAL (Timeline + Worklog)
      ══════════════════════════════════════════════════════ */}
      {detailIntern && <InternDetailModal trainee={detailIntern} onClose={() => setDetailIntern(null)} />}

      {/* ══════════════════════════════════════════════════════
          SUBMISSIONS MODAL
      ══════════════════════════════════════════════════════ */}
      {submissionTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 700, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Task Submissions</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}><strong>{submissionTask.title}</strong></p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {(submissionTask.status === 'review' || submissionTask.status === 'in_progress') && (
                  <button onClick={() => rejectTask(submissionTask.id)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✕ Reject & Ask to Resubmit
                  </button>
                )}
                {submissionTask.status === 'rejected' && (
                  <span style={{ padding: '6px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
                    ✕ Rejected — awaiting resubmission
                  </span>
                )}
                {submissionTask.status === 'completed' && (
                  <span style={{ padding: '6px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                    ✓ Completed
                  </span>
                )}
                <button className="btn-secondary btn-small" onClick={closeSubmissions}>Close</button>
              </div>
            </div>
            {submissionLoading && <p style={{ color: '#6b7280' }}>Loading submissions...</p>}
            {!submissionLoading && submissionError && <p className="error-text">{submissionError}</p>}
            {!submissionLoading && !submissionError && taskSubmissions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>No submissions yet for this task.</div>
            )}
            {!submissionLoading && !submissionError && taskSubmissions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {taskSubmissions.map((submission, idx) => (
                  <div key={submission.id} style={{
                    border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f8fafc',
                    borderLeft: idx === taskSubmissions.length - 1 ? '4px solid #00b1b4' : '4px solid #e5e7eb',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>{submission.intern?.name || `Intern #${submission.submitted_by}`}</strong>
                        {idx === taskSubmissions.length - 1 && (
                          <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>Latest</span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDateTime(submission.createdAt)}</span>
                    </div>
                    <p style={{ margin: '0 0 10px', color: '#374151', whiteSpace: 'pre-wrap', fontSize: 14 }}>{submission.work_notes}</p>
                    {submission.file_url
                      ? <a href={submission.file_url} target="_blank" rel="noreferrer" style={{ color: '#0c4a6e', fontWeight: 600, fontSize: 12 }}>📎 Open attachment{submission.file_name ? ` (${submission.file_name})` : ''}</a>
                      : <span style={{ color: '#9ca3af', fontSize: 12 }}>No file attached</span>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TASK FORM MODAL
      ══════════════════════════════════════════════════════ */}
      {showTaskForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            <form onSubmit={submitTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label>Title *</label><input name="title" value={taskForm.title} onChange={handleTaskChange} required placeholder="Task title" /></div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={taskForm.description} onChange={handleTaskChange} rows={3} placeholder="What does this task involve?"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #dde3f0', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Assign To *</label>
                  <select name="assigned_to" value={taskForm.assigned_to} onChange={handleTaskChange} required>
                    <option value="">-- Select intern --</option>
                    {interns.map(t => <option key={t.id} value={t.user_id}>{t.user?.name || `User #${t.user_id}`}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Project (Task Group) *</label>
                  <select name="project_id" value={taskForm.project_id} onChange={handleTaskChange} required>
                    <option value="">-- Select project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <p style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>
                      ⚠ No projects yet. Create one below the task list first.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Start Date</label><input name="start_date" type="date" value={taskForm.start_date} onChange={handleTaskChange} /></div>
                <div className="form-group"><label>Due Date *</label><input name="due_date" type="date" value={taskForm.due_date} onChange={handleTaskChange} required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={taskForm.priority} onChange={handleTaskChange}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                {editingTask && (
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={taskForm.status} onChange={handleTaskChange}>
                      <option value="todo">Todo</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="completed">Completed</option><option value="blocked">Blocked</option>
                    </select>
                  </div>
                )}
              </div>
              {editingTask && (
                <div className="form-group">
                  <label>Completion % ({taskForm.completion_percentage}%)</label>
                  <input name="completion_percentage" type="range" min={0} max={100} step={5} value={taskForm.completion_percentage} onChange={handleTaskChange} style={{ width: '100%' }} />
                </div>
              )}
              <div className="form-group"><label>Tech Stack</label><input name="tech_stack" value={taskForm.tech_stack} onChange={handleTaskChange} placeholder="e.g. React, Node.js, MySQL" /></div>
              {taskError && <p className="error-text">{taskError}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={taskSaving}>{taskSaving ? 'Saving…' : editingTask ? 'Update Task' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          EVALUATION MODAL
      ══════════════════════════════════════════════════════ */}
      {evalIntern && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setEvalIntern(null) }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#003b5c' }}>Evaluate Intern</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>{evalIntern.user?.name}</p>
              </div>
              <button onClick={() => setEvalIntern(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {[
                { key: 'technical_skills', label: ' Technical Skills' },
                { key: 'communication',    label: ' Communication' },
                { key: 'teamwork',         label: ' Teamwork' },
                { key: 'problem_solving',  label: ' Problem Solving' },
                { key: 'punctuality',      label: ' Punctuality' },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontWeight: 600, fontSize: 14 }}>{label}</label>
                    <span style={{ fontWeight: 700, color: '#00b1b4', fontSize: 18 }}>{'⭐'.repeat(evalForm[key])}{'☆'.repeat(5 - evalForm[key])}</span>
                  </div>
                  <input type="range" min={1} max={5} step={1} value={evalForm[key]}
                    onChange={e => setEvalForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#00b1b4' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                    <span>Poor</span><span>Average</span><span>Excellent</span>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Comments (optional)</label>
                <textarea value={evalForm.comments} rows={3}
                  onChange={e => setEvalForm(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Write any specific feedback for this intern..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setEvalIntern(null)}>Cancel</button>
              <button onClick={submitEvaluation} disabled={evalSaving}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#00b1b4', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {evalSaving ? 'Saving…' : ' Save Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
