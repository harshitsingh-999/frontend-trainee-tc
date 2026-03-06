import React, { useState, useEffect } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'

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
}

function Badge({ value, map }) {
  const s = map[value] || { bg: '#f1f5f9', text: '#475569' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      border: `1px solid ${s.border || s.bg}`,
      borderRadius: 6, padding: '2px 10px',
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {value?.replace('_', ' ')}
    </span>
  )
}

const EMPTY_TASK = {
  title: '', description: '', assigned_to: '', project_id: '',
  start_date: '', due_date: '', priority: 'medium', tech_stack: '',
  status: 'todo', completion_percentage: 0,
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

export default function Manager() {
  const { user } = useAuth()
  const [interns,      setInterns]      = useState([])
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [tab,          setTab]          = useState('interns')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask,  setEditingTask]  = useState(null)
  const [taskForm,     setTaskForm]     = useState(EMPTY_TASK)
  const [taskSaving,   setTaskSaving]   = useState(false)
  const [taskError,    setTaskError]    = useState('')
  const [leaveForm,    setLeaveForm]    = useState({ trainee_user_id: '', leave_date: '', remarks: '' })
  const [leaveSaving,  setLeaveSaving]  = useState(false)
  const [leaveError,   setLeaveError]   = useState('')
  const [leaveSuccess, setLeaveSuccess] = useState('')
  const [submissionTask,    setSubmissionTask]    = useState(null)
  const [taskSubmissions,   setTaskSubmissions]   = useState([])
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const [submissionError,   setSubmissionError]   = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
  // fetch interns and tasks separately so one failure doesn't block the other
  setLoading(true)
  setError('')

  const internsResult = await api.get('/manager/interns').catch(() => null)
  const tasksResult   = await api.get('/manager/tasks').catch(() => null)

  if (internsResult) setInterns(internsResult.data.data || [])
  if (tasksResult)   setTasks(tasksResult.data.data || [])

  setLoading(false)
}

