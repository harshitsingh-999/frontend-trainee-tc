import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  timeout: 10000,
});

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
export const createUser = (data) => api.post("/admin/users", data);

/** Update user details */
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

/** Toggle active / inactive status */
export const toggleUserStatus = (id, isActive) =>
  api.put(`/admin/users/${id}`, { is_active: isActive ? 1 : 0 });

// ── Auth endpoints ──────────────────────────────────────────────────────────

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

export const logoutUser = () => api.post("/auth/logout");

export default api;



//  -------------------------  //



// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
//   withCredentials: true,
//   timeout: 10000
// });

// // Attach token to every request automatically
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // ── 1. Dashboard (auth check)
// export const dashboard = () => api.get('/auth/dashboard');

// // ── 2. Get all users (paginated + search)
// export const getUsers = (page = 1, search = '') =>
//   api.get(`/admin/users?page=${page}&limit=10&search=${search}`);

// // ── 3. Get single user by ID
// export const getUserById = (id) => api.get(`/admin/users/${id}`);

// // ── 4. Create new user
// export const createUser = (data) => api.post('/admin/users', data);

// // ── 5. Update user
// export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

// // ── 6. Deactivate user (set inactive)
// export const deactivateUser = (id) =>
//   api.put(`/admin/users/${id}`, { is_active: 0 });

// // ── 7. Reactivate user (set active)
// export const reactivateUser = (id) =>
//   api.put(`/admin/users/${id}`, { is_active: 1 });

// // ── 8. Assign role to user
// export const assignRole = (id, role_id) =>
//   api.put(`/admin/users/${id}`, { role_id });

// // ── 9. Get all trainees
// export const getTrainees = () => api.get('/interns');

// // ── 10. Get all roles
// export const getRoles = () => api.get('/admin/roles');

// export default api;
