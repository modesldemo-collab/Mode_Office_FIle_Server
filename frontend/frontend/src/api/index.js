import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("mde_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const Auth = {
  login: (data) => api.post("/api/auth/login", data),
  register: (data) => api.post("/api/auth/register", data),
  me:    ()     => api.get("/api/auth/me"),
  changePassword: (data) => api.post("/api/auth/change-password", data),
  shareUsers: () => api.get("/api/auth/share-users"),
};

export const Departments = {
  list:   ()         => api.get("/api/departments"),
  create: (data)     => api.post("/api/departments", data),
  update: (id, data) => api.put(`/api/departments/${id}`, data),
  delete: (id)       => api.delete(`/api/departments/${id}`),
};

export const UsersAPI = {
  list:   ()         => api.get("/api/users"),
  create: (data)     => api.post("/api/users", data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  changePassword: (id, data) => api.put(`/api/users/${id}/password`, data),
};

export const PersonsAPI = {
  list:   ()     => api.get("/api/persons"),
  create: (data) => api.post("/api/persons", data),
  delete: (id)   => api.delete(`/api/persons/${id}`),
};

export const DocsAPI = {
  list:   (params) => api.get("/api/documents", { params }),
  get:    (id)     => api.get(`/api/documents/${id}`),
  upload: (formData) =>
    api.post("/api/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => api.put(`/api/documents/${id}`, data),
  delete: (id) => api.delete(`/api/documents/${id}`),
  listShares: (id) => api.get(`/api/documents/${id}/shares`),
  share: (id, data) => api.post(`/api/documents/${id}/share`, data),
  unshare: (id, userId) => api.delete(`/api/documents/${id}/share/${userId}`),
  previewUrl:  (id) =>
    `${BASE_URL}/api/documents/${id}/preview?token=${localStorage.getItem("mde_token")}`,
  downloadUrl: (id) =>
    `${BASE_URL}/api/documents/${id}/download?token=${localStorage.getItem("mde_token")}`,
};

export const LogsAPI = {
  list:   (params) => api.get("/api/logs", { params }),
  forDoc: (docId)  => api.get(`/api/logs/${docId}`),
  exportExcel: () => {
    const token = localStorage.getItem("mde_token");
    window.open(`${BASE_URL}/api/export/logs/excel?token=${token}`, "_blank");
  },
  exportPdf: () => {
    const token = localStorage.getItem("mde_token");
    window.open(`${BASE_URL}/api/export/logs/pdf?token=${token}`, "_blank");
  },
};

export const StatsAPI = {
  get: () => api.get("/api/stats"),
};

export default api;
