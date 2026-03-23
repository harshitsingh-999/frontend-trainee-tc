import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/login_api.js'

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '', gender: '',
  addressLine1: '', city: '', state: '', pincode: '', country: 'India',
  college: '', degree: '', specialization: '',
  startDate: '', endDate: '',
  manager_id: '', buddy_id: '', role_id: 4,
}

function UserForm() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // ── Edit mode: coworker passes existing user via location.state ──
  const editUser  = location.state?.user || null
  const isEditMode = !!editUser

  const [managers, setManagers] = useState([])
  const [buddies,  setBuddies]  = useState([])
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')

  // Pre-fill form in edit mode
  const [formValues, setFormValues] = useState(() => {
    if (!isEditMode) return EMPTY_FORM
    return {
      name:         editUser.name  || '',
      email:        editUser.email || '',
      password:     '',  // never pre-fill passwords
      phone:        editUser.phone || '',
      gender:       editUser.gender || '',
      addressLine1: editUser.addressLine1 || editUser.address || '',
      city:         editUser.city  || '',
      state:        editUser.state || '',
      pincode:      editUser.pincode || '',
      country:      editUser.country || 'India',
      college:      editUser.college_name || editUser.college || '',
      degree:       editUser.course  || editUser.degree || '',
      specialization: editUser.specialization || '',
      startDate:    editUser.enrollment_date   || editUser.startDate || '',
      endDate:      editUser.expected_end_date || editUser.endDate   || '',
      manager_id:   editUser.manager_id || '',
      buddy_id:     editUser.buddy_id   || '',
      role_id:      editUser.role_id    || 4,
    }
  })

  // Load manager and buddy dropdowns
  useEffect(() => {
    api.get('/users/').then(res => {
      const users = res.data.data || []
      setManagers(users.filter(u => u.role_id === 2))
      setBuddies(users.filter(u => u.role_id === 3))
    }).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')

    try {
      if (isEditMode) {
        // ── EDIT MODE (coworker's flow) ──
        const payload = {
          name:    formValues.name,
          email:   formValues.email,
          phone:   formValues.phone,
          role_id: Number(formValues.role_id),
          is_active: 1,
        }
        // Only send password if the admin actually typed one
        if (formValues.password.trim()) payload.password = formValues.password

        await api.put(`/users/${editUser.id}`, payload)

        // Also update trainee record if they have one
        if (editUser.trainee_id || editUser.id) {
          await api.put(`/manager/trainees/${editUser.trainee_id || editUser.id}`, {
            college_name:      formValues.college,
            course:            formValues.degree,
            enrollment_date:   formValues.startDate,
            expected_end_date: formValues.endDate,
            buddy_id:          formValues.buddy_id   || null,
            manager_id:        formValues.manager_id || null,
          }).catch(() => {}) // trainee record may not exist for all roles
        }

        setSuccess(`✓ ${formValues.name} updated successfully!`)
        setTimeout(() => navigate(-1), 1200)

      } else {
        // ── CREATE MODE (your flow) ──

        // Step 1 — register user account
        const userRes = await api.post('/users/register', {
          name:     formValues.name,
          email:    formValues.email,
          password: formValues.password,
          phone:    formValues.phone,
          address:  [formValues.addressLine1, formValues.city, formValues.state]
                      .filter(Boolean).join(', '),
          role_id:  Number(formValues.role_id),
          dept_id:  1,
        })

        const newUserId = userRes.data.data?.id
        if (!newUserId) throw new Error('User creation failed — no ID returned')

        // Step 2 — create trainee record (only for intern/buddy roles)
        if ([3, 4].includes(Number(formValues.role_id))) {
          await api.post('/manager/trainees', {
            user_id:           newUserId,
            college_name:      formValues.college,
            course:            formValues.degree,
            enrollment_date:   formValues.startDate,
            expected_end_date: formValues.endDate,
            buddy_id:          formValues.buddy_id   || null,
            manager_id:        formValues.manager_id || null,
            current_status:    'active',
          })
        }

        setSuccess(`✓ ${formValues.name} registered successfully!`)
        setFormValues(EMPTY_FORM)
      }
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update user' : 'Failed to register user'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>{isEditMode ? `Edit — ${editUser.name || editUser.email}` : 'Register New Intern / Employee'}</h2>
          <p>
            {isEditMode
              ? 'Update the details below and save.'
              : 'Fill in the details below to create a user account and intern record.'}
          </p>
        </div>
        {isEditMode && (
          <button className="btn-secondary btn-small" onClick={() => navigate(-1)}>
            ← Back
          </button>
        )}
      </div>

      {success && (
        <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '12px 16px',
          borderRadius: 8, margin: '0 0 20px', fontWeight: 600 }}>
          {success}
        </p>
      )}
      {error && (
        <p style={{ color: '#dc2626', background: '#fef2f2', padding: '12px 16px',
          borderRadius: 8, margin: '0 0 20px', fontWeight: 600 }}>
          {error}
        </p>
      )}

      <form className="form-grid" onSubmit={handleSubmit}>

        {/* ── Personal Details ── */}
        <section className="form-section">
          <h3>Personal Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" value={formValues.name} onChange={handleChange}
                required placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Official Email *</label>
              <input name="email" type="email" value={formValues.email}
                onChange={handleChange} required placeholder="name@teamcomputers.com" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{isEditMode ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
              <input name="password" type="password" value={formValues.password}
                onChange={handleChange} required={!isEditMode}
                placeholder={isEditMode ? 'Leave blank to keep current' : 'Set initial password'} />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input name="phone" type="tel" value={formValues.phone}
                onChange={handleChange} placeholder="+91-" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Role</label>
              <select name="role_id" value={formValues.role_id} onChange={handleChange}>
                <option value={4}>Intern / Trainee</option>
                <option value={3}>Buddy</option>
                <option value={2}>Manager</option>
                <option value={1}>Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formValues.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Address ── */}
        <section className="form-section">
          <h3>Address</h3>
          <div className="form-group">
            <label>Address Line 1</label>
            <input name="addressLine1" value={formValues.addressLine1} onChange={handleChange} />
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label>City</label>
              <input name="city" value={formValues.city} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input name="state" value={formValues.state} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>PIN Code</label>
              <input name="pincode" value={formValues.pincode} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* ── Academic Details ── */}
        <section className="form-section">
          <h3>Academic Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>College / University</label>
              <input name="college" value={formValues.college}
                onChange={handleChange} placeholder="e.g. Delhi University" />
            </div>
            <div className="form-group">
              <label>Degree</label>
              <input name="degree" value={formValues.degree}
                onChange={handleChange} placeholder="B.Tech, BCA, MBA..." />
            </div>
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input name="specialization" value={formValues.specialization}
              onChange={handleChange} placeholder="e.g. Computer Science" />
          </div>
        </section>

        {/* ── Internship Details ── */}
        <section className="form-section">
          <h3>Internship Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Start Date {!isEditMode && '*'}</label>
              <input name="startDate" type="date" value={formValues.startDate}
                onChange={handleChange} required={!isEditMode} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input name="endDate" type="date" value={formValues.endDate} onChange={handleChange} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Reporting Manager</label>
              <select name="manager_id" value={formValues.manager_id} onChange={handleChange}>
                <option value="">-- Select Manager --</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Buddy</label>
              <select name="buddy_id" value={formValues.buddy_id} onChange={handleChange}>
                <option value="">-- Select Buddy --</option>
                {buddies.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn-secondary"
            onClick={() => isEditMode ? navigate(-1) : setFormValues(EMPTY_FORM)}>
            {isEditMode ? 'Cancel' : 'Clear'}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving
              ? (isEditMode ? 'Saving…' : 'Registering…')
              : (isEditMode ? 'Save Changes' : 'Register Intern')}
          </button>
        </div>

      </form>
    </div>
  )
}

export default UserForm
