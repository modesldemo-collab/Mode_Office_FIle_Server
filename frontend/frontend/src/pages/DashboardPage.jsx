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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatsAPI } from "../api";

function KPI({ title, value, subtitle, icon: Icon }) {
  const config = {
    "Documents": {
      borderClass: "border-l-[#fb7185] dark:border-l-rose-500",
      bgClass: "bg-rose-50 dark:bg-rose-950/20",
      iconColor: "text-[#f43f5e] dark:text-rose-400"
    },
    "Users": {
      borderClass: "border-l-[#818cf8] dark:border-l-indigo-500",
      bgClass: "bg-indigo-50 dark:bg-indigo-950/20",
      iconColor: "text-[#6366f1] dark:text-indigo-400"
    },
    "Tasks": {
      borderClass: "border-l-[#fbbf24] dark:border-l-amber-500",
      bgClass: "bg-amber-50 dark:bg-amber-950/20",
      iconColor: "text-[#f59e0b] dark:text-amber-400"
    },
    "Completed Tasks": {
      borderClass: "border-l-[#34d399] dark:border-l-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
      iconColor: "text-[#10b981] dark:text-emerald-400"
    }
  }[title] || {
    borderClass: "border-l-cyan-500",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/20",
    iconColor: "text-cyan-500"
  };

  return (
    <div className={`white-card rounded-2xl border-l-4 ${config.borderClass} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.bgClass}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)] truncate">{title}</p>
          <p className="text-2xl font-extrabold text-[var(--text-main)] mt-0.5">{value ?? 0}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{subtitle}</p>
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

  // Custom highlights to replicate the reference design calendar aesthetics
  const highlightGreen = [2, 27, 28, 29];
  const highlightYellow = [17];

  return (
    <section className="white-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--border-main)] pb-3">
        <button className="p-1.5 rounded-full border border-slate-200/80 hover:bg-[var(--bg-soft)] text-[var(--text-muted)] transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{monthLabel}</span>
        <button className="p-1.5 rounded-full border border-slate-200/80 hover:bg-[var(--bg-soft)] text-[var(--text-muted)] transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((wd) => (
          <p key={wd} className="text-[10px] text-center font-bold text-[var(--text-soft)] uppercase tracking-wide">
            {wd}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          const isToday = day === today.getDate();
          const isGreen = day && highlightGreen.includes(day);
          const isYellow = day && highlightYellow.includes(day);
          
          let dayStyle = "text-[var(--text-main)] hover:bg-[var(--bg-soft)]";
          if (isToday) {
            dayStyle = "bg-[#3b3260] text-white font-extrabold shadow-sm shadow-[#3b3260]/20";
          } else if (isGreen) {
            dayStyle = "bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/20";
          } else if (isYellow) {
            dayStyle = "bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20";
          }

          return (
            <div
              key={`${day || "blank"}-${idx}`}
              className={`h-8 w-8 mx-auto rounded-full text-xs flex items-center justify-center transition-all ${
                day ? `cursor-pointer ${dayStyle}` : "border-transparent text-transparent pointer-events-none"
              }`}
            >
              {day || ""}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] uppercase font-bold text-[var(--text-soft)] mt-4 tracking-wider text-center">
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
    <section className="white-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <Activity className="w-4 h-4 text-indigo-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">7-Day Operations</h3>
      </div>

      <div className="grid grid-cols-7 gap-4 items-end h-40 mt-6 px-2">
        {trend.map((row) => (
          <div key={row.day} className="h-full flex flex-col justify-end items-center gap-2">
            <div className="h-28 flex items-end gap-1.5 w-full justify-center">
              {/* Logs Bar with empty track design */}
              <div className="w-2.5 bg-slate-100 dark:bg-slate-800 rounded-full h-full flex items-end">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm"
                  style={{ height: `${Math.max(12, (row.logs / maxVal) * 100)}%` }}
                  title={`Logs: ${row.logs}`}
                />
              </div>
              {/* Documents Bar with empty track design */}
              <div className="w-2.5 bg-slate-100 dark:bg-slate-800 rounded-full h-full flex items-end">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-amber-500 to-amber-300 shadow-sm"
                  style={{ height: `${Math.max(12, (row.documents / maxVal) * 100)}%` }}
                  title={`Documents: ${row.documents}`}
                />
              </div>
            </div>
            <p className="text-[9px] font-bold text-[var(--text-soft)] uppercase">
              {new Date(row.day).toLocaleDateString("en-LK", { weekday: "short" })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 mt-5 border-t border-[var(--border-main)] pt-3 px-1 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
          <span className="font-semibold text-[var(--text-main)]">Operational Logs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
          <span className="font-semibold text-[var(--text-main)]">Active Documents</span>
        </div>
      </div>
    </section>
  );
}

function UsersPanel({ users }) {
  return (
    <section className="white-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <Users className="w-4 h-4 text-indigo-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">User Details</h3>
      </div>

      <div className="space-y-2.5">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-[var(--border-main)] p-3 flex items-center justify-between gap-2 hover:bg-[var(--bg-soft)] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-[#3b3260] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-white/20">
                {u.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-main)] font-semibold truncate">{u.username}</p>
                <p className="text-xs text-[var(--text-soft)] truncate">{u.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-600 font-bold capitalize">{u.role}</p>
              <p className="text-[10px] font-bold text-[var(--text-soft)] uppercase tracking-wider">{u.dept_name || "No Dept"}</p>
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
    <section className="white-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">Task Details</h3>
      </div>

      <div className="space-y-2.5">
        {tasks.map((t) => (
          <div key={t.id} className="rounded-xl border border-[var(--border-main)] p-3 hover:bg-[var(--bg-soft)] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-[var(--text-main)] font-semibold">#{t.id} {t.task_name}</p>
                <p className="text-xs text-[var(--text-soft)] mt-1">
                  <span className="font-medium text-[var(--text-muted)]">{t.assigned_by_name}</span>
                  <span className="mx-1.5 text-[var(--text-soft)]">&rarr;</span>
                  <span className="font-medium text-[var(--text-main)]">{t.assigned_to_name}</span>
                </p>
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  t.status === "completed"
                    ? "text-emerald-700 border-emerald-500/20 bg-emerald-50"
                    : "text-amber-700 border-amber-500/20 bg-amber-50"
                }`}
              >
                {t.status}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-soft)] mt-2.5">
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
      <section className="rounded-3xl border border-transparent bg-gradient-to-br from-[#3b3260] via-[#483d73] to-[#251e3d] p-6 lg:p-8 shadow-lg text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-purple-300 text-xs font-bold uppercase tracking-wider">Insight Workspace</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold mt-2 tracking-tight">Analytics Dashboard</h2>
            <p className="text-sm text-purple-200/80 mt-3 max-w-3xl leading-relaxed">
              Overview of documents, people, and tasks with real-time operational signals.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 flex items-center gap-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Today Actions</p>
              <p className="text-2xl font-extrabold text-white">{stats?.logsToday ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI title="Documents" value={stats?.totalDocs} subtitle="Active files" icon={FileText} />
        <KPI title="Users" value={stats?.totalUsers} subtitle="Active accounts" icon={UserCircle2} />
        <KPI title="Tasks" value={stats?.totalTasks} subtitle={`${stats?.pendingTasks ?? 0} pending`} icon={ClipboardCheck} />
        <KPI title="Completed Tasks" value={stats?.completedTasks} subtitle={`${stats?.completion?.tasks ?? 0}% completion`} icon={CheckCircle2} />
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

      <section className="white-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
          <Clock3 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">Recent Activity</h3>
        </div>

        <div className="space-y-2.5">
          {(stats?.recentActivity || []).map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-100 p-3 flex items-start justify-between gap-2 hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm text-[var(--text-main)]">
                  <span className="font-bold">{a.username}</span>
                  <span className="mx-1.5 font-semibold text-indigo-600 capitalize">{a.action_type}</span>
                  <span className="text-[var(--text-muted)] font-medium">{a.document_name}</span>
                </p>
                <p className="text-xs text-[var(--text-soft)] mt-1.5">
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
