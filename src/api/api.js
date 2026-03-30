// import axios from "axios";
import axiosClient from "./axiosClient";


const api = axiosClient;
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
//   withCredentials: true,
//   timeout: 10000,
// });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── User endpoints ──────────────────────────────────────────────────────────

/** Fetch all users */
export const getUsers = (params = {}) =>
  api.get("/admin/users", {
    params: {
      page: 1,
      limit: 50,
      ...params,
    },
  });

/** Create a new user */
export const createUser = async (data) => {
  try {
    return await api.post("/admin/users", data);
  } catch (error) {
    if (error?.response?.status === 404) {
      return api.post("/users", data);
    }
    throw error;
  }
};

/** Update user details */
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

/** Toggle active / inactive status */
export const toggleUserStatus = async (id, isActive) => {
  const payloadAdmin = { is_active: isActive ? 1 : 0 };
  const payloadStatus = { isActive };

  try {
    return await api.put(`/admin/users/${id}`, payloadAdmin);
  } catch (firstError) {
    if (firstError?.response?.status !== 404) throw firstError;
  }

  try {
    return await api.patch(`/users/${id}/status`, payloadStatus);
  } catch (secondError) {
    if (secondError?.response?.status !== 404) throw secondError;
  }

  return api.put(`/admin/users/${id}/status`, payloadAdmin);
};

// ── Auth endpoints ──────────────────────────────────────────────────────────

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

export const logoutUser = () => api.post("/auth/logout");

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (token, password) =>
  api.post("/auth/reset-password", { token, password });

export const uploadInternDocument = (formData) =>
  api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const submitDailyReport = (data) => api.post('/intern/daily-report', data);
export const getMyDailyReports = () => api.get('/intern/daily-reports');
export const getInternDailyReports = () => api.get('/manager/daily-reports');
export const acknowledgeDailyReport = (id) => api.patch(`/manager/daily-reports/${id}/acknowledge`);

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const getNotificationDetail = (id) => api.get(`/notifications/${id}`);

export const getMyDocuments = () => api.get('/documents/my');
export const getAllDocuments = (status) => api.get('/documents/all', { params: { status } });
export const reviewDocument = (id, data) => api.patch(`/documents/${id}/review`, data);

export default api;



