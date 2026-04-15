/**
 * ============================================================
 * FILE MANAGEMENT SYSTEM — FRONTEND
 * Ministry of Digital Economy, Sri Lanka
 * App.jsx — All UI in one file
 * ============================================================
 * Sections (ctrl+f to jump):
 *  § API          — axios helper & all API calls
 *  § AUTH         — login page + context
 *  § LAYOUT       — shell, sidebar, topbar
 *  § DASHBOARD    — stats overview
 *  § DOCUMENTS    — list, upload modal, edit modal, preview
 *  § LOGS         — audit table (TanStack Table)
 *  § ADMIN        — users, departments, persons panels
 *  § APP          — router & entry point
 * ============================================================
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  Building2,
  UserCheck,
  LogOut,
  Upload,
  Search,
  Filter,
  Eye,
  Download,
  Pencil,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckCircle2,
  Clock,
  FileImage,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  File,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Menu,
  XCircle,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// § API
// ═══════════════════════════════════════════════════════════════
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("mde_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const Auth = {
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

const Departments = {
  list: () => api.get("/api/departments"),
  create: (data) => api.post("/api/departments", data),
  update: (id, data) => api.put(`/api/departments/${id}`, data),
  delete: (id) => api.delete(`/api/departments/${id}`),
};

const UsersAPI = {
  list: () => api.get("/api/users"),
  create: (data) => api.post("/api/users", data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
};

const PersonsAPI = {
  list: () => api.get("/api/persons"),
  create: (data) => api.post("/api/persons", data),
  delete: (id) => api.delete(`/api/persons/${id}`),
};

const DocsAPI = {
  list: (params) => api.get("/api/documents", { params }),
  get: (id) => api.get(`/api/documents/${id}`),
  upload: (formData) =>
    api.post("/api/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => api.put(`/api/documents/${id}`, data),
  delete: (id) => api.delete(`/api/documents/${id}`),
  previewUrl: (id) => `${BASE_URL}/api/documents/${id}/preview`,
  downloadUrl: (id) => `${BASE_URL}/api/documents/${id}/download`,
};

const LogsAPI = {
  list: (params) => api.get("/api/logs", { params }),
  forDoc: (docId) => api.get(`/api/logs/${docId}`),
  exportExcel: () =>
    window.open(`${BASE_URL}/api/export/logs/excel?token=${localStorage.getItem("mde_token")}`),
  exportPdf: () =>
    window.open(`${BASE_URL}/api/export/logs/pdf?token=${localStorage.getItem("mde_token")}`),
};

const StatsAPI = { get: () => api.get("/api/stats") };

// ═══════════════════════════════════════════════════════════════
// § AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mde_token");
    if (token) {
      Auth.me()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem("mde_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await Auth.login({ email, password });
    localStorage.setItem("mde_token", r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem("mde_token");
    setUser(null);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// § LOGIN PAGE
// ═══════════════════════════════════════════════════════════════
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,#0ff1 40px,#0ff1 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#0ff1 40px,#0ff1 41px)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ministry of Digital Economy
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            File Management System — Sri Lanka
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            Sign in to your account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="you@mde.gov.lk"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs mt-4">
          © 2025 Ministry of Digital Economy, Sri Lanka. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "final"
          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
          : "bg-amber-900/40 text-amber-400 border border-amber-800/50"
      }`}
    >
      {status === "final" ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      {status === "final" ? "Final" : "Draft"}
    </span>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full ${
          wide ? "max-w-4xl" : "max-w-lg"
        } max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

function FileIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(t))
    return <FileImage className="w-5 h-5 text-pink-400" />;
  if (["mp3", "wav", "ogg", "aac"].includes(t))
    return <FileAudio className="w-5 h-5 text-purple-400" />;
  if (["xlsx", "xls", "csv"].includes(t))
    return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  if (["pptx", "ppt"].includes(t))
    return <Presentation className="w-5 h-5 text-orange-400" />;
  if (["pdf"].includes(t))
    return <FileText className="w-5 h-5 text-red-400" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

function formatBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

function ActionBadge({ action }) {
  const map = {
    UPLOAD: "bg-blue-900/40 text-blue-400 border-blue-800/50",
    UPDATE_METADATA: "bg-purple-900/40 text-purple-400 border-purple-800/50",
    STATUS_CHANGE: "bg-amber-900/40 text-amber-400 border-amber-800/50",
    DELETE: "bg-red-900/40 text-red-400 border-red-800/50",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
        map[action] || "bg-slate-800 text-slate-400 border-slate-700"
      }`}
    >
      {action}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// § LAYOUT — Sidebar + Shell
// ═══════════════════════════════════════════════════════════════
const NavCtx = createContext(null);

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "logs", label: "Audit Logs", icon: ScrollText },
];
const ADMIN_NAV = [
  { id: "users", label: "Users", icon: Users },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "persons", label: "Resp. Persons", icon: UserCheck },
];

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { page, setPage } = useContext(NavCtx);

  const NavBtn = ({ item }) => (
    <button
      onClick={() => { setPage(item.id); onClose?.(); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        page === item.id
          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </button>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">MDE·LK</p>
            <p className="text-slate-500 text-xs">File Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavBtn key={item.id} item={item} />
        ))}
        {user?.role === "admin" && (
          <>
            <div className="pt-4 pb-1 px-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Administration
              </p>
            </div>
            {ADMIN_NAV.map((item) => (
              <NavBtn key={item.id} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className="text-slate-500 text-xs truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { page } = useContext(NavCtx);

  const labels = {
    dashboard: "Dashboard",
    documents: "Documents",
    logs: "Audit Logs",
    users: "User Management",
    departments: "Departments",
    persons: "Responsible Persons",
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:pl-64">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main */}
      <div className="flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold">{labels[page] || page}</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § DASHBOARD
// ═══════════════════════════════════════════════════════════════
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? "—"}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    StatsAPI.get().then((r) => setStats(r.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={stats?.totalDocs} icon={FileText} color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard label="Active Users" value={stats?.totalUsers} icon={Users} color="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard label="Departments" value={stats?.totalDepts} icon={Building2} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="Actions Today" value={stats?.logsToday} icon={ScrollText} color="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* By Dept */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Documents by Department</h3>
          <div className="space-y-3">
            {(stats?.byDept || []).map((d) => (
              <div key={d.dept_name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{d.dept_name || "Unassigned"}</span>
                    <span className="text-slate-400">{d.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (d.count / (stats?.totalDocs || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!stats?.byDept?.length && (
              <p className="text-slate-500 text-sm">No data yet</p>
            )}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Document Status</h3>
          <div className="flex gap-6 items-center justify-center h-32">
            {(stats?.byStatus || []).map((s) => (
              <div key={s.status} className="text-center">
                <p className="text-4xl font-bold text-white">{s.count}</p>
                <Badge status={s.status} />
              </div>
            ))}
            {!stats?.byStatus?.length && (
              <p className="text-slate-500 text-sm">No documents yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § UPLOAD MODAL
// ═══════════════════════════════════════════════════════════════
function UploadModal({ open, onClose, onSuccess, departments, persons }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [deptId, setDeptId] = useState(user?.dept_id || "");
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [status, setStatus] = useState("draft");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const reset = () => {
    setFile(null); setDocName(""); setDeptId(user?.dept_id || "");
    setSelectedPersons([]); setStatus("draft"); setProgress(0); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!docName) setDocName(f.name); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); if (!docName) setDocName(f.name); }
  };

  const togglePerson = (id) =>
    setSelectedPersons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    if (!file) return setError("Please select a file");
    if (!docName.trim()) return setError("Document name is required");
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doc_name", docName);
      fd.append("dept_id", deptId || "");
      fd.append("responsible_persons", JSON.stringify(selectedPersons));
      fd.append("status", status);

      await api.post("/api/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upload Document">
      <div className="space-y-5">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-slate-700 hover:border-slate-500 bg-slate-800/40"
          }`}
        >
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileIcon type={file.name.split(".").pop()} />
              <div className="text-left">
                <p className="text-white font-medium text-sm">{file.name}</p>
                <p className="text-slate-400 text-xs">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-2 text-slate-500 hover:text-red-400"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 text-sm font-medium">
                Drag & drop or click to select
              </p>
              <p className="text-slate-500 text-xs mt-1">
                PDF, DOCX, XLSX, PPT, Images, Audio — up to 200 MB
              </p>
            </>
          )}
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Doc Name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Document Name *
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Annual Budget Report 2025"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Department
          </label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">— Select Department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.dept_name}</option>
            ))}
          </select>
        </div>

        {/* Responsible Persons */}
        {persons.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Responsible Persons (optional)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              {persons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePerson(p.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedPersons.includes(p.id)
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Status
          </label>
          <div className="flex gap-3">
            {["draft", "final"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  status === s
                    ? s === "final"
                      ? "bg-emerald-900/40 text-emerald-400 border-emerald-800/50"
                      : "bg-amber-900/40 text-amber-400 border-amber-800/50"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                {s === "final" ? "✓ Final" : "✎ Draft"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? `Uploading… ${progress}%` : "Upload Document"}
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// § EDIT MODAL
// ═══════════════════════════════════════════════════════════════
function EditModal({ open, onClose, onSuccess, doc, departments, persons }) {
  const [docName, setDocName] = useState("");
  const [deptId, setDeptId] = useState("");
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (doc) {
      setDocName(doc.doc_name || "");
      setDeptId(doc.dept_id || "");
      setStatus(doc.status || "draft");
      try {
        const rp = typeof doc.responsible_persons === "string"
          ? JSON.parse(doc.responsible_persons)
          : doc.responsible_persons || [];
        setSelectedPersons(rp);
      } catch { setSelectedPersons([]); }
    }
  }, [doc]);

  const togglePerson = (id) =>
    setSelectedPersons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!docName.trim()) return setError("Name required");
    setError(""); setLoading(true);
    try {
      await DocsAPI.update(doc.id, {
        doc_name: docName,
        dept_id: deptId || null,
        responsible_persons: JSON.stringify(selectedPersons),
        status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Update failed");
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Document Metadata">
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Document Name *</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Department</label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">— Select Department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.dept_name}</option>
            ))}
          </select>
        </div>
        {persons.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Responsible Persons</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              {persons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePerson(p.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedPersons.includes(p.id)
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "bg-slate-700 text-slate-400 border border-slate-600"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Status</label>
          <div className="flex gap-3">
            {["draft", "final"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  status === s
                    ? s === "final"
                      ? "bg-emerald-900/40 text-emerald-400 border-emerald-800/50"
                      : "bg-amber-900/40 text-amber-400 border-amber-800/50"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {s === "final" ? "✓ Final" : "✎ Draft"}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</div>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// § PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════
function PreviewModal({ open, onClose, doc }) {
  if (!doc) return null;
  const type = (doc.file_type || "").toLowerCase();
  const url = DocsAPI.previewUrl(doc.id);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type);
  const isPdf = type === "pdf";

  return (
    <Modal open={open} onClose={onClose} title={doc.doc_name} wide>
      <div className="flex flex-col items-center gap-4">
        {isPdf && (
          <iframe
            src={`${url}#toolbar=1`}
            className="w-full h-[70vh] rounded-lg border border-slate-700 bg-white"
            title="PDF Preview"
          />
        )}
        {isImage && (
          <img
            src={url}
            alt={doc.doc_name}
            className="max-h-[70vh] rounded-lg object-contain border border-slate-700"
          />
        )}
        {!isPdf && !isImage && (
          <div className="text-center py-16 text-slate-400">
            <File className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="font-medium text-white">{doc.file_name}</p>
            <p className="text-sm mt-1">Preview not available for this file type</p>
            <a
              href={DocsAPI.downloadUrl(doc.id)}
              className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Download to view
            </a>
          </div>
        )}
        {(isPdf || isImage) && (
          <a
            href={DocsAPI.downloadUrl(doc.id)}
            download
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        )}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// § DOC LOGS MODAL (per-document history)
// ═══════════════════════════════════════════════════════════════
function DocLogsModal({ open, onClose, docId }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (open && docId) {
      LogsAPI.forDoc(docId).then((r) => setLogs(r.data));
    }
  }, [open, docId]);

  return (
    <Modal open={open} onClose={onClose} title="Document History" wide>
      <div className="space-y-2">
        {logs.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No history found</p>
        )}
        {logs.map((l) => (
          <div key={l.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <ActionBadge action={l.action_type} />
              <span className="text-slate-300 text-sm font-medium">{l.editor_name || "Unknown"}</span>
              <span className="text-slate-500 text-xs">{formatDate(l.changed_at)}</span>
            </div>
            {(l.old_value || l.new_value) && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                {l.old_value && (
                  <div>
                    <p className="text-slate-500 mb-1">Before</p>
                    <pre className="bg-slate-900 rounded-lg p-2 text-red-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(l.old_value, null, 2)}
                    </pre>
                  </div>
                )}
                {l.new_value && (
                  <div>
                    <p className="text-slate-500 mb-1">After</p>
                    <pre className="bg-slate-900 rounded-lg p-2 text-emerald-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(l.new_value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// § DOCUMENTS PAGE
// ═══════════════════════════════════════════════════════════════
function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [logsDocId, setLogsDocId] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await DocsAPI.list({
        search, dept_id: filterDept, status: filterStatus,
        from_date: fromDate, to_date: toDate, page, limit,
      });
      setDocs(r.data.data);
      setTotal(r.data.total);
    } finally { setLoading(false); }
  }, [search, filterDept, filterStatus, fromDate, toDate, page]);

  useEffect(() => {
    Departments.list().then((r) => setDepartments(r.data));
    PersonsAPI.list().then((r) => setPersons(r.data));
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this document? This action is logged.")) return;
    await DocsAPI.delete(id);
    fetchDocs();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.dept_name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => { setSearch(""); setFilterDept(""); setFilterStatus(""); setFromDate(""); setToDate(""); }}
          className="text-slate-400 hover:text-white p-2.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
          title="Clear filters"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Document</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Size</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Uploaded</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading…</td></tr>
              )}
              {!loading && docs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No documents found</td></tr>
              )}
              {!loading && docs.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileIcon type={doc.file_type} />
                      <div>
                        <p className="text-white font-medium leading-tight">{doc.doc_name}</p>
                        <p className="text-slate-500 text-xs">{doc.file_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{doc.dept_name || "—"}</td>
                  <td className="px-4 py-3"><Badge status={doc.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400">{doc.uploader_name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={DocsAPI.downloadUrl(doc.id)}
                        download
                        className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setEditDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
                        title="Edit metadata"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLogsDocId(doc.id)}
                        className="p-1.5 text-slate-500 hover:text-violet-400 rounded-lg hover:bg-violet-500/10 transition-all"
                        title="View history"
                      >
                        <ScrollText className="w-4 h-4" />
                      </button>
                      {(user?.role === "admin" || doc.uploader_id === user?.id) && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-slate-500 text-sm">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={fetchDocs}
        departments={departments}
        persons={persons}
      />
      <EditModal
        open={!!editDoc}
        onClose={() => setEditDoc(null)}
        onSuccess={fetchDocs}
        doc={editDoc}
        departments={departments}
        persons={persons}
      />
      <PreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />
      <DocLogsModal
        open={!!logsDocId}
        onClose={() => setLogsDocId(null)}
        docId={logsDocId}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § AUDIT LOGS PAGE (TanStack Table)
// ═══════════════════════════════════════════════════════════════
function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await LogsAPI.list({
        action_type: actionFilter, from_date: fromDate,
        to_date: toDate, page, limit,
      });
      setLogs(r.data.data);
      setTotal(r.data.total);
    } finally { setLoading(false); }
  }, [actionFilter, fromDate, toDate, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columnHelper = createColumnHelper();
  const columns = [
    columnHelper.accessor("id", { header: "ID", size: 60, cell: (i) => <span className="text-slate-500 text-xs">#{i.getValue()}</span> }),
    columnHelper.accessor("doc_name", { header: "Document", cell: (i) => <span className="text-white font-medium">{i.getValue() || "—"}</span> }),
    columnHelper.accessor("editor_name", { header: "Edited By", cell: (i) => <span className="text-slate-300">{i.getValue() || "—"}</span> }),
    columnHelper.accessor("action_type", { header: "Action", cell: (i) => <ActionBadge action={i.getValue()} /> }),
    columnHelper.accessor("old_value", {
      header: "Old Value",
      cell: (i) => (
        <pre className="text-xs text-red-300/70 max-w-xs truncate">
          {i.getValue() ? JSON.stringify(i.getValue()) : "—"}
        </pre>
      ),
    }),
    columnHelper.accessor("new_value", {
      header: "New Value",
      cell: (i) => (
        <pre className="text-xs text-emerald-300/70 max-w-xs truncate">
          {i.getValue() ? JSON.stringify(i.getValue()) : "—"}
        </pre>
      ),
    }),
    columnHelper.accessor("changed_at", {
      header: "Timestamp",
      cell: (i) => <span className="text-slate-400 text-xs whitespace-nowrap">{formatDate(i.getValue())}</span>,
    }),
  ];

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Actions</option>
          <option value="UPLOAD">UPLOAD</option>
          <option value="UPDATE_METADATA">UPDATE_METADATA</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500" />
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => window.open(`${BASE_URL}/api/export/logs/excel`, "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-400 text-sm font-medium rounded-xl border border-emerald-700/50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => window.open(`${BASE_URL}/api/export/logs/pdf`, "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-700/30 hover:bg-red-700/50 text-red-400 text-sm font-medium rounded-xl border border-red-700/50 transition-colors"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* TanStack Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-800 bg-slate-950/50">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left px-4 py-3 text-slate-400 font-medium cursor-pointer select-none"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : h.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">Loading…</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">No logs found</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <p className="text-slate-500 text-sm">Total: {total} entries</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-sm">Page {page} / {Math.ceil(total / limit) || 1}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § ADMIN — USERS
// ═══════════════════════════════════════════════════════════════
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", password: "", dept_id: "", role: "user", is_active: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = () => {
    UsersAPI.list().then((r) => setUsers(r.data));
    Departments.list().then((r) => setDepartments(r.data));
  };
  useEffect(fetchAll, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: "", email: "", password: "", dept_id: "", role: "user", is_active: 1 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, password: "", dept_id: u.dept_id || "", role: u.role, is_active: u.is_active });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError(""); setLoading(true);
    try {
      if (editUser) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await UsersAPI.update(editUser.id, payload);
      } else {
        await UsersAPI.create(form);
      }
      fetchAll();
      setModalOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50">
              {["Username", "Email", "Department", "Role", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                <td className="px-4 py-3 text-slate-400">{u.email}</td>
                <td className="px-4 py-3 text-slate-400">{u.dept_name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    u.role === "admin"
                      ? "bg-violet-900/40 text-violet-400 border-violet-800/50"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${u.is_active ? "bg-emerald-400" : "bg-slate-600"}`} />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(u)} className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? "Edit User" : "Add User"}>
        <div className="space-y-4">
          {[
            { label: "Username", key: "username", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: editUser ? "New Password (leave blank to keep)" : "Password", key: "password", type: "password" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
            <select value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.dept_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Active</label>
              <select value={form.is_active} onChange={(e) => setForm({ ...form, is_active: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleSave} disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § ADMIN — DEPARTMENTS
// ═══════════════════════════════════════════════════════════════
function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDepts = () => Departments.list().then((r) => setDepts(r.data));
  useEffect(fetchDepts, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await Departments.create({ dept_name: name });
    setName("");
    fetchDepts();
    setLoading(false);
  };

  const handleUpdate = async (id) => {
    await Departments.update(id, { dept_name: editName });
    setEditId(null);
    fetchDepts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department?")) return;
    await Departments.delete(id);
    fetchDepts();
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New department name"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
        <button onClick={handleCreate} disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {depts.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-10">No departments yet</p>
        )}
        {depts.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
            <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
            {editId === d.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
                <button onClick={() => handleUpdate(d.id)} className="text-cyan-400 text-sm font-medium">Save</button>
                <button onClick={() => setEditId(null)} className="text-slate-500 text-sm">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-white">{d.dept_name}</span>
                <button onClick={() => { setEditId(d.id); setEditName(d.dept_name); }}
                  className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(d.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § ADMIN — RESPONSIBLE PERSONS
// ═══════════════════════════════════════════════════════════════
function PersonsPage() {
  const [persons, setPersons] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", dept_id: "" });
  const [loading, setLoading] = useState(false);

  const fetchAll = () => {
    PersonsAPI.list().then((r) => setPersons(r.data));
    Departments.list().then((r) => setDepartments(r.data));
  };
  useEffect(fetchAll, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await PersonsAPI.create(form);
    setForm({ name: "", email: "", dept_id: "" });
    setModalOpen(false);
    fetchAll();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this person?")) return;
    await PersonsAPI.delete(id);
    fetchAll();
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {persons.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-10">No persons added yet</p>
        )}
        {persons.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
            <UserCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{p.name}</p>
              {p.email && <p className="text-slate-500 text-xs">{p.email}</p>}
            </div>
            <span className="text-slate-500 text-xs">{p.dept_name || "—"}</span>
            <button onClick={() => handleDelete(p.id)}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Responsible Person">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
            <select value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.dept_name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {loading ? "Saving…" : "Add Person"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// § APP — Main Router
// ═══════════════════════════════════════════════════════════════
function AppRouter() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!user) return <LoginPage />;

  const PageContent = {
    dashboard: Dashboard,
    documents: DocumentsPage,
    logs: LogsPage,
    users: UsersPage,
    departments: DepartmentsPage,
    persons: PersonsPage,
  }[page] || Dashboard;

  return (
    <NavCtx.Provider value={{ page, setPage }}>
      <Shell>
        <PageContent />
      </Shell>
    </NavCtx.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}