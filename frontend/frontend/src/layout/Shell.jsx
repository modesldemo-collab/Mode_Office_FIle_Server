import React, { useEffect, useState, useContext } from "react";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { Sidebar, NavCtx } from "./Sidebar";
import { useTheme } from "../context/ThemeContext";
import { NotificationsAPI } from "../api";

export function Shell({ children }) {
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
    <div className="min-h-screen bg-[var(--bg-main)] lg:pl-64 transition-colors duration-300">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-[var(--bg-main)]/90 backdrop-blur border-b border-[var(--border-main)] px-4 py-3 flex items-center gap-4 transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-[var(--text-main)] font-semibold">{labels[page] || page}</h1>
          <div className="relative ml-auto flex items-center gap-3">
            <button
              onClick={() => setNotificationsOpen((v) => !v)}
              className="relative flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-cyan-500/50"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="fixed left-4 right-4 top-16 max-h-[calc(100vh-5rem)] rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-2xl shadow-black/30 overflow-hidden z-40 sm:left-auto sm:right-4 sm:w-96 lg:absolute lg:top-full lg:right-0 lg:left-auto lg:mt-2 lg:w-96">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-main)]">
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
                    className="text-xs text-cyan-400 hover:text-cyan-300"
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
                        className={`w-full text-left px-4 py-3 border-b border-[var(--border-main)] transition-colors ${
                          notification.is_read ? "bg-transparent hover:bg-[var(--bg-soft)]/50" : "bg-cyan-500/5 hover:bg-cyan-500/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 w-2.5 h-2.5 rounded-full ${notification.is_read ? "bg-[var(--border-main)]" : "bg-cyan-400"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-[var(--text-main)] truncate">{notification.title}</p>
                              <span className="text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
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
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-cyan-500/50"
            title="Switch theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
