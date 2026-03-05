import React, { useState, useEffect } from 'react'
import api from '../api/login_api.js'

function UserForm() {
  const [managers, setManagers] = useState([])
  const [buddies,  setBuddies]  = useState([])
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')

  const [formValues, setFormValues] = useState({
    // Personal
    name: '', email: '', password: '', phone: '', dob: '', gender: '',
    // Address
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
    // Academic
    college: '', degree: '', specialization: '',
    // Internship
    startDate: '', endDate: '', manager_id: '', buddy_id: '', role_id: 4,
  })

  // Load managers and buddies for dropdowns
  useEffect(() => {
    api.get('/manager/all-interns').catch(() => {})

    // Get all users to populate manager/buddy dropdowns
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
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Step 1 — register the user
      const userRes = await api.post('/users/register', {
        name:     formValues.name,
        email:    formValues.email,
        password: formValues.password,
        phone:    formValues.phone,
        address:  `${formValues.addressLine1}, ${formValues.city}, ${formValues.state}`,
        role_id:  Number(formValues.role_id),
        dept_id:  1,
      })

      const newUserId = userRes.data.data?.id
      if (!newUserId) throw new Error('User creation failed')

      // Step 2 — create trainee record linked to that user
      await api.post('/manager/trainees', {
        user_id:            newUserId,
        college_name:       formValues.college,
        course:             formValues.degree,
        enrollment_date:    formValues.startDate,
        expected_end_date:  formValues.endDate,
        buddy_id:           formValues.buddy_id   || null,
        manager_id:         formValues.manager_id || null,
        current_status:     'active',
      })

      setSuccess(`✓ ${formValues.name} has been registered successfully!`)
      setFormValues({
        name: '', email: '', password: '', phone: '', dob: '', gender: '',
        addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
        college: '', degree: '', specialization: '',
        startDate: '', endDate: '', manager_id: '', buddy_id: '', role_id: 4,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register intern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Register New Intern / Employee</h2>
          <p>Fill in the details below. This will create a user account and intern record.</p>
        </div>
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

        {/* Personal Details */}
        <section className="form-section">
          <h3>Personal Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" value={formValues.name}
                onChange={handleChange} required placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Official Email *</label>
              <input name="email" type="email" value={formValues.email}
                onChange={handleChange} required placeholder="name@teamcomputers.com" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" value={formValues.password}
                onChange={handleChange} required placeholder="Must contain @, !, 1 and 2" />
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

        {/* Address */}
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

        {/* Academic Details */}
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
        </section>

        {/* Internship Details */}
        <section className="form-section">
          <h3>Internship Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Start Date *</label>
              <input name="startDate" type="date" value={formValues.startDate}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input name="endDate" type="date" value={formValues.endDate}
                onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Reporting Manager</label>
              <select name="manager_id" value={formValues.manager_id} onChange={handleChange}>
                <option value="">-- Select Manager --</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Buddy</label>
              <select name="buddy_id" value={formValues.buddy_id} onChange={handleChange}>
                <option value="">-- Select Buddy --</option>
                {buddies.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn-secondary"
            onClick={() => setSuccess('') || setError('')}>
            Clear
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Registering…' : 'Register Intern'}
          </button>
        </div>

      </form>
    </div>
  )
}

export default UserForm


// import React, { useState } from 'react'

// function UserForm() {
//   const [formValues, setFormValues] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     dob: '',
//     gender: '',
//     addressLine1: '',
//     addressLine2: '',
//     city: '',
//     state: '',
//     pincode: '',
//     country: 'India',
//     college: '',
//     degree: '',
//     specialization: '',
//     startDate: '',
//     endDate: '',
//     manager: '',
//     buddy: '',
//   })

//   const handleChange = (event) => {
//     const { name, value } = event.target
//     setFormValues((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = (event) => {
//     event.preventDefault()
//     // This is UI only: just show a toast-like alert for now.
//     alert('User information captured (front-end only).')
//   }

//   return (
//     <div className="card">
//       <div className="card-header">
//         <div>
//           <h2>Intern / Employee Details</h2>
//           <p>Capture personal, address, academic and internship information.</p>
//         </div>
//       </div>

//       <form className="form-grid" onSubmit={handleSubmit}>
//         <section className="form-section">
//           <h3>Personal Details</h3>
//           <div className="grid-2">
//             <div className="form-group">
//               <label htmlFor="firstName">First Name</label>
//               <input
//                 id="firstName"
//                 name="firstName"
//                 value={formValues.firstName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="lastName">Last Name</label>
//               <input
//                 id="lastName"
//                 name="lastName"
//                 value={formValues.lastName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//           </div>

//           <div className="grid-3">
//             <div className="form-group">
//               <label htmlFor="email">Official Email</label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 placeholder="name@teamcomputers.com"
//                 value={formValues.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="phone">Mobile Number</label>
//               <input
//                 id="phone"
//                 name="phone"
//                 type="tel"
//                 placeholder="+91-"
//                 value={formValues.phone}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="dob">Date of Birth</label>
//               <input
//                 id="dob"
//                 name="dob"
//                 type="date"
//                 value={formValues.dob}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="gender">Gender</label>
//             <select
//               id="gender"
//               name="gender"
//               value={formValues.gender}
//               onChange={handleChange}
//             >
//               <option value="">Select</option>
//               <option value="Female">Female</option>
//               <option value="Male">Male</option>
//               <option value="Non-binary">Non-binary</option>
//               <option value="Prefer not to say">Prefer not to say</option>
//             </select>
//           </div>
//         </section>

//         <section className="form-section">
//           <h3>Address</h3>
//           <div className="form-group">
//             <label htmlFor="addressLine1">Address Line 1</label>
//             <input
//               id="addressLine1"
//               name="addressLine1"
//               value={formValues.addressLine1}
//               onChange={handleChange}
//             />
//           </div>
//           <div className="form-group">
//             <label htmlFor="addressLine2">Address Line 2</label>
//             <input
//               id="addressLine2"
//               name="addressLine2"
//               value={formValues.addressLine2}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="grid-3">
//             <div className="form-group">
//               <label htmlFor="city">City</label>
//               <input
//                 id="city"
//                 name="city"
//                 value={formValues.city}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="state">State</label>
//               <input
//                 id="state"
//                 name="state"
//                 value={formValues.state}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="pincode">PIN Code</label>
//               <input
//                 id="pincode"
//                 name="pincode"
//                 value={formValues.pincode}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="country">Country</label>
//             <input
//               id="country"
//               name="country"
//               value={formValues.country}
//               onChange={handleChange}
//             />
//           </div>
//         </section>

//         <section className="form-section">
//           <h3>Academic Details</h3>
//           <div className="grid-2">
//             <div className="form-group">
//               <label htmlFor="college">College / University</label>
//               <input
//                 id="college"
//                 name="college"
//                 value={formValues.college}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="degree">Degree</label>
//               <input
//                 id="degree"
//                 name="degree"
//                 placeholder="B.Tech, BCA, MBA..."
//                 value={formValues.degree}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>
//           <div className="form-group">
//             <label htmlFor="specialization">Specialization</label>
//             <input
//               id="specialization"
//               name="specialization"
//               placeholder="e.g. Computer Science"
//               value={formValues.specialization}
//               onChange={handleChange}
//             />
//           </div>
//         </section>

//         <section className="form-section">
//           <h3>Internship Details</h3>
//           <div className="grid-3">
//             <div className="form-group">
//               <label htmlFor="startDate">Start Date</label>
//               <input
//                 id="startDate"
//                 name="startDate"
//                 type="date"
//                 value={formValues.startDate}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="endDate">End Date</label>
//               <input
//                 id="endDate"
//                 name="endDate"
//                 type="date"
//                 value={formValues.endDate}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="form-group">
//               <label>Duration</label>
//               <input
//                 readOnly
//                 value="Auto-calculated (UI only)"
//                 className="readonly"
//               />
//             </div>
//           </div>

//           <div className="grid-2">
//             <div className="form-group">
//               <label htmlFor="manager">Reporting Manager</label>
//               <input
//                 id="manager"
//                 name="manager"
//                 placeholder="Manager name"
//                 value={formValues.manager}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="buddy">Buddy / Trainee</label>
//               <input
//                 id="buddy"
//                 name="buddy"
//                 placeholder="Buddy name"
//                 value={formValues.buddy}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>
//         </section>

//         <section className="form-section">
//           <h3>Documents</h3>
//           <p className="section-description">
//             Upload supporting documents (offer letter, ID proof, college ID,
//             NDAs, etc.). This demo is UI only and will not actually upload
//             files.
//           </p>
//           <div className="grid-3">
//             <div className="form-group">
//               <label htmlFor="offerLetter">Offer / Internship Letter</label>
//               <input id="offerLetter" type="file" />
//             </div>
//             <div className="form-group">
//               <label htmlFor="idProof">Government ID</label>
//               <input id="idProof" type="file" />
//             </div>
//             <div className="form-group">
//               <label htmlFor="collegeId">College ID</label>
//               <input id="collegeId" type="file" />
//             </div>
//           </div>
//         </section>

//         <div className="form-actions">
//           <button type="button" className="btn-secondary">
//             Save as Draft
//           </button>
//           <button type="submit" className="btn-primary">
//             Submit Details
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }

// export default UserForm

