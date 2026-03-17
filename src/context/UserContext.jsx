import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
  setLoading(true);
  setError('');

  try {
    console.log('Fetching users from API...');

    const response = await axiosClient.get('/admin/users', { params: { _ts: Date.now() } });

    console.log('API Response:', response.data);

    const payload = response?.data || {};
    const ok = payload.status === true || payload.success === true || Array.isArray(payload.data) || Array.isArray(payload.users);
    const usersData =
      (Array.isArray(payload.data) && payload.data) ||
      (Array.isArray(payload.users) && payload.users) ||
      (Array.isArray(payload.data?.users) && payload.data.users) ||
      [];

    if (ok) {
      setUsers(usersData);
    } else {
      setUsers([]);
      setError(payload.message || "Failed to fetch users");
    }

  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Failed to fetch users';
    setUsers([]);
    setError(errorMsg);
    console.error('Users fetch error:', err);
  } finally {
    setLoading(false);
  }

}, []);

  const createUserData = useCallback(async (formData) => {
    try {
      const response = await axiosClient.post('/admin/users', formData);
      if (response.data.success) {
        // Add the new user to the list immediately
        setUsers([...users, response.data.user]);
        return response.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error creating user!';
      throw new Error(errorMsg);
    }
  }, [users]);

  const toggleUserStatus = useCallback(async (id, isActive) => {
    try {
      const response = await axiosClient.put(`/admin/users/${id}`, {
        is_active: isActive ? 1 : 0
      });
      if (response.data.success) {
        // Update user in the list
        setUsers(users.map(user => 
          user.id === id ? { ...user, is_active: isActive ? 1 : 0 } : user
        ));
        return response.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error updating user status!';
      throw new Error(errorMsg);
    }
  }, [users]);

  const deleteUser = useCallback(async (id) => {
    try {
      const response = await axiosClient.delete(`/admin/users/${id}`);

      if (response.data.success) {
        // Remove user from list
        setUsers(users.filter(user => user.id !== id));
        return response.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error deleting user!';
      throw new Error(errorMsg);
    }
  }, [users]);

  return (
    <UserContext.Provider value={{ 
      users, 
      loading, 
      error, 
      fetchUsers, 
      createUserData, 
      toggleUserStatus,
      deleteUser,
      setError 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
