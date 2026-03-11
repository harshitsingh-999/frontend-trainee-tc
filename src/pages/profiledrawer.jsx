import React, { useState, useEffect, useRef } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'

const ROLE_LABELS = { 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern' }

// ── STATUS BADGE ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:            { bg: '#f0fdf4', text: '#16a34a', label: 'Active' },
    pending_approval:  { bg: '#fffbeb', text: '#d97706', label: 'Pending Approval' },
    completed:         { bg: '#eff6ff', text: '#2563eb', label: 'Completed' },
    on_leave:          { bg: '#faf5ff', text: '#7c3aed', label: 'On Leave' },
    terminated:        { bg: '#fef2f2', text: '#dc2626', label: 'Terminated' },
  }
  const s = map[status] || { bg: '#f1f5f9', text: '#475569', label: status || 'Unknown' }
  return (
    <span style={{
      background: s.bg, color: s.text, fontSize: 12, fontWeight: 600,
      borderRadius: 6, padding: '3px 10px', display: 'inline-block',
    }}>
      {s.label}
    </span>
  )
}

// ── FIELD DISPLAY ROW ─────────────────────────────────────
function Field({ label, value, placeholder = '—' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: value ? '#111827' : '#d1d5db', fontWeight: value ? 500 : 400 }}>
        {value || placeholder}
      </div>
    </div>
  )
}

