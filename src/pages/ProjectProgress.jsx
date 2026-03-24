import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/login_api.js'

const STATUS_COLORS = {
  planning:  { bg: '#fffbeb', color: '#d97706' },
  active:    { bg: '#eff6ff', color: '#2563eb' },
  completed: { bg: '#f0fdf4', color: '#16a34a' },
  on_hold:   { bg: '#f1f5f9', color: '#475569' },
}

const PRIORITY_COLORS = {
  low:      { bg: '#f0fdf4', color: '#16a34a' },
  medium:   { bg: '#fffbeb', color: '#d97706' },
  high:     { bg: '#fff7ed', color: '#ea580c' },
  critical: { bg: '#fef2f2', color: '#dc2626' },
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Create Project Modal ──────────────────────────────────
function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    project_name: '', description: '', start_date: '', end_date: '',
    status: 'active', priority: 'medium',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/manager/projects', form)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally { setSaving(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%',
        maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#003b5c' }}>Create New Project</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))}
              required placeholder="e.g. Customer Portal" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Brief description of this project"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #dde3f0',
                fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Intern Progress Card ──────────────────────────────────
function InternProgressCard({ internData }) {
  const pct = internData.avgCompletion || 0
  const completionPct = internData.totalTasks > 0
    ? Math.round((internData.completedTasks / internData.totalTasks) * 100)
    : 0
  const progressColor = completionPct >= 80 ? '#16a34a' : completionPct >= 40 ? '#00b1b4' : '#d97706'

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px',
      background: '#fff', transition: 'box-shadow 0.2s',
    }}>
      {/* Intern info + stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #003b5c, #00b1b4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0,
          }}>
            {(internData.user?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#003b5c', fontSize: 15 }}>
              {internData.user?.name || `User #${internData.user?.id}`}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{internData.user?.email}</div>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Tasks',       value: internData.totalTasks,      color: '#003b5c' },
            { label: 'Done',        value: internData.completedTasks,  color: '#16a34a' },
            { label: 'In Progress', value: internData.inProgressTasks, color: '#2563eb' },
            { label: 'Review',      value: internData.reviewTasks,     color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 60,
            }}>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Overall Progress</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: progressColor }}>{completionPct}%</span>
        </div>
        <div style={{ height: 10, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${completionPct}%`,
            background: completionPct >= 80
              ? 'linear-gradient(90deg,#16a34a,#22c55e)'
              : completionPct >= 40
              ? 'linear-gradient(90deg,#003b5c,#00b1b4)'
              : 'linear-gradient(90deg,#d97706,#fbbf24)',
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          {internData.completedTasks} of {internData.totalTasks} task{internData.totalTasks !== 1 ? 's' : ''} completed
          {internData.totalTasks > 0 && ` · avg completion ${pct}%`}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function ProjectProgress() {
  const [projects,        setProjects]        = useState([])
  const [projectProgress, setProjectProgress] = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [showCreate,      setShowCreate]      = useState(false)
  const [activeFilter,    setActiveFilter]    = useState('all') // 'all' | project id

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    const [projectsRes, progressRes] = await Promise.all([
      api.get('/manager/projects').catch(() => null),
      api.get('/manager/project-progress').catch(() => null),
    ])
    if (projectsRes)  setProjects(projectsRes.data.data || [])
    if (progressRes)  setProjectProgress(progressRes.data.data || [])
    else setError('Failed to load project progress.')
    setLoading(false)
  }, [])

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) return
    try {
      await api.delete(`/manager/projects/${projectId}`)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project')
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  // Summary stats
  const totalInterns  = new Set(projectProgress.flatMap(p => p.interns.map(i => i.user?.id))).size
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const overallAvg = projectProgress.length
    ? Math.round(
        projectProgress.flatMap(p => p.interns).reduce((sum, i) => sum + (i.avgCompletion || 0), 0) /
        Math.max(1, projectProgress.flatMap(p => p.interns).length)
      )
    : 0

  const filtered = activeFilter === 'all'
    ? projectProgress
    : projectProgress.filter(p => String(p.project.id) === String(activeFilter))

  if (loading) return (
    <div style={{ padding: 40, color: '#6b7280', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
      Loading project progress…
    </div>
  )

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h2>Project Progress</h2>
          <p>Track all interns' task progress across your projects.</p>
        </div>
        <button className="btn-primary btn-small" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      {/* ── Summary stats ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Projects',   value: totalProjects,  color: '#003b5c' },
          { label: 'Active Projects',  value: activeProjects, color: '#2563eb' },
          { label: 'Interns Tracked',  value: totalInterns,   color: '#7c3aed' },
          { label: 'Avg Completion',   value: `${overallAvg}%`, color: overallAvg >= 70 ? '#16a34a' : '#d97706' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Project filter pills ── */}
      {projects.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: activeFilter === 'all' ? 700 : 500, fontSize: 13,
              background: activeFilter === 'all' ? '#003b5c' : '#f1f5f9',
              color: activeFilter === 'all' ? '#fff' : '#475569',
              transition: 'all 0.15s',
            }}>
            All Projects
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveFilter(String(p.id))}
              style={{
                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: String(activeFilter) === String(p.id) ? 700 : 500, fontSize: 13,
                background: String(activeFilter) === String(p.id) ? '#00b1b4' : '#f1f5f9',
                color: String(activeFilter) === String(p.id) ? '#fff' : '#475569',
                transition: 'all 0.15s',
              }}>
              {p.project_name}
            </button>
          ))}
        </div>
      )}

      {/* ── Project Table ── */}
      {filtered.length === 0 ? (
        <section className="card">
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No projects yet</p>
            <p style={{ fontSize: 13 }}>Create a project and assign tasks to your interns to start tracking progress.</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              + Create First Project
            </button>
          </div>
        </section>
      ) : (
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignments</th>
                  <th>Total Progress</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ project, interns: internList }) => {
                  const isExpanded = activeFilter === String(project.id) || (activeFilter === 'all' && filtered.length === 1)
                  const sc = STATUS_COLORS[project.status] || STATUS_COLORS.planning
                  const pc = PRIORITY_COLORS[project.priority] || PRIORITY_COLORS.medium
                  const totalTasks     = internList.reduce((s, i) => s + i.totalTasks, 0)
                  const completedTasks = internList.reduce((s, i) => s + i.completedTasks, 0)
                  const projectPct     = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                  return (
                    <React.Fragment key={project.id}>
                      <tr
                        onClick={() => setActiveFilter(activeFilter === String(project.id) ? 'all' : String(project.id))}
                        style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'transparent' }}
                      >
                        <td style={{ color: '#9ca3af', fontSize: 12 }}>{isExpanded ? '▼' : '▶'}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#003b5c' }}>{project.project_name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(project.start_date)}</div>
                        </td>
                        <td>
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>
                            {project.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: pc.bg, color: pc.color, textTransform: 'capitalize' }}>
                            {project.priority}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 700, color: '#003b5c' }}>{internList.length}</span>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>Interns</span>
                          </div>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${projectPct}%`, background: projectPct >= 80 ? '#16a34a' : '#00b1b4' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#003b5c', minWidth: 35 }}>{projectPct}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn-small btn-secondary" style={{ fontSize: 11 }}>Details</button>
                            <button
                              className="btn-small"
                              style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}
                              onClick={(e) => {
                                e.stopPropagation(); // don't toggle expansion
                                handleDeleteProject(project.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: '0 0 20px 48px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Intern Assignments & Progress</div>
                              {internList.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No interns assigned to this project.</div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16, paddingRight: 20 }}>
                                  {internList.map(internData => (
                                    <InternProgressCard key={internData.user?.id} internData={internData} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Create Project Modal ── */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}
