import React, { useState, useEffect } from 'react'
import { submitDailyReport, getMyDailyReports } from '../api/api'
import toast from 'react-hot-toast'

function DailyReport() {
  const [form, setForm] = useState({ report_date: new Date().toISOString().split('T')[0], work_done: '', blockers: '', plan_tomorrow: '' })
  const [reports, setReports] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const fetchReports = async () => {
    try {
      const res = await getMyDailyReports()
      setReports(res?.data?.data || [])
    } catch { /* silent */ }
  }

  useEffect(() => { fetchReports() }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitDailyReport(form)
      toast.success('Daily report submitted! Your manager has been notified via email.')
      setForm(prev => ({ ...prev, work_done: '', blockers: '', plan_tomorrow: '' }))
      fetchReports()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit report.')
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h2>Daily Report</h2>
      
      {/* Info Banner */}
      <div style={{ 
        background: '#dbeafe', 
        border: '1px solid #93c5fd', 
        borderRadius: 8, 
        padding: 12, 
        marginBottom: 24,
        color: '#1e40af',
        fontSize: 13,
      }}>
        <strong>📧 Note:</strong> When you submit your daily report, your manager will receive an email notification and you will receive a system notification when they acknowledge it.
      </div>

      <form onSubmit={handleSubmit} style={{ background: '#f9fafb', borderRadius: 10, padding: 24, marginBottom: 32, border: '1px solid #e5e7eb' }}>
        <div className="form-group">
          <label>Date</label>
          <input type="date" name="report_date" value={form.report_date} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label>What did you work on today? *</label>
          <textarea name="work_done" value={form.work_done} onChange={handleChange} required rows={4} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label>Blockers / Issues (if any)</label>
          <textarea name="blockers" value={form.blockers} onChange={handleChange} rows={2} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label>Plan for Tomorrow</label>
          <textarea name="plan_tomorrow" value={form.plan_tomorrow} onChange={handleChange} rows={2} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      <h3>Past Reports</h3>
      {reports.length === 0 ? <p style={{ color: '#6b7280' }}>No reports submitted yet.</p> : reports.map(r => (
        <div key={r.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{r.report_date}</strong>
            <span style={{ fontSize: 12, color: r.status === 'acknowledged' ? 'green' : '#f59e0b', fontWeight: 600 }}>{r.status === 'acknowledged' ? '✓ Acknowledged' : 'Pending'}</span>
          </div>
          <p style={{ marginTop: 8, color: '#374151' }}><strong>Work:</strong> {r.work_done}</p>
          {r.blockers && <p style={{ color: '#ef4444' }}><strong>Blockers:</strong> {r.blockers}</p>}
          {r.plan_tomorrow && <p style={{ color: '#2563eb' }}><strong>Tomorrow:</strong> {r.plan_tomorrow}</p>}
        </div>
      ))}
    </div>
  )
}

export default DailyReport