// ── MAIN DRAWER ───────────────────────────────────────────
export default function ProfileDrawer({ open, onClose }) {
  const { user } = useAuth()
  const drawerRef = useRef()

  const [profile,  setProfile]  = useState(null)   // { user, trainee }
  const [loading,  setLoading]  = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')
  const [isNew,    setIsNew]    = useState(false)   // true if no trainee record yet

  const [form, setForm] = useState({
    phone: '', address: '',
    college_name: '', course: '', batch_year: '',
    enrollment_date: '', expected_end_date: '',
    gpa: '', certifications: '',
  })

  // Fetch profile when drawer opens
  useEffect(() => {
    if (!open) return
    setSuccess('')
    setError('')
    setEditing(false)

    if (user?.role_id === 4) {
      setLoading(true)
      api.get('/intern/profile')
        .then(r => {
          const data = r.data.data
          setProfile(data)
          const isNewUser = !data.trainee
          setIsNew(isNewUser)
          // Pre-fill form with existing data
          setForm({
            phone:             data.user.phone         || '',
            address:           data.user.address       || '',
            college_name:      data.trainee?.college_name      || '',
            course:            data.trainee?.course            || '',
            batch_year:        data.trainee?.batch_year        || '',
            enrollment_date:   data.trainee?.enrollment_date   || '',
            expected_end_date: data.trainee?.expected_end_date || '',
            gpa:               data.trainee?.gpa               || '',
            certifications:    data.trainee?.certifications    || '',
          })
          // Auto-open edit mode for new users who haven't filled profile yet
          if (isNewUser) setEditing(true)
        })
        .catch(() => setError('Failed to load profile'))
        .finally(() => setLoading(false))
    }
  }, [open, user])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.put('/intern/profile', form)
      setProfile(res.data.data)
      setIsNew(false)
      setEditing(false)
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setError('')
    // Reset form to current saved data
    if (profile) {
      setForm({
        phone:             profile.user.phone              || '',
        address:           profile.user.address            || '',
        college_name:      profile.trainee?.college_name   || '',
        course:            profile.trainee?.course         || '',
        batch_year:        profile.trainee?.batch_year     || '',
        enrollment_date:   profile.trainee?.enrollment_date  || '',
        expected_end_date: profile.trainee?.expected_end_date || '',
        gpa:               profile.trainee?.gpa            || '',
        certifications:    profile.trainee?.certifications || '',
      })
    }
  }

  const isIntern = user?.role_id === 4

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 1100, opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'opacity 0.2s',
      }} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh',
          width: 420, maxWidth: '95vw',
          background: '#fff', zIndex: 1200,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, #003b5c 0%, #00b1b4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                {ROLE_LABELS[user?.role_id] || user?.role}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            color: '#fff', fontSize: 18, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* New user banner */}
          {isNew && isIntern && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#92400e',
            }}>
              👋 <strong>Welcome!</strong> Please fill in your profile details below.
              Once submitted, your information will be sent to the admin for approval.
            </div>
          )}

          {/* Pending approval notice */}
          {profile?.trainee?.current_status === 'pending_approval' && !isNew && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#92400e',
            }}>
              ⏳ Your profile is <strong>pending admin approval</strong>. You can still edit your details.
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '10px 14px', color: '#16a34a',
              fontWeight: 600, marginBottom: 16, fontSize: 13 }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', color: '#dc2626',
              fontWeight: 600, marginBottom: 16, fontSize: 13 }}>
              ✗ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              Loading profile…
            </div>
          ) : editing && isIntern ? (

            // ── EDIT MODE ────────────────────────────────
            <div>
              <h4 style={{ margin: '0 0 16px', color: '#003b5c', fontSize: 15 }}>
                {isNew ? '📋 Complete Your Profile' : '✏️ Edit Profile'}
              </h4>

              {/* Contact */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Contact
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+91-" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Address</label>
                  <input name="address" value={form.address} onChange={handleChange}
                    placeholder="City, State" />
                </div>
              </div>

              {/* Academic */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Academic
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>College / University</label>
                  <input name="college_name" value={form.college_name} onChange={handleChange}
                    placeholder="e.g. Delhi University" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Degree / Course</label>
                    <input name="course" value={form.course} onChange={handleChange}
                      placeholder="B.Tech, BCA…" />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Batch Year</label>
                    <input name="batch_year" type="number" value={form.batch_year}
                      onChange={handleChange} placeholder="2025" />
                  </div>
                </div>
              </div>

              {/* Internship dates */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Internship Dates
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Start Date {isNew && <span style={{ color: '#dc2626' }}>*</span>}</label>
                    <input name="enrollment_date" type="date"
                      value={form.enrollment_date} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>End Date</label>
                    <input name="expected_end_date" type="date"
                      value={form.expected_end_date} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Extra */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Additional Info
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 10 }}>
                    <label>GPA / CGPA</label>
                    <input name="gpa" type="number" step="0.01" min="0" max="10"
                      value={form.gpa} onChange={handleChange} placeholder="8.5" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Certifications / Skills</label>
                  <textarea name="certifications" value={form.certifications}
                    onChange={handleChange}
                    placeholder="AWS Cloud Practitioner, React, Python…"
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #dde3f0',
                      padding: '8px 10px', fontFamily: 'inherit', fontSize: 13,
                      resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

          ) : (

            // ── VIEW MODE ────────────────────────────────
            <div>
              {/* Account info */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Account
                </div>
                <Field label="Email"  value={user?.email} />
                <Field label="Phone"  value={profile?.user?.phone} />
                <Field label="Address" value={profile?.user?.address} />
                {profile?.trainee && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                      Status
                    </div>
                    <StatusBadge status={profile.trainee.current_status} />
                  </div>
                )}
              </div>

              {/* Academic */}
              {isIntern && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Academic
                  </div>
                  <Field label="College"    value={profile?.trainee?.college_name} />
                  <Field label="Course"     value={profile?.trainee?.course} />
                  <Field label="Batch Year" value={profile?.trainee?.batch_year} />
                  <Field label="GPA"        value={profile?.trainee?.gpa} />
                </div>
              )}

              {/* Internship */}
              {isIntern && profile?.trainee && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Internship
                  </div>
                  <Field label="Start Date"  value={profile.trainee.enrollment_date} />
                  <Field label="End Date"    value={profile.trainee.expected_end_date} />
                  <Field label="Certifications / Skills" value={profile.trainee.certifications} />
                </div>
              )}

              {/* Non-intern: no editable profile */}
              {!isIntern && (
                <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '30px 0' }}>
                  Profile management is available for interns only.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {isIntern && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #e5e7eb',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
          }}>
            {editing ? (
              <>
                {!isNew && (
                  <button onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    background: '#00b1b4', color: '#fff', fontWeight: 700,
                    fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : isNew ? ' Submit Profile' : ' Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => { setEditing(true); setSuccess('') }}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: '#003b5c', color: '#fff', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