//   const fetchAll = async () => {
//     setLoading(true)
//     setError('')
//     try {
//       const [ir, tr] = await Promise.all([
//         api.get('/manager/interns'),
//         api.get('/manager/tasks'),
//       ])
//       setInterns(ir.data.data || [])
//       setTasks(tr.data.data || [])
//     } catch (e) {
//       setError(e.response?.data?.message || 'Failed to load data')
//     } finally {
//       setLoading(false)
//     }
//   }

  const openCreate = () => {
    setEditingTask(null)
    setTaskForm(EMPTY_TASK)
    setTaskError('')
    setShowTaskForm(true)
  }

  const openEdit = (task) => {
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
    setTaskSaving(true)
    setTaskError('')
    try {
      if (editingTask) {
        await api.put(`/manager/tasks/${editingTask.id}`, taskForm)
      } else {
        await api.post('/manager/tasks', taskForm)
      }
      setShowTaskForm(false)
      fetchAll()
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task')
    } finally {
      setTaskSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/manager/tasks/${id}`)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete')
    }
  }

  const openSubmissions = async (task) => {
    setSubmissionTask(task)
    setTaskSubmissions([])
    setSubmissionError('')
    setSubmissionLoading(true)

    try {
      const res = await api.get(`/manager/tasks/${task.id}/submissions`)
      setTaskSubmissions(res.data?.data || [])
    } catch (err) {
      setSubmissionError(err.response?.data?.message || 'Failed to load submissions')
    } finally {
      setSubmissionLoading(false)
    }
  }

  const closeSubmissions = () => {
    setSubmissionTask(null)
    setTaskSubmissions([])
    setSubmissionError('')
    setSubmissionLoading(false)
  }

  const handleLeaveChange = (e) => {
    const { name, value } = e.target
    setLeaveForm(prev => ({ ...prev, [name]: value }))
  }

  const submitLeave = async (e) => {
    e.preventDefault()
    setLeaveSaving(true)
    setLeaveError('')
    setLeaveSuccess('')
    try {
      await api.post('/manager/leaves', leaveForm)
      setLeaveSuccess('Leave assigned successfully!')
      setLeaveForm({ trainee_user_id: '', leave_date: '', remarks: '' })
    } catch (err) {
      setLeaveError(err.response?.data?.message || 'Failed to assign leave')
    } finally {
      setLeaveSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading manager dashboard…</div>

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Manager Dashboard</h2>
          <p>Manage your interns, assign tasks, and approve leaves.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary btn-small" onClick={openCreate}>+ New Task</button>
          <button className="btn-secondary btn-small" onClick={() => setTab('leaves')}>+ Assign Leave</button>
        </div>
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-label">My Interns</div><div className="stat-value">{interns.length}</div></div>
        <div className="stat-card"><div className="stat-label">Total Tasks</div><div className="stat-value">{tasks.length}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value">{tasks.filter(t => t.status === 'in_progress').length}</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{tasks.filter(t => t.status === 'completed').length}</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {['tasks', 'interns', 'leaves'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', border: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid #00b1b4' : '2px solid transparent',
            background: 'none', fontWeight: tab === t ? 700 : 400,
            color: tab === t ? '#00b1b4' : '#6b7280',
            textTransform: 'capitalize', marginBottom: -2, fontSize: 14,
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <section className="card">
          <div className="card-header"><div><h3>Tasks Assigned by You</h3><p>Create, edit or delete tasks for your interns.</p></div></div>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              No tasks yet. Click <strong>+ New Task</strong> to create one.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th><th>Assigned To</th><th>Due Date</th>
                    <th>Priority</th><th>Status</th><th>Progress</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        {task.tech_stack && <div style={{ fontSize: 11, color: '#9ca3af' }}>{task.tech_stack}</div>}
                      </td>
                      <td>{task.assignee?.name || `User #${task.assigned_to}`}</td>
                      <td>{task.due_date}</td>
                      <td><Badge value={task.priority} map={PRIORITY_COLORS} /></td>
                      <td><Badge value={task.status}   map={STATUS_COLORS}   /></td>
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
          )}
        </section>
      )}

      {/* INTERNS TAB */}
      {tab === 'interns' && (
        <section className="card">
          <div className="card-header"><div><h3>My Interns</h3><p>All interns currently assigned under your supervision.</p></div></div>
          {interns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>No interns assigned to you yet.</div>
          ) : (
            <ul className="list">
              {interns.map(trainee => (
                <li key={trainee.id} className="list-item">
                  <div>
                    <div className="list-title">{trainee.user?.name || 'Unknown'}</div>
                    <div className="list-subtitle">
                      {trainee.user?.email} · {trainee.course || 'N/A'} · Ends: {trainee.expected_end_date || 'N/A'}
                    </div>
                  </div>
                  <span className={`pill ${trainee.current_status === 'active' ? 'pill-green' : 'pill-soft'}`} style={{ textTransform: 'capitalize' }}>
                    {trainee.current_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* LEAVES TAB */}
      {tab === 'leaves' && (
        <section className="card">
          <div className="card-header"><div><h3>Assign Leave</h3><p>Approve a leave day for one of your interns.</p></div></div>
          {leaveSuccess && (
            <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
              ✓ {leaveSuccess}
            </p>
          )}
          <form onSubmit={submitLeave} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Select Intern</label>
              <select name="trainee_user_id" value={leaveForm.trainee_user_id} onChange={handleLeaveChange} required>
                <option value="">-- Choose intern --</option>
                {interns.map(t => (
                  <option key={t.id} value={t.user_id}>{t.user?.name || `User #${t.user_id}`}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Leave Date</label>
              <input type="date" name="leave_date" value={leaveForm.leave_date} onChange={handleLeaveChange} required />
            </div>
            <div className="form-group">
              <label>Remarks (optional)</label>
              <input type="text" name="remarks" value={leaveForm.remarks} onChange={handleLeaveChange} placeholder="e.g. Medical leave" />
            </div>
            {leaveError && <p className="error-text">{leaveError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={leaveSaving}>{leaveSaving ? 'Saving…' : 'Assign Leave'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setLeaveForm({ trainee_user_id: '', leave_date: '', remarks: '' }); setLeaveSuccess('') }}>Clear</button>
            </div>
          </form>
        </section>
      )}

      {/* SUBMISSIONS MODAL */}
      {submissionTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 700, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Task Submissions</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}><strong>{submissionTask.title}</strong></p>
              </div>
              <button className="btn-secondary btn-small" onClick={closeSubmissions}>Close</button>
            </div>

            {submissionLoading && (
              <p style={{ color: '#6b7280' }}>Loading submissions...</p>
            )}

            {!submissionLoading && submissionError && (
              <p className="error-text">{submissionError}</p>
            )}

            {!submissionLoading && !submissionError && taskSubmissions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>
                No submissions yet for this task.
              </div>
            )}

            {!submissionLoading && !submissionError && taskSubmissions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {taskSubmissions.map((submission) => (
                  <div key={submission.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong>{submission.intern?.name || `Intern #${submission.submitted_by}`}</strong>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDateTime(submission.createdAt)}</span>
                    </div>
                    <p style={{ margin: '0 0 8px', color: '#374151', whiteSpace: 'pre-wrap' }}>{submission.work_notes}</p>
                    {submission.file_url ? (
                      <a href={submission.file_url} target="_blank" rel="noreferrer" style={{ color: '#0c4a6e', fontWeight: 600, fontSize: 12 }}>
                        Open attachment{submission.file_name ? ` (${submission.file_name})` : ''}
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>No file attached</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            <form onSubmit={submitTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={taskForm.title} onChange={handleTaskChange} required placeholder="Task title" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={taskForm.description} onChange={handleTaskChange} rows={3}
                  placeholder="What does this task involve?"
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
                  <label>Project ID *</label>
                  <input name="project_id" type="number" value={taskForm.project_id} onChange={handleTaskChange} required placeholder="e.g. 1" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Start Date</label>
                  <input name="start_date" type="date" value={taskForm.start_date} onChange={handleTaskChange} />
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input name="due_date" type="date" value={taskForm.due_date} onChange={handleTaskChange} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={taskForm.priority} onChange={handleTaskChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                {editingTask && (
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={taskForm.status} onChange={handleTaskChange}>
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                )}
              </div>
              {editingTask && (
                <div className="form-group">
                  <label>Completion % ({taskForm.completion_percentage}%)</label>
                  <input name="completion_percentage" type="range" min={0} max={100} step={5}
                    value={taskForm.completion_percentage} onChange={handleTaskChange} style={{ width: '100%' }} />
                </div>
              )}
              <div className="form-group">
                <label>Tech Stack</label>
                <input name="tech_stack" value={taskForm.tech_stack} onChange={handleTaskChange} placeholder="e.g. React, Node.js, MySQL" />
              </div>
              {taskError && <p className="error-text">{taskError}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={taskSaving}>{taskSaving ? 'Saving…' : editingTask ? 'Update Task' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
