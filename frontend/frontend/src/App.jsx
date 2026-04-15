import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavCtx } from "./layout/Sidebar";
import { Shell } from "./layout/Shell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { LogsPage } from "./pages/LogsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { DepartmentsPage } from "./pages/admin/DepartmentsPage";
import { PersonsPage } from "./pages/admin/PersonsPage";

function AppRouter() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!user) return <LoginPage />;

  const PageContent = {
    dashboard:   DashboardPage,
    documents:   DocumentsPage,
    logs:        LogsPage,
    users:       UsersPage,
    departments: DepartmentsPage,
    persons:     PersonsPage,
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
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}