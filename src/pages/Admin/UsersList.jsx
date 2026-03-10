import { useEffect, useState } from 'react';
import { useUser } from '../../Contexts/UserContext';

const UsersList = () => {
  const { users, loading, error, fetchUsers, toggleUserStatus } = useUser();
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [togglingUserId, setTogglingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    setTogglingUserId(user.id);
    setActionError('');
    setActionSuccess('');
    try {
      const newStatus = user.is_active ? 0 : 1;
      await toggleUserStatus(user.id, newStatus === 1);
      setActionSuccess(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Error updating user status');
    } finally {
      setTogglingUserId(null);
    }
  };

  const getRoleName = (roleId) => {
    const roles = { 1: 'Admin', 2: 'Manager', 3: 'Trainee', 4: 'Intern' };
    return roles[roleId] || 'Unknown';
  };

  const handleRefresh = () => {
    setActionError('');
    setActionSuccess('');
    fetchUsers();
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="users-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>All Users</h2>
        <button 
          onClick={handleRefresh} 
          className="refresh-btn"
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {actionError && <div className="error-message">{actionError}</div>}
      {actionSuccess && <div className="success-message">{actionSuccess}</div>}
      
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{getRoleName(user.role_id)}</td>
                <td>
                  <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={togglingUserId === user.id}
                    className="status-toggle-btn"
                    style={{
                      padding: '6px 12px',
                      cursor: togglingUserId === user.id ? 'wait' : 'pointer',
                      backgroundColor: user.is_active ? '#ff6b6b' : '#51cf66',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {togglingUserId === user.id 
                      ? 'Updating...' 
                      : user.is_active ? 'Deactivate' : 'Activate'
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsersList;
