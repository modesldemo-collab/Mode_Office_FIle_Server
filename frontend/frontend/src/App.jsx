import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NavCtx } from "./layout/Sidebar";
import { Shell } from "./layout/Shell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { CompletedPage } from "./pages/CompletedPage";
import { TasksPage } from "./pages/TasksPage";
import { LogsPage } from "./pages/LogsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { DepartmentsPage } from "./pages/admin/DepartmentsPage";

function AppRouter() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    if (user?.role !== "admin" && page === "logs") {
      setPage("dashboard");
    }
  }, [page, user?.role]);

  if (!user) return <LoginPage />;

  const PageContent = {
    dashboard:   DashboardPage,
    documents:   DocumentsPage,
    completed:   CompletedPage,
    tasks:       TasksPage,
    logs:        LogsPage,
    users:       UsersPage,
    departments: DepartmentsPage,
  }[page] || DashboardPage;

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
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}