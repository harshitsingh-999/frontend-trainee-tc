import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:7357/api/v1",
  withCredentials: true,
  timeout: 10000
});

export default api;