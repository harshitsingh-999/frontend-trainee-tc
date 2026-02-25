import React, { useState } from 'react'

function UserForm() {
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    college: '',
    degree: '',
    specialization: '',
    startDate: '',
    endDate: '',
    manager: '',
    buddy: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // This is UI only: just show a toast-like alert for now.
    alert('User information captured (front-end only).')
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Intern / Employee Details</h2>
          <p>Capture personal, address, academic and internship information.</p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>Personal Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label htmlFor="email">Official Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@teamcomputers.com"
                value={formValues.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Mobile Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91-"
                value={formValues.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formValues.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formValues.gender}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </section>

        <section className="form-section">
          <h3>Address</h3>
          <div className="form-group">
            <label htmlFor="addressLine1">Address Line 1</label>
            <input
              id="addressLine1"
              name="addressLine1"
              value={formValues.addressLine1}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="addressLine2">Address Line 2</label>
            <input
              id="addressLine2"
              name="addressLine2"
              value={formValues.addressLine2}
              onChange={handleChange}
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                value={formValues.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                value={formValues.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pincode">PIN Code</label>
              <input
                id="pincode"
                name="pincode"
                value={formValues.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              name="country"
              value={formValues.country}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="form-section">
          <h3>Academic Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="college">College / University</label>
              <input
                id="college"
                name="college"
                value={formValues.college}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="degree">Degree</label>
              <input
                id="degree"
                name="degree"
                placeholder="B.Tech, BCA, MBA..."
                value={formValues.degree}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="specialization">Specialization</label>
            <input
              id="specialization"
              name="specialization"
              placeholder="e.g. Computer Science"
              value={formValues.specialization}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="form-section">
          <h3>Internship Details</h3>
          <div className="grid-3">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formValues.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formValues.endDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input
                readOnly
                value="Auto-calculated (UI only)"
                className="readonly"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="manager">Reporting Manager</label>
              <input
                id="manager"
                name="manager"
                placeholder="Manager name"
                value={formValues.manager}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="buddy">Buddy / Trainee</label>
              <input
                id="buddy"
                name="buddy"
                placeholder="Buddy name"
                value={formValues.buddy}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Documents</h3>
          <p className="section-description">
            Upload supporting documents (offer letter, ID proof, college ID,
            NDAs, etc.). This demo is UI only and will not actually upload
            files.
          </p>
          <div className="grid-3">
            <div className="form-group">
              <label htmlFor="offerLetter">Offer / Internship Letter</label>
              <input id="offerLetter" type="file" />
            </div>
            <div className="form-group">
              <label htmlFor="idProof">Government ID</label>
              <input id="idProof" type="file" />
            </div>
            <div className="form-group">
              <label htmlFor="collegeId">College ID</label>
              <input id="collegeId" type="file" />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn-secondary">
            Save as Draft
          </button>
          <button type="submit" className="btn-primary">
            Submit Details
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserForm

