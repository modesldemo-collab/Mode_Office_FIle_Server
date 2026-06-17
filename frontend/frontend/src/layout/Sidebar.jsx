import React, { createContext } from "react";
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  CheckCheck,
  ScrollText,
  Users,
  Building2,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/Modal";

export const NavCtx = createContext(null);

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "tasks", label: "Projects", icon: ListChecks },
  { id: "govscribe", label: "GovScribe", icon: Sparkles },
];

export const ADMIN_NAV = [
  { id: "users", label: "Users", icon: Users },
  { id: "departments", label: "Departments", icon: Building2 },
];

export function Sidebar({ open, onClose }) {
  const { user, logout, changePassword } = useAuth();
  const { page, setPage } = React.useContext(NavCtx);
  const [pwdOpen, setPwdOpen] = React.useState(false);
  const [currentPwd, setCurrentPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [pwdLoading, setPwdLoading] = React.useState(false);
  const [pwdError, setPwdError] = React.useState("");
  const [pwdSuccess, setPwdSuccess] = React.useState("");

  const resetPwdForm = () => {
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdError("");
    setPwdSuccess("");
  };

  const handleChangePassword = async () => {
    setPwdError("");
    setPwdSuccess("");

    if (!currentPwd || !newPwd) {
      setPwdError("Current and new password are required");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match");
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd);
      setPwdSuccess("Password changed successfully");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdError(err?.response?.data?.error || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  const NavBtn = ({ item }) => (
    <button
      onClick={() => { setPage(item.id); onClose?.(); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${page === item.id
          ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/10"
          : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
    >
      <item.icon className={`w-4 h-4 flex-shrink-0 ${page === item.id ? "text-white" : "text-slate-400"}`} />
      {item.label}
    </button>
  );

  return (
    <aside
      className={`print:hidden fixed inset-y-0 left-0 z-40 w-64 bg-[#090d16] border-r border-slate-800/40 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
    >
      <div className="p-5 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10">
            <img src="/emblem.svg" alt="Sri Lanka National Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white text-[12px] font-bold leading-tight whitespace-nowrap">Ministry of Digital Economy</p>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold" style={{ fontSize: '9px' }}>File Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavBtn key={item.id} item={item} />
        ))}
        {user?.role === "admin" && (
          <>
            <NavBtn item={{ id: "logs", label: "Audit Logs", icon: ScrollText }} />
            <div className="pt-4 pb-1 px-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Administration
              </p>
            </div>
            {ADMIN_NAV.map((item) => (
              <NavBtn key={item.id} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-slate-800/40">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.username}</p>
            <p className="text-slate-400 text-xs truncate capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-400 transition-colors p-1 hover:bg-white/5 rounded-lg"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => {
            resetPwdForm();
            setPwdOpen(true);
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white border border-slate-800 hover:bg-white/5 rounded-lg py-2 transition-all"
        >
          <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Change Password
        </button>
      </div>

      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          {pwdError && <p className="text-red-400 text-sm">{pwdError}</p>}
          {pwdSuccess && <p className="text-emerald-400 text-sm">{pwdSuccess}</p>}
          <button
            onClick={handleChangePassword}
            disabled={pwdLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {pwdLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </Modal>
    </aside>
  );
}
