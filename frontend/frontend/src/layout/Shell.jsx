import React, { useEffect, useState, useContext } from "react";
import { Bell, Menu, Moon, Sun, Search, Mail, SlidersHorizontal } from "lucide-react";
import { Sidebar, NavCtx } from "./Sidebar";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { NotificationsAPI } from "../api";

export function Shell({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { page, setPage } = useContext(NavCtx);
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const labels = {
    dashboard:          "Dashboard",
    documents:          "Documents",
    tasks:              "Task Management",
    completedTasks:     "Completed Tasks",
    completedDocuments: "Completed Documents",
    govscribe:          "GovScribe Hub",
    logs:               "Audit Logs",
    users:              "User Management",
    departments:        "Departments",
  };

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const r = await NotificationsAPI.list();
        if (!active) return;
        setNotifications(r.data?.data || []);
        setUnreadCount(r.data?.unread_count || 0);
      } catch {
        if (active) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [page]);

  const openNotification = async (notification) => {
    try {
      if (!notification.is_read) {
        await NotificationsAPI.read(notification.id);
      }
    } finally {
      setNotificationsOpen(false);
      if (notification.link) {
        setPage(notification.link);
      }
    }
  };

  return (
    <div className="print:pl-0 min-h-screen bg-[var(--bg-main)] lg:pl-64 transition-colors duration-300 relative overflow-hidden z-10">
      {/* Floating blurred gradient blobs to create Glassmorphism backdrop */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb-blob w-[450px] h-[450px] -left-40 top-[20%] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 animate-float" />
        <div className="orb-blob w-[550px] h-[550px] -right-20 -top-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500" style={{ animationDelay: '-5s' }} />
        <div className="orb-blob w-[250px] h-[250px] right-[12%] top-[45%] bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500" style={{ animationDelay: '-10s' }} />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-col min-h-screen relative z-10">
        <header className="print:hidden sticky top-0 z-20 bg-white/10 dark:bg-black/10 border-b border-white/20 px-6 py-4 flex items-center gap-6 transition-colors duration-300 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className="text-[var(--text-main)] font-extrabold text-lg tracking-tight">{labels[page] || page}</h1>

          <div className="hidden md:flex items-center gap-2 bg-white/35 dark:bg-white/5 border border-white/40 rounded-full pl-4 pr-2 py-1 w-64 lg:w-80 shadow-sm transition-all focus-within:border-indigo-500/50 backdrop-blur-sm">
            <Search className="w-3.5 h-3.5 text-[var(--text-soft)]" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none text-xs text-[var(--text-main)] placeholder-[var(--text-soft)] focus:outline-none w-full"
            />
            <button className="text-[var(--text-muted)] hover:text-indigo-600 transition-colors p-1 flex-shrink-0 flex items-center gap-1">
              <span className="text-[10px] font-bold text-[var(--text-soft)]">Filter</span>
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>

          <div className="relative ml-auto flex items-center gap-3">
            <button
              onClick={() => setNotificationsOpen((v) => !v)}
              className="relative p-2.5 rounded-full border border-white/30 bg-white/20 dark:bg-white/5 text-[var(--text-muted)] hover:text-indigo-600 transition-colors shadow-sm backdrop-blur-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              className="p-2.5 rounded-full border border-white/30 bg-white/20 dark:bg-white/5 text-[var(--text-muted)] hover:text-indigo-600 transition-colors shadow-sm backdrop-blur-sm"
              title="Messages"
            >
              <Mail className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border border-white/30 bg-white/20 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shadow-sm backdrop-blur-sm"
              title="Switch theme"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 border border-white/40 flex items-center justify-center text-white text-sm font-bold shadow-sm" title={user?.username}>
              {user?.username?.[0]?.toUpperCase()}
            </div>

            {notificationsOpen && (
              <div className="fixed left-4 right-4 top-16 max-h-[calc(100vh-5rem)] rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden z-40 sm:left-auto sm:right-4 sm:w-96 lg:absolute lg:top-full lg:right-0 lg:left-auto lg:mt-2 lg:w-96">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
                  <div>
                    <p className="text-[var(--text-main)] font-semibold text-sm">Notifications</p>
                    <p className="text-[var(--text-soft)] text-xs">Unread items are highlighted below.</p>
                  </div>
                  <button
                    onClick={async () => {
                      await NotificationsAPI.readAll();
                      const r = await NotificationsAPI.list();
                      setNotifications(r.data?.data || []);
                      setUnreadCount(r.data?.unread_count || 0);
                    }}
                    className="text-xs text-indigo-600 dark:text-cyan-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto lg:max-h-96">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-[var(--text-soft)]">No notifications yet.</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={async () => {
                          await openNotification(notification);
                          const r = await NotificationsAPI.list();
                          setNotifications(r.data?.data || []);
                          setUnreadCount(r.data?.unread_count || 0);
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-white/10 transition-colors ${
                          notification.is_read ? "bg-transparent hover:bg-white/20" : "bg-indigo-500/10 hover:bg-indigo-500/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 w-2 h-2 rounded-full ${notification.is_read ? "bg-slate-300" : "bg-indigo-500"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[var(--text-main)] truncate">{notification.title}</p>
                              <span className="text-[9px] uppercase tracking-wider text-[var(--text-soft)]">
                                {notification.is_read ? "Read" : "Unread"}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-soft)] mt-1 line-clamp-2">{notification.body}</p>
                            <p className="text-[10px] text-[var(--text-soft)] mt-2">{notification.created_at}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="print:p-0 flex-1 p-6 relative z-10">{children}</main>
      </div>
    </div>
  );
}
