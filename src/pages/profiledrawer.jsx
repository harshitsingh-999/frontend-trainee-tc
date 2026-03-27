import React, { useState, useEffect, useRef } from 'react'
import api from '../api/login_api.js'
import { useAuth } from '../context/authcontext.jsx'
import AvatarEditor from 'react-avatar-editor'
import { uploadInternDocument, getMyDocuments } from '../api/api.js'
import toast from 'react-hot-toast'

const ROLE_LABELS = { 1: 'Admin', 2: 'Manager', 3: 'Buddy', 4: 'Intern' }
const API_BASE = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, '') : 'http://localhost:7357'
const getAvatarUrl = (url) => (url ? `${API_BASE}${url}` : null)

const DOC_TYPE_LABELS = {
  '10th_marksheet': '10th Marksheet',
  '12th_marksheet': '12th Marksheet',
  aadhar: 'Aadhar Card',
  pan_card: 'PAN Card',
  other: 'Other',
}

// ── STATUS BADGE ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active: { bg: '#f0fdf4', text: '#16a34a', label: 'Active' },
    pending_approval: { bg: '#fffbeb', text: '#d97706', label: 'Pending Approval' },
    completed: { bg: '#eff6ff', text: '#2563eb', label: 'Completed' },
    on_leave: { bg: '#faf5ff', text: '#7c3aed', label: 'On Leave' },
    terminated: { bg: '#fef2f2', text: '#dc2626', label: 'Terminated' },
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

// ── DOCUMENT STATUS BADGE ─────────────────────────────────
function DocStatusBadge({ status }) {
  const map = {
    pending:  { bg: '#fffbeb', text: '#d97706', label: '⏳ Pending' },
    approved: { bg: '#f0fdf4', text: '#16a34a', label: '✓ Approved' },
    rejected: { bg: '#fef2f2', text: '#dc2626', label: '✗ Rejected' },
  }
  const s = map[status] || { bg: '#f1f5f9', text: '#475569', label: status }
  return (
    <span style={{
      background: s.bg, color: s.text, fontSize: 11, fontWeight: 700,
      borderRadius: 5, padding: '2px 8px', display: 'inline-block',
    }}>
      {s.label}
    </span>
  )
}

// ── FIELD DISPLAY ROW ─────────────────────────────────────
function Field({ label, value, placeholder = '—' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11, color: '#9ca3af', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: value ? '#111827' : '#d1d5db', fontWeight: value ? 500 : 400 }}>
        {value || placeholder}
      </div>
    </div>
  )
}

// ── SECTION LABEL ─────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, color: '#9ca3af', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

