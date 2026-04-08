import React, { useState, useContext } from "react";
import { Menu } from "lucide-react";
import { Sidebar, NavCtx } from "./Sidebar";

export function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { page } = useContext(NavCtx);

  const labels = {
    dashboard:   "Dashboard",
    documents:   "Documents",
    logs:        "Audit Logs",
    users:       "User Management",
    departments: "Departments",
    persons:     "Responsible Persons",
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:pl-64">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-col min-h-screen">
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
