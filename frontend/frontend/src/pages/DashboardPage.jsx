import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";
import { StatsAPI } from "../api";

function KPI({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-soft)]">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-main)] mt-1">{value ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function CalendarPanel() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = today.toLocaleDateString("en-LK", { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < startWeekDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-cyan-500" />
          <h3 className="text-[var(--text-main)] font-semibold">Calendar</h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{monthLabel}</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekDays.map((wd) => (
          <p key={wd} className="text-[10px] text-center text-[var(--text-soft)] uppercase tracking-wide">
            {wd}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          const isToday = day === today.getDate();
          return (
            <div
              key={`${day || "blank"}-${idx}`}
              className={`h-9 rounded-lg border text-xs flex items-center justify-center ${
                day
                  ? isToday
                    ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300 font-semibold"
                    : "border-[var(--border-main)] text-[var(--text-main)]"
                  : "border-transparent"
              }`}
            >
              {day || ""}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-4">
        Today: {today.toLocaleDateString("en-LK", { dateStyle: "full" })}
      </p>
    </section>
  );
}

function TrendBars({ trend }) {
  const maxVal = useMemo(() => {
    return Math.max(1, ...trend.map((r) => Math.max(r.logs, r.documents)));
  }, [trend]);

  return (
    <section className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-cyan-500" />
        <h3 className="text-[var(--text-main)] font-semibold">7-Day Activity</h3>
      </div>

      <div className="grid grid-cols-7 gap-2 items-end h-40">
        {trend.map((row) => (
          <div key={row.day} className="h-full flex flex-col justify-end items-center gap-1.5">
            <div className="h-28 flex items-end gap-1">
              <div
                className="w-2.5 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400"
                style={{ height: `${Math.max(5, (row.logs / maxVal) * 100)}%` }}
                title={`Logs: ${row.logs}`}
              />
              <div
                className="w-2.5 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                style={{ height: `${Math.max(5, (row.documents / maxVal) * 100)}%` }}
                title={`Documents: ${row.documents}`}
              />
            </div>
            <p className="text-[10px] text-[var(--text-soft)]">
              {new Date(row.day).toLocaleDateString("en-LK", { weekday: "short" })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Logs</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Documents</div>
      </div>
    </section>
  );
}

function UsersPanel({ users }) {
  return (
    <section className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-cyan-500" />
        <h3 className="text-[var(--text-main)] font-semibold">User Details</h3>
      </div>

      <div className="space-y-2.5">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-[var(--border-main)] p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                {u.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-main)] font-medium truncate">{u.username}</p>
                <p className="text-xs text-[var(--text-soft)] truncate">{u.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-cyan-400 capitalize">{u.role}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{u.dept_name || "No Dept"}</p>
            </div>
          </div>
        ))}
        {!users.length && <p className="text-sm text-[var(--text-soft)]">No active users</p>}
      </div>
    </section>
  );
}

function TasksPanel({ tasks }) {
  return (
    <section className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-cyan-500" />
        <h3 className="text-[var(--text-main)] font-semibold">Task Details</h3>
      </div>

      <div className="space-y-2.5">
        {tasks.map((t) => (
          <div key={t.id} className="rounded-xl border border-[var(--border-main)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-[var(--text-main)] font-medium">#{t.id} {t.task_name}</p>
                <p className="text-xs text-[var(--text-soft)] mt-1">
                  {t.assigned_by_name} &rarr; {t.assigned_to_name}
                </p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${
                  t.status === "completed"
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                }`}
              >
                {t.status}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              Updated {new Date(t.updated_at).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        ))}
        {!tasks.length && <p className="text-sm text-[var(--text-soft)]">No tasks found</p>}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    StatsAPI.get().then((r) => setStats(r.data));
  }, []);

  const trend = stats?.trend7d || [];
  const users = stats?.userDetails || [];
  const tasks = stats?.taskDetails || [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-500/20 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.28),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.16),transparent_42%),var(--bg-panel)] p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-cyan-400 text-xs uppercase tracking-[0.22em] font-semibold">Insight Workspace</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--text-main)] mt-2">Analytics Dashboard</h2>
            <p className="text-sm text-[var(--text-muted)] mt-3 max-w-3xl">
              Overview of documents, people, and tasks with real-time operational signals.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <div>
              <p className="text-xs text-cyan-300">Today Actions</p>
              <p className="text-xl font-bold text-cyan-200">{stats?.logsToday ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI title="Documents" value={stats?.totalDocs} subtitle="Active files" icon={FileText} tone="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <KPI title="Users" value={stats?.totalUsers} subtitle="Active accounts" icon={UserCircle2} tone="bg-gradient-to-br from-indigo-500 to-blue-600" />
        <KPI title="Tasks" value={stats?.totalTasks} subtitle={`${stats?.pendingTasks ?? 0} pending`} icon={ClipboardCheck} tone="bg-gradient-to-br from-amber-500 to-orange-600" />
        <KPI title="Completed Tasks" value={stats?.completedTasks} subtitle={`${stats?.completion?.tasks ?? 0}% completion`} icon={CheckCircle2} tone="bg-gradient-to-br from-emerald-500 to-teal-600" />
      </section>

      <section className="grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <TrendBars trend={trend} />
        </div>
        <CalendarPanel />
      </section>

      <section className="grid xl:grid-cols-2 gap-4">
        <UsersPanel users={users} />
        <TasksPanel tasks={tasks} />
      </section>

      <section className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock3 className="w-4 h-4 text-cyan-500" />
          <h3 className="text-[var(--text-main)] font-semibold">Recent Activity</h3>
        </div>

        <div className="space-y-2.5">
          {(stats?.recentActivity || []).map((a) => (
            <div key={a.id} className="rounded-xl border border-[var(--border-main)] p-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-[var(--text-main)]">
                  <span className="font-semibold">{a.username}</span>
                  <span className="mx-1 text-cyan-400">{a.action_type}</span>
                  <span className="text-[var(--text-muted)]">{a.document_name}</span>
                </p>
                <p className="text-xs text-[var(--text-soft)] mt-1">
                  {new Date(a.changed_at).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
            </div>
          ))}
          {!stats?.recentActivity?.length && <p className="text-sm text-[var(--text-soft)]">No recent activity yet</p>}
        </div>
      </section>
    </div>
  );
}
