import React, { createContext } from "react";
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  Building2,
  UserCheck,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const NavCtx = createContext(null);

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { id: "documents", label: "Documents",  icon: FileText },
  { id: "logs",      label: "Audit Logs", icon: ScrollText },
];

export const ADMIN_NAV = [
  { id: "users",       label: "Users",         icon: Users },
  { id: "departments", label: "Departments",    icon: Building2 },
  { id: "persons",     label: "Resp. Persons",  icon: UserCheck },
];

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { page, setPage } = React.useContext(NavCtx);

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