// ── MAIN DRAWER ───────────────────────────────────────────
export default function ProfileDrawer({ open, onClose }) {
  const { user, updateUser } = useAuth()
  const drawerRef = useRef()

  // ── Profile state ──────────────────────────────────────
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')
  const [isNew, setIsNew]         = useState(false)

  const [form, setForm] = useState({
    phone: '', address: '',
    college_name: '', course: '', batch_year: '',
    enrollment_date: '', expected_end_date: '',
    gpa: '', certifications: '',
  })

  // ── Avatar crop state ──────────────────────────────────
  const [uploadingPic, setUploadingPic]   = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [cropScale, setCropScale]         = useState(1.2)
  const cropperRef                        = useRef(null)

  // ── Document state ─────────────────────────────────────
  const [activeTab, setActiveTab]       = useState('profile')   // 'profile' | 'documents'
  const [docs, setDocs]                 = useState([])
  const [docsLoading, setDocsLoading]   = useState(false)
  const [docType, setDocType]           = useState('10th_marksheet')
  const [docFile, setDocFile]           = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docFileRef                      = useRef()

  const isIntern = user?.role_id === 4

  // ── Fetch profile when drawer opens ───────────────────
  useEffect(() => {
    if (!open) return
    setSuccess('')
    setError('')
    setEditing(false)
    setActiveTab('profile')

    if (isIntern) {
      setLoading(true)
      api.get('/intern/profile')
        .then(r => {
          const data = r.data.data
          setProfile(data)
          const isNewUser = !data.trainee
          setIsNew(isNewUser)
          setForm({
            phone:             data.user.phone                  || '',
            address:           data.user.address                || '',
            college_name:      data.trainee?.college_name       || '',
            course:            data.trainee?.course             || '',
            batch_year:        data.trainee?.batch_year         || '',
            enrollment_date:   data.trainee?.enrollment_date    || '',
            expected_end_date: data.trainee?.expected_end_date  || '',
            gpa:               data.trainee?.gpa                || '',
            certifications:    data.trainee?.certifications     || '',
          })
          if (isNewUser) setEditing(true)
        })
        .catch(() => setError('Failed to load profile'))
        .finally(() => setLoading(false))
    }
  }, [open, user])

  // ── Fetch documents when Documents tab is opened ───────
  useEffect(() => {
    if (!open || !isIntern || activeTab !== 'documents') return
    setDocsLoading(true)
    getMyDocuments()
      .then(res => setDocs(res?.data?.data || []))
      .catch(() => {})
      .finally(() => setDocsLoading(false))
  }, [open, activeTab, isIntern])

  // ── Close on outside click ─────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // ── Avatar handlers ────────────────────────────────────
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    e.target.value = null
  }

  const handleSaveCrop = async () => {
    if (!cropperRef.current) return
    const canvas = cropperRef.current.getImageScaledToCanvas()
    canvas.toBlob(async (blob) => {
      if (!blob) return
      setUploadingPic(true)
      setError('')
      setSuccess('')
      const formData = new FormData()
      formData.append('image', blob, 'profile.png')
      try {
        const res = await api.post('/users/upload-profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (res.data.success) {
          setSuccess('Profile picture updated!')
          setProfile(prev =>
            prev ? { ...prev, user: { ...prev.user, profile_picture: res.data.profile_url } } : prev
          )
          if (updateUser && user) updateUser({ ...user, profile_picture: res.data.profile_url })
          setSelectedImage(null)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to upload picture')
      } finally {
        setUploadingPic(false)
      }
    })
  }

  // ── Profile form handlers ──────────────────────────────
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
    if (profile) {
      setForm({
        phone:             profile.user.phone                 || '',
        address:           profile.user.address               || '',
        college_name:      profile.trainee?.college_name      || '',
        course:            profile.trainee?.course            || '',
        batch_year:        profile.trainee?.batch_year        || '',
        enrollment_date:   profile.trainee?.enrollment_date   || '',
        expected_end_date: profile.trainee?.expected_end_date || '',
        gpa:               profile.trainee?.gpa               || '',
        certifications:    profile.trainee?.certifications    || '',
      })
    }
  }

  // ── Document upload handler ────────────────────────────
  const handleDocUpload = async () => {
    if (!docFile) {
      toast.error('Please select a file first.')
      return
    }
    const formData = new FormData()
    formData.append('document', docFile)
    formData.append('doc_type', docType)
    setUploadingDoc(true)
    try {
      await uploadInternDocument(formData)
      toast.success('Document uploaded! Pending admin approval.')
      setDocFile(null)
      if (docFileRef.current) docFileRef.current.value = ''
      // Refresh doc list
      const res = await getMyDocuments()
      setDocs(res?.data?.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploadingDoc(false)
    }
  }

  // ── Render ─────────────────────────────────────────────
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
        {/* ── Header ───────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, #003b5c 0%, #00b1b4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar */}
            <div
              style={{ position: 'relative', cursor: uploadingPic ? 'wait' : 'pointer' }}
              onClick={() => !uploadingPic && document.getElementById('avatar-upload').click()}
              title="Click to update profile picture"
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#fff',
                overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0,
              }}>
                {(profile?.user?.profile_picture || user?.profile_picture) ? (
                  <img
                    src={getAvatarUrl(profile?.user?.profile_picture || user?.profile_picture)}
                    alt="avatar"
                    width={48} height={48}
                    style={{ objectFit: 'cover', display: 'block', opacity: uploadingPic ? 0.5 : 1 }}
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <span style={{
                  display: (profile?.user?.profile_picture || user?.profile_picture) ? 'none' : 'flex',
                  width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: '#fff',
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div style={{
                position: 'absolute', bottom: -5, right: -5,
                background: '#00b1b4', borderRadius: '50%', width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)', color: '#fff', fontSize: 12,
              }}>
                📷
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
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

        {/* ── Tabs (Intern only) ────────────────────────── */}
        {isIntern && (
          <div style={{
            display: 'flex', borderBottom: '2px solid #f0f0f0',
            background: '#fafafa',
          }}>
            {[
              { key: 'profile',   label: '👤 Profile' },
              { key: 'documents', label: '📄 Documents' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSuccess(''); setError('') }}
                style={{
                  flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
                  background: 'transparent', fontWeight: 600, fontSize: 13,
                  color: activeTab === tab.key ? '#003b5c' : '#9ca3af',
                  borderBottom: activeTab === tab.key ? '2px solid #00b1b4' : '2px solid transparent',
                  marginBottom: -2, transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Body ─────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ──── PROFILE TAB ──────────────────────────── */}
          {activeTab === 'profile' && (
            <>
              {/* Banners */}
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

              {profile?.trainee?.current_status === 'pending_approval' && !isNew && (
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                  fontSize: 13, color: '#92400e',
                }}>
                  🕐 Your profile is <strong>pending admin approval</strong>. You can still edit your details.
                </div>
              )}

              {/* Alerts */}
              {success && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 8, padding: '10px 14px', color: '#16a34a',
                  fontWeight: 600, marginBottom: 16, fontSize: 13,
                }}>
                  ✓ {success}
                </div>
              )}
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '10px 14px', color: '#dc2626',
                  fontWeight: 600, marginBottom: 16, fontSize: 13,
                }}>
                  ✗ {error}
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  Loading profile…
                </div>
              ) : editing && isIntern ? (

                // ── EDIT MODE ──────────────────────────────
                <div>
                  <h4 style={{ margin: '0 0 16px', color: '#003b5c', fontSize: 15 }}>
                    {isNew ? '📋 Complete Your Profile' : '✏️ Edit Profile'}
                  </h4>

                  {/* Contact */}
                  <div style={{ marginBottom: 18 }}>
                    <SectionLabel>Contact</SectionLabel>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>Phone Number</label>
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91-" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Address</label>
                      <input name="address" value={form.address} onChange={handleChange} placeholder="City, State" />
                    </div>
                  </div>

                  {/* Academic */}
                  <div style={{ marginBottom: 18 }}>
                    <SectionLabel>Academic</SectionLabel>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>College / University</label>
                      <input name="college_name" value={form.college_name} onChange={handleChange} placeholder="e.g. Delhi University" />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label>Degree / Course</label>
                        <input name="course" value={form.course} onChange={handleChange} placeholder="B.Tech, BCA…" />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Batch Year</label>
                        <input name="batch_year" type="number" value={form.batch_year} onChange={handleChange} placeholder="2025" />
                      </div>
                    </div>
                  </div>

                  {/* Internship Dates */}
                  <div style={{ marginBottom: 18 }}>
                    <SectionLabel>Internship Dates</SectionLabel>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Start Date {isNew && <span style={{ color: '#dc2626' }}>*</span>}</label>
                        <input name="enrollment_date" type="date" value={form.enrollment_date} onChange={handleChange} />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>End Date</label>
                        <input name="expected_end_date" type="date" value={form.expected_end_date} onChange={handleChange} />
                      </div>
                    </div>
                  </div>

                  {/* Additional */}
                  <div style={{ marginBottom: 18 }}>
                    <SectionLabel>Additional Info</SectionLabel>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>GPA / CGPA</label>
                      <input name="gpa" type="number" step="0.01" min="0" max="10" value={form.gpa} onChange={handleChange} placeholder="8.5" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Certifications / Skills</label>
                      <textarea
                        name="certifications"
                        value={form.certifications}
                        onChange={handleChange}
                        placeholder="AWS Cloud Practitioner, React, Python…"
                        style={{
                          width: '100%', borderRadius: 8, border: '1px solid #dde3f0',
                          padding: '8px 10px', fontFamily: 'inherit', fontSize: 13,
                          resize: 'vertical', minHeight: 70, boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

              ) : (

                // ── VIEW MODE ──────────────────────────────
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <SectionLabel>Account</SectionLabel>
                    <Field label="Email"   value={user?.email} />
                    <Field label="Phone"   value={profile?.user?.phone} />
                    <Field label="Address" value={profile?.user?.address} />
                    {profile?.trainee && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{
                          fontSize: 11, color: '#9ca3af', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3,
                        }}>
                          Status
                        </div>
                        <StatusBadge status={profile.trainee.current_status} />
                      </div>
                    )}
                  </div>

                  {isIntern && (
                    <div style={{ marginBottom: 20 }}>
                      <SectionLabel>Academic</SectionLabel>
                      <Field label="College"    value={profile?.trainee?.college_name} />
                      <Field label="Course"     value={profile?.trainee?.course} />
                      <Field label="Batch Year" value={profile?.trainee?.batch_year} />
                      <Field label="GPA"        value={profile?.trainee?.gpa} />
                    </div>
                  )}

                  {isIntern && profile?.trainee && (
                    <div style={{ marginBottom: 20 }}>
                      <SectionLabel>Internship</SectionLabel>
                      <Field label="Start Date"              value={profile.trainee.enrollment_date} />
                      <Field label="End Date"                value={profile.trainee.expected_end_date} />
                      <Field label="Certifications / Skills" value={profile.trainee.certifications} />
                    </div>
                  )}

                  {!isIntern && (
                    <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '30px 0' }}>
                      Profile management is available for interns only.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ──── DOCUMENTS TAB ────────────────────────── */}
          {activeTab === 'documents' && isIntern && (
            <div>
              {/* Info banner */}
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: '#1e40af',
              }}>
                📎 Upload your academic and identity documents below. Each document will be reviewed and approved by the admin.
              </div>

              {/* Upload section */}
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 10, padding: 16, marginBottom: 24,
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#003b5c', marginBottom: 14 }}>
                  Upload New Document
                </div>

                {/* Document type dropdown */}
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Document Type</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: '1px solid #dde3f0', fontSize: 13,
                      fontFamily: 'inherit', background: '#fff',
                    }}
                  >
                    <option value="10th_marksheet">10th Marksheet</option>
                    <option value="12th_marksheet">12th Marksheet</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="pan_card">PAN Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* File picker */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Select File <span style={{ color: '#9ca3af', fontWeight: 400 }}>(PDF, JPG, PNG — max 5MB)</span></label>
                  <input
                    ref={docFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setDocFile(e.target.files[0] || null)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      border: '1px solid #dde3f0', fontSize: 13,
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  {docFile && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      Selected: <strong>{docFile.name}</strong>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <button
                  onClick={handleDocUpload}
                  disabled={uploadingDoc || !docFile}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                    background: uploadingDoc || !docFile ? '#9ca3af' : '#2563eb',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: uploadingDoc || !docFile ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {uploadingDoc ? '⏳ Uploading…' : '⬆ Upload Document'}
                </button>
              </div>

              {/* Uploaded documents list */}
              <div style={{ fontWeight: 700, fontSize: 13, color: '#003b5c', marginBottom: 12 }}>
                My Uploaded Documents
              </div>

              {docsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
                  Loading documents…
                </div>
              ) : docs.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '28px 0', color: '#9ca3af',
                  fontSize: 13, border: '1px dashed #e5e7eb', borderRadius: 10,
                }}>
                  No documents uploaded yet.
                </div>
              ) : (
                docs.map(d => (
                  <div
                    key={d.id}
                    style={{
                      background: '#fff', border: '1px solid #e5e7eb',
                      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
                        📄 {DOC_TYPE_LABELS[d.doc_type] || d.doc_type}
                      </span>
                      <DocStatusBadge status={d.status} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      Uploaded on {new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {d.original_name && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        File: {d.original_name}
                      </div>
                    )}
                    {d.admin_note && (
                      <div style={{
                        marginTop: 8, fontSize: 12, padding: '6px 10px',
                        background: d.status === 'rejected' ? '#fef2f2' : '#f0fdf4',
                        borderRadius: 6, color: d.status === 'rejected' ? '#dc2626' : '#16a34a',
                        fontWeight: 500,
                      }}>
                        💬 Admin note: {d.admin_note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Footer (Profile tab only) ─────────────────── */}
        {isIntern && activeTab === 'profile' && (
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
                  {saving ? 'Saving…' : isNew ? '✅ Submit Profile' : '💾 Save Changes'}
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

      {/* ── Avatar Crop Modal ─────────────────────────── */}
      {selectedImage && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 24, width: 350,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#003b5c' }}>Crop Profile Picture</h3>

            <div style={{ borderRadius: 8, overflow: 'hidden', background: '#f8fafc', marginBottom: 16 }}>
              <AvatarEditor
                ref={cropperRef}
                image={selectedImage}
                width={200}
                height={200}
                border={20}
                borderRadius={100}
                color={[255, 255, 255, 0.6]}
                scale={cropScale}
                rotate={0}
              />
            </div>

            <div style={{ width: '100%', marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Zoom: {Math.round(cropScale * 100)}%
              </label>
              <input
                type="range"
                value={cropScale}
                min="1" max="3" step="0.1"
                onChange={e => setCropScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCrop}
                disabled={uploadingPic}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#00b1b4', color: '#fff', fontWeight: 600,
                  cursor: uploadingPic ? 'wait' : 'pointer',
                  opacity: uploadingPic ? 0.7 : 1,
                }}
              >
                {uploadingPic ? 'Saving...' : 'Save & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}