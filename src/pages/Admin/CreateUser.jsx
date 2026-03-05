import { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 4
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axiosClient.post(
        '/api/v1/admin/users', 
        formData
      );
      
      if (response.data.success) {
        setMessage('User created successfully!');
        setFormData({ name: '', email: '', password: '', role_id: 4 });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error creating user!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user">
      <h2>Create New User</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <select
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            disabled={loading}
          >
            <option value={4}>User (Intern)</option>
            <option value={1}>Admin</option>
            <option value={2}>Manager</option>
            <option value={3}>Trainee</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  );
};

export default CreateUser;
