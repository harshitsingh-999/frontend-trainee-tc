import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/login_api.js'

// const [evaluations, setEvaluations] = useState([]);

const PRIORITY_COLORS = {
  low: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  high: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
}

const STATUS_COLORS = {
  todo: { bg: '#f1f5f9', text: '#475569' },
  in_progress: { bg: '#eff6ff', text: '#2563eb' },
  review: { bg: '#faf5ff', text: '#7c3aed' },
  completed: { bg: '#f0fdf4', text: '#16a34a' },
  blocked: { bg: '#fef2f2', text: '#dc2626' },
  rejected: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  hold: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
}

function Badge({ value, map }) {
  const s = map[value] || { bg: '#f1f5f9', text: '#475569' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      maxWidth: 'fit-content',
      border: `1px solid ${s.border || s.bg}`,
      borderRadius: 6, padding: '2px 10px',
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {value?.replace('_', ' ')}
    </span>
  )
}

// ── FILE → BASE64 helper ──────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result) // includes data:...;base64, prefix
  reader.onerror = reject
  reader.readAsDataURL(file)
})

// ── SUBMIT MODAL ──────────────────────────────────────────
function SubmitModal({ task, onClose, onSubmit }) {
  const [workNotes, setWorkNotes] = useState('')
  const [status, setStatus] = useState('review')
  const [completion, setCompletion] = useState(task.completion_percentage || 0)

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    if (newStatus === 'todo') setCompletion(0)
    else if (newStatus === 'in_progress') setCompletion(Math.max(20, completion))
    else if (newStatus === 'review') setCompletion(Math.max(50, completion))
    else if (newStatus === 'completed') setCompletion(100)
  }
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  //   const [evaluations, setEvaluations] = useState([])
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.style.borderColor = '#d1d5db'
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async () => {
    if (!workNotes.trim()) {
      setError('Please add submission notes before submitting.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Build payload — matches your backend exactly
      const payload = {
        work_notes: workNotes.trim(),
        status,
        completion_percentage: Number(completion),
      }

      // If file selected, convert to base64 and attach
      if (file) {
        const base64 = await fileToBase64(file)
        payload.file = {
          name: file.name,
          type: file.type,
          data: base64,
        }
      }

      await api.post(`/intern/tasks/${task.id}/submit`, payload)
      onSubmit(`Task "${task.title}" submitted successfully!`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#003b5c' }}>Submit Task</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{task.title}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22,
            cursor: 'pointer', color: '#9ca3af',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* Task info strip */}
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
            marginBottom: 20, border: '1px solid #e2e8f0',
            display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>PRIORITY</div>
              <Badge value={task.priority} map={PRIORITY_COLORS} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>DUE DATE</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{task.due_date}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>ASSIGNED BY</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{task.assigner?.name || '—'}</div>
            </div>
          </div>

          {/* Work notes — the notepad */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: 'block', fontWeight: 600, fontSize: 14,
              color: '#374151', marginBottom: 8
            }}>
              Work Notes <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              placeholder="Describe what you completed, any challenges faced, links to your work (GitHub, Figma, docs), or anything else your manager should know..."
              style={{
                width: '100%', minHeight: 150,
                padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontFamily: 'inherit',
                fontSize: 14, lineHeight: 1.6, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', color: '#374151',
              }}
              onFocus={e => e.target.style.borderColor = '#00b1b4'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Status + Completion */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
              <label>Submission Status</label>
              <select value={status} onChange={e => handleStatusChange(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Done — Send for Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="hold">Hold</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 200 }}>
              <label>Completion — {completion}%</label>
              <input
                type="range" min={0} max={100} step={5}
                value={completion}
                onChange={e => setCompletion(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* File upload */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: 'block', fontWeight: 600, fontSize: 14,
              color: '#374151', marginBottom: 8
            }}>
              📎 Attach File <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional, max 10MB)</span>
            </label>

            <div
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#00b1b4' }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db' }}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #d1d5db', borderRadius: 10,
                padding: '20px', textAlign: 'center', cursor: 'pointer',
                background: '#fafafa', transition: 'border-color 0.2s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>☁️</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Click to upload or drag & drop</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PDF, images, zip, docs — any format</div>
            </div>
            <input ref={fileRef} type="file" onChange={handleFile} style={{ display: 'none' }} />

            {file && (
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', background: '#f0fdf4',
                border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button onClick={() => setFile(null)} style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#dc2626', fontSize: 16,
                }}>✕</button>
              </div>
            )}
          </div>

          {/* Warning */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e',
          }}>
            Submitting will update the task status and notify your manager.
          </div>

          {/* Error */}
          {error && (
            <p style={{
              color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
              borderRadius: 8, marginTop: 12, fontWeight: 600
            }}>✗ {error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#00b1b4', color: '#fff', fontWeight: 700,
              fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting…' : ' Submit Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function InternTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [updateForm, setUpdateForm] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [submitTask, setSubmitTask] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [trainee, setTrainee] = useState(null)
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tasks')

  useEffect(() => {
    fetchTasks()
    api.get('/intern/evaluations').then(r => setEvaluations(r.data.data || [])).catch(() => { })
    api.get('/intern/profile').then(r => setTrainee(r.data.data?.trainee || null)).catch(() => { })
  }, [])
  //   api.get('/intern/evaluations').then(r => setEvaluations(r.data.data || [])).catch(() => {})


  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/intern/tasks')
      setTasks(res.data.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const openUpdate = (task) => {
    setUpdating(task.id)
    setUpdateForm({ status: task.status, completion_percentage: task.completion_percentage || 0 })
    setSuccessMsg('')
  }

  const handleUpdateChange = (e) => {
    const { name, value } = e.target
    setUpdateForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'status') {
        if (value === 'todo') next.completion_percentage = 0
        else if (value === 'in_progress') next.completion_percentage = Math.max(20, prev.completion_percentage)
        else if (value === 'review') next.completion_percentage = Math.max(50, prev.completion_percentage)
        else if (value === 'completed') next.completion_percentage = 100
      }
      return next
    })
  }

  // Quick progress update — no notes, no file, just status + %
  const saveUpdate = async (taskId) => {
    try {
      // Use submit endpoint with minimal payload
      await api.post(`/intern/tasks/${taskId}/submit`, {
        work_notes: 'Progress update',
        status: updateForm.status,
        completion_percentage: Number(updateForm.completion_percentage),
      })
      setSuccessMsg('Progress updated!')
      setUpdating(null)
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const overdue = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading your tasks…</div>

  // ── Timeline helpers ──
  const formatDateShort = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const timelineData = () => {
    if (!trainee?.enrollment_date) return null
    const start = new Date(trainee.enrollment_date)
    const end = trainee.expected_end_date ? new Date(trainee.expected_end_date) : null
    const now = new Date()
    let pct = 0, daysLeft = null, totalDays = null
    if (end) {
      totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
      const elapsed = Math.round((now - start) / (1000 * 60 * 60 * 24))
      pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)))
      daysLeft = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)))
    }
    const milestones = end ? [
      { label: 'Start', date: start, pct: 0 },
      { label: '25%', date: new Date(start.getTime() + (end - start) * 0.25), pct: 25 },
      { label: 'Mid', date: new Date(start.getTime() + (end - start) * 0.5), pct: 50 },
      { label: '75%', date: new Date(start.getTime() + (end - start) * 0.75), pct: 75 },
      { label: 'End', date: end, pct: 100 },
    ] : []
    return { start, end, pct, daysLeft, totalDays, milestones }
  }
  const tl = timelineData()

  return (
    <div className="dashboard">

      {/* Submit modal */}
      {submitTask && (
        <SubmitModal
          task={submitTask}
          onClose={() => setSubmitTask(null)}
          onSubmit={(msg) => { setSuccessMsg(msg); fetchTasks() }}
        />
      )}

      <div className="dashboard-header">
        <div>
          <h2>My Tasks</h2>
          <p>Tasks assigned to you by your manager.</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'tasks', label: ` My Tasks (${tasks.length})` },
          { key: 'timeline', label: ' Internship Timeline' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 20px', border: 'none', cursor: 'pointer', background: 'none',
            fontWeight: activeTab === t.key ? 700 : 400,
            color: activeTab === t.key ? '#00b1b4' : '#6b7280', fontSize: 14,
            borderBottom: activeTab === t.key ? '2px solid #00b1b4' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p style={{
          color: '#dc2626', background: '#fef2f2', padding: '10px 14px',
          borderRadius: 8, marginBottom: 16, fontWeight: 600
        }}>✗ {error}</p>
      )}
      {successMsg && (
        <p style={{
          color: '#16a34a', background: '#f0fdf4', padding: '10px 14px',
          borderRadius: 8, marginBottom: 16, fontWeight: 600
        }}>✓ {successMsg}</p>
      )}

      {/* ════════════════════════════════
          TASKS TAB
      ════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <>
          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{total}</div></div>
            <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value">{inProgress}</div></div>
            <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{completed}</div></div>
            <div className="stat-card">
              <div className="stat-label" style={{ color: overdue > 0 ? '#dc2626' : undefined }}>Overdue</div>
              <div className="stat-value" style={{ color: overdue > 0 ? '#dc2626' : undefined }}>{overdue}</div>
            </div>
          </div>

          {tasks.length === 0 ? (
            <section className="card">
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p>No tasks assigned yet. Check back later.</p>
              </div>
            </section>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tasks.map(task => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed'
                const isUpdating = updating === task.id
                const isRejected = task.status === 'rejected'
                const canSubmit = task.status !== 'completed' && task.status !== 'review'

                return (
                  <section key={task.id} className="card" style={{
                    borderLeft: `4px solid ${task.status === 'completed' ? '#16a34a' :
                      task.status === 'review' ? '#7c3aed' :
                        task.status === 'rejected' ? '#dc2626' :
                          isOverdue ? '#dc2626' : '#00b1b4'
                      }`,
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', flexWrap: 'wrap', gap: 12
                    }}>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          marginBottom: 6, flexWrap: 'wrap'
                        }}>
                          <h3 style={{ margin: 0, fontSize: 16 }}>{task.title}</h3>
                          <Badge value={task.priority} map={PRIORITY_COLORS} />
                          <Badge value={task.status} map={STATUS_COLORS} />
                          {isOverdue && (
                            <span style={{
                              background: '#fef2f2', color: '#dc2626',
                              border: '1px solid #fecaca', borderRadius: 6,
                              padding: '2px 10px', fontSize: 12, fontWeight: 600
                            }}>
                              ⚠ Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p style={{ margin: '0 0 10px', color: '#6b7280', fontSize: 14 }}>
                            {task.description}
                          </p>
                        )}

                        <div style={{
                          display: 'flex', gap: 20, fontSize: 13,
                          color: '#6b7280', flexWrap: 'wrap'
                        }}>
                          <span> Due: <strong style={{ color: isOverdue ? '#dc2626' : '#374151' }}>
                            {task.due_date}
                          </strong></span>
                          {task.tech_stack && <span>🛠 {task.tech_stack}</span>}
                          {task.assigner && <span> By: <strong>{task.assigner.name}</strong></span>}
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            flex: 1, height: 8, background: '#e5e7eb',
                            borderRadius: 99, overflow: 'hidden', maxWidth: 300
                          }}>
                            <div style={{
                              height: '100%', borderRadius: 99, background: '#00b1b4',
                              width: `${task.completion_percentage || 0}%`,
                              transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {task.completion_percentage || 0}%
                          </span>
                        </div>

                        {/* Rejected banner */}
                        {isRejected && (
                          <div style={{
                            marginTop: 12, padding: '10px 14px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, fontSize: 13, color: '#dc2626', fontWeight: 600,
                          }}>
                            ✕ Your manager rejected this submission — please review the feedback and resubmit.
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {!isUpdating && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {canSubmit && (
                            <button
                              onClick={() => setSubmitTask(task)}
                              style={{
                                padding: '8px 16px', borderRadius: 8, border: 'none',
                                background: isRejected ? '#dc2626' : '#003b5c',
                                color: '#fff',
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                              }}
                            >
                              {isRejected ? '🔄 Resubmit' : 'Submit'}
                            </button>
                          )}
                          {task.status !== 'completed' && (
                            <button onClick={() => openUpdate(task)}
                              className="btn-secondary btn-small">
                              Update Progress
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick update form */}
                    {isUpdating && (
                      <div style={{
                        marginTop: 16, padding: 16, background: '#f8fafc',
                        borderRadius: 10, border: '1px solid #e2e8f0',
                      }}>
                        <h4 style={{ margin: '0 0 14px', fontSize: 14 }}>Quick Progress Update</h4>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>Status</label>
                            <select name="status" value={updateForm.status} onChange={handleUpdateChange}>
                              <option value="todo">Todo</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                              <option value="hold">Hold</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0, minWidth: 200 }}>
                            <label>Completion — {updateForm.completion_percentage}%</label>
                            <input type="range" name="completion_percentage"
                              min={0} max={100} step={5}
                              value={updateForm.completion_percentage}
                              onChange={handleUpdateChange}
                              style={{ width: '100%' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-primary btn-small"
                              onClick={() => saveUpdate(task.id)}>Save</button>
                            <button className="btn-secondary btn-small"
                              onClick={() => setUpdating(null)}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}

          {/* Evaluations */}
          {evaluations.length > 0 && (
            <section className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <div><h3>My Evaluations</h3><p>Performance scores from your manager.</p></div>
              </div>
              {evaluations.map(ev => (
                <div key={ev.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>{ev.evaluation_date}</span>
                    <span style={{ fontWeight: 700, color: '#00b1b4', fontSize: 18 }}>Overall: {ev.overall_score} / 5</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'Technical', value: ev.technical_skills },
                      { label: 'Communication', value: ev.communication },
                      { label: 'Teamwork', value: ev.teamwork },
                      { label: 'Problem Solving', value: ev.problem_solving },
                      { label: 'Punctuality', value: ev.punctuality },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 18 }}>{'⭐'.repeat(value)}{'☆'.repeat(5 - value)}</div>
                      </div>
                    ))}
                  </div>
                  {ev.comments && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, color: '#374151' }}>
                      💬 {ev.comments}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* ════════════════════════════════
          TIMELINE TAB
      ════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <section className="card">
          <div className="card-header">
            <div><h3>My Internship Timeline</h3><p>Track your internship progress from start to finish.</p></div>
          </div>

          {!trainee ? (
            <div style={{ padding: 20, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', color: '#92400e', fontSize: 14 }}>
              ⚠ No trainee profile found. Please ask your manager to set up your internship dates.
            </div>
          ) : !tl ? (
            <div style={{ padding: 20, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', color: '#92400e', fontSize: 14 }}>
              ⚠ Enrollment date not set. Please update your profile or ask your manager.
            </div>
          ) : (
            <>
              {/* Info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'College', value: trainee.college_name || '—' },
                  { label: 'Course', value: trainee.course || '—' },
                  { label: 'Batch Year', value: trainee.batch_year || '—' },
                  { label: 'GPA', value: trainee.gpa ? `${trainee.gpa} / 10` : '—' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontWeight: 600, color: '#003b5c', fontSize: 14 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Timeline bar */}
              {tl.end ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Internship Progress</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: tl.daysLeft === 0 ? '#16a34a' : tl.daysLeft <= 14 ? '#dc2626' : '#00b1b4'
                    }}>
                      {tl.daysLeft === 0 ? '✓ Completed!' : tl.daysLeft <= 14 ? `⚠ ${tl.daysLeft} days left` : `${tl.daysLeft} days remaining`}
                    </span>
                  </div>

                  {/* Progress bar + milestones */}
                  <div style={{ position: 'relative', marginBottom: 40 }}>
                    <div style={{ height: 12, background: '#e5e7eb', borderRadius: 99 }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: tl.daysLeft <= 14 ? '#ef4444' : 'linear-gradient(90deg, #00b1b4, #003b5c)',
                        width: `${tl.pct}%`, transition: 'width 0.5s ease',
                      }} />
                    </div>
                    {tl.milestones.map(m => {
                      const isPast = tl.pct >= m.pct
                      return (
                        <div key={m.label} style={{ position: 'absolute', top: -4, left: `${m.pct}%`, transform: 'translateX(-50%)' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: isPast ? '#003b5c' : '#fff',
                            border: `3px solid ${isPast ? '#00b1b4' : '#d1d5db'}`,
                          }} />
                          <div style={{
                            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap', fontSize: 11, color: '#6b7280', textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 700, color: isPast ? '#003b5c' : '#9ca3af' }}>{m.label}</div>
                            <div>{m.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                    <span>Started: <strong style={{ color: '#003b5c' }}>{formatDateShort(trainee.enrollment_date)}</strong></span>
                    <span style={{ fontWeight: 800, fontSize: 22, color: '#003b5c' }}>{tl.pct}%</span>
                    <span>Ends: <strong style={{ color: '#003b5c' }}>{formatDateShort(trainee.expected_end_date)}</strong></span>
                  </div>

                  {tl.totalDays && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
                      Total internship duration: {tl.totalDays} days
                    </div>
                  )}

                  {/* Task completion summary within timeline */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 12 }}>Task Progress</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total', value: total, color: '#003b5c' },
                        { label: 'Completed', value: completed, color: '#16a34a' },
                        { label: 'In Progress', value: inProgress, color: '#2563eb' },
                        { label: 'Overdue', value: overdue, color: overdue > 0 ? '#dc2626' : '#9ca3af' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 18px', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: 80 }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
                  ⚠ Expected end date not set. Contact your manager to complete your internship profile.
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}


