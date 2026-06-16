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
  delete: (id) => api.delete(`/api/users/${id}`),
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
    `${BASE_URL}/api/documents/${id}/preview?token=${encodeURIComponent(localStorage.getItem("mde_token") || "")}`,
  downloadUrl: (id) =>
    `${BASE_URL}/api/documents/${id}/download?token=${encodeURIComponent(localStorage.getItem("mde_token") || "")}`,
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

export const TasksAPI = {
  list: () => api.get("/api/tasks"),
  create: (data) => api.post("/api/tasks", data),
  update: (id, data) => api.patch(`/api/tasks/${id}/assign`, data),
  assign: (id, data) => api.patch(`/api/tasks/${id}/assign`, data),
  updateDetails: (id, data) => api.patch(`/api/tasks/${id}`, data),
  selfAssign: (id) => api.patch(`/api/tasks/${id}/self-assign`),
  updateStatus: (id, data) => api.patch(`/api/tasks/${id}/status`, data),
  restore: (id) => api.patch(`/api/tasks/${id}/restore`),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  // New attachments & review endpoints
  uploadAttachment: (id, formData) =>
    api.post(`/api/tasks/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAttachments: (id) => api.get(`/api/tasks/${id}/attachments`),
  deleteAttachment: (attachmentId) => api.delete(`/api/tasks/attachments/${attachmentId}`),
  submitForReview: (id, data) => api.patch(`/api/tasks/${id}/submit`, data),
  reviewTask: (id, data) => api.patch(`/api/tasks/${id}/review`, data),
  downloadAttachmentUrl: (attachmentId) =>
    `${BASE_URL}/api/tasks/attachments/${attachmentId}/download?token=${encodeURIComponent(localStorage.getItem("mde_token") || "")}`,
  previewAttachmentUrl: (attachmentId) =>
    `${BASE_URL}/api/tasks/attachments/${attachmentId}/preview?token=${encodeURIComponent(localStorage.getItem("mde_token") || "")}`,
};

export const ProjectsAPI = {
  list: () => api.get("/api/projects"),
  create: (data) => api.post("/api/projects", data),
  update: (id, data) => api.patch(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  getAttachments: (id) => api.get(`/api/projects/${id}/attachments`),
};

export const NotificationsAPI = {
  list: () => api.get("/api/notifications"),
  read: (id) => api.patch(`/api/notifications/${id}/read`),
  readAll: () => api.patch("/api/notifications/read-all"),
};

export const GovScribeAPI = {
  generate: (data) => api.post("/api/govscribe/generate", data),
  improve: (data) => api.post("/api/govscribe/improve", data),
  audit: (data) => api.post("/api/govscribe/audit", data),
  getDraft: () => api.get("/api/govscribe/draft"),
  saveDraft: (data) => api.post("/api/govscribe/draft", data),
  exportPDF: (data) => api.post("/api/govscribe/export-pdf", data, { responseType: "blob" }),
};

export default api;

