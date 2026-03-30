import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:7357/api/v1';
const SESSION_STORAGE_KEY = 'authSession';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toIsoString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const createDefaultSessionExpiry = () => new Date(Date.now() + ONE_DAY_MS).toISOString();

const getPersistedSession = () => {
  try {
    const value = localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

const persistToken = (token) => {
  if (!token) return;
  localStorage.setItem('token', token);
  localStorage.setItem('authToken', token);
};

const persistSession = (payload = {}) => {
  const fallbackSession = getPersistedSession();
  const session = {
    refreshTokenExpiresAt:
      toIsoString(payload?.refreshTokenExpiresAt) ||
      toIsoString(fallbackSession?.refreshTokenExpiresAt) ||
      createDefaultSessionExpiry(),
    accessTokenExpiresAt:
      toIsoString(payload?.accessTokenExpiresAt) ||
      toIsoString(payload?.refreshTokenExpiresAt) ||
      toIsoString(fallbackSession?.refreshTokenExpiresAt) ||
      createDefaultSessionExpiry()
  };

  if (session.accessTokenExpiresAt || session.refreshTokenExpiresAt) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

const clearPersistedAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

let refreshPromise = null;

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
    const responseUrl = response.config?.url || '';
    if (['POST', 'PUT', 'DELETE'].includes(method) && !response.config?.skipSuccessToast) {
      const message = response.data?.message || 'Action completed successfully';
      // Avoid showing toast for login/logout/profile-upload since they're handled specifically
      if (
        !responseUrl.endsWith('/login') &&
        !responseUrl.endsWith('/logout') &&
        !responseUrl.endsWith('/refresh') &&
        !responseUrl.endsWith('/upload-profile')
      ) {
        toast.success(message);
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const originalRequest = error.config || {};
    const requestUrl = originalRequest.url || '';
    const isRefreshRequest = requestUrl.endsWith('/refresh') || requestUrl.endsWith('/auth/refresh');

    if (status === 401 && code === 'TOKEN_EXPIRED' && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post('/auth/refresh')
          .then((res) => {
            const payload = res?.data?.data || {};
            const nextToken = payload?.token || payload?.accessToken;
            persistToken(nextToken);
            persistSession(payload);
            return payload;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      return refreshPromise
        .then((payload) => {
          const nextToken =
            payload?.token ||
            payload?.accessToken ||
            localStorage.getItem('token') ||
            localStorage.getItem('authToken');

          if (nextToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          }

          return axiosClient(originalRequest);
        })
        .catch((refreshError) => {
          clearPersistedAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        });
    }

    if (status === 401) {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        clearPersistedAuth();
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
