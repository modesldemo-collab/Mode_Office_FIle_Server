import React, { useState, useContext } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { Sidebar, NavCtx } from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

export function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { page } = useContext(NavCtx);
  const { theme, toggleTheme } = useTheme();

  const labels = {
    dashboard:   "Dashboard",
    documents:   "Documents",
    completed:   "Completed Documents",
    logs:        "Audit Logs",
    users:       "User Management",
    departments: "Departments",
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
          <button
            onClick={toggleTheme}
            className="ml-auto flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-cyan-500/50"
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
