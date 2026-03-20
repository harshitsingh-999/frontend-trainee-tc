import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:7357/api/v1';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    // Optional: show success toast for mutating requests (POST, PUT, DELETE)
    const method = response.config.method?.toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      const message = response.data?.message || 'Action completed successfully';
      // Avoid showing toast for login/logout/profile-upload since they're handled specifically
      if (
        !response.config.url.endsWith('/login') &&
        !response.config.url.endsWith('/logout') &&
        !response.config.url.endsWith('/upload-profile')
      ) {
        toast.success(message);
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (status === 401) {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else {
      // Don't show toast for 401 as it redirects to login
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
