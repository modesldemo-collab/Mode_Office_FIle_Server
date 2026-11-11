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
  AlertCircle,
  FolderOpen,
  ArrowRight
} from "lucide-react";
import { StatsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

function KPI({ title, value, subtitle, icon: Icon }) {
  const config = {
    "My Documents": {
      borderClass: "border-l-[#fb7185] dark:border-l-rose-500",
      bgClass: "bg-rose-50 dark:bg-rose-950/20",
      iconColor: "text-[#f43f5e] dark:text-rose-400"
    },
    "Shared With Me": {
      borderClass: "border-l-[#818cf8] dark:border-l-indigo-500",
      bgClass: "bg-indigo-50 dark:bg-indigo-950/20",
      iconColor: "text-[#6366f1] dark:text-indigo-400"
    },
    "Pending Tasks": {
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

function CalendarPanel({ highlightDates = [] }) {
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
    <section className="white-card rounded-2xl p-5 flex flex-col h-full">
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

      <div className="grid grid-cols-7 gap-2 flex-1">
        {cells.map((day, idx) => {
          const isToday = day === today.getDate();
          const isHighlighted = day && highlightDates.includes(day);
          
          let dayStyle = "text-[var(--text-main)] hover:bg-[var(--bg-soft)]";
          if (isToday) {
            dayStyle = "bg-[#3b3260] text-white font-extrabold shadow-sm shadow-[#3b3260]/20";
          } else if (isHighlighted) {
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

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] uppercase font-bold text-[var(--text-soft)] tracking-wider border-t border-[var(--border-main)] pt-3">
         <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b3260]" /> Today</div>
         <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Deadline</div>
      </div>
    </section>
  );
}

function UpcomingDeadlinesPanel({ deadlines }) {
  return (
    <section className="white-card rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">Upcoming Deadlines</h3>
      </div>
      <div className="space-y-3 flex-1">
        {deadlines.map((t) => (
          <div key={t.id} className="group rounded-xl border border-[var(--border-main)] p-3 hover:bg-[var(--bg-soft)] transition-colors flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <p className="text-sm text-[var(--text-main)] font-semibold truncate">{t.task_name}</p>
              <p className="text-[10px] text-[var(--text-soft)] mt-1 uppercase tracking-wide truncate">
                {t.project_name || "Personal Task"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
               <p className="text-xs font-bold text-amber-600">
                  {new Date(t.deadline).toLocaleDateString("en-LK", { month: "short", day: "numeric" })}
               </p>
            </div>
          </div>
        ))}
        {!deadlines.length && <p className="text-sm text-[var(--text-soft)] text-center py-4">No upcoming deadlines! 🎉</p>}
      </div>
    </section>
  );
}

function RecentDocumentsPanel({ documents }) {
  return (
    <section className="white-card rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <FolderOpen className="w-4 h-4 text-indigo-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">Recent Documents</h3>
      </div>
      <div className="space-y-3 flex-1">
        {documents.map((d) => (
          <div key={d.id} className="group rounded-xl border border-[var(--border-main)] p-3 hover:bg-[var(--bg-soft)] transition-colors flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-500" />
               </div>
               <div className="min-w-0">
                 <p className="text-sm text-[var(--text-main)] font-semibold truncate">{d.doc_name}</p>
                 <p className="text-[10px] text-[var(--text-soft)] mt-0.5 uppercase tracking-wide">
                   {new Date(d.created_at).toLocaleDateString("en-LK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                 </p>
               </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        {!documents.length && <p className="text-sm text-[var(--text-soft)] text-center py-4">No recent documents</p>}
      </div>
    </section>
  );
}

function PersonalProfilePanel({ user, stats }) {
  return (
    <section className="white-card rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <UserCircle2 className="w-4.5 h-4.5 text-indigo-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">My Profile</h3>
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        <div className="rounded-xl border border-[var(--border-main)] p-4 flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-950/20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/20">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base text-[var(--text-main)] font-extrabold truncate">{user?.username}</h4>
            <p className="text-xs text-[var(--text-soft)] truncate mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {user?.role}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-soft)] text-[var(--text-soft)] border border-[var(--border-main)]">
                {user?.dept_name || "No Division"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="rounded-xl border border-[var(--border-main)] p-4 bg-[var(--bg-soft)]/30 text-center flex flex-col justify-center">
             <p className="text-[10px] font-bold uppercase text-[var(--text-soft)] tracking-wider">Active Projects</p>
             <p className="text-lg font-black text-[var(--text-main)] mt-1">{stats?.upcomingDeadlines?.length || 1}</p>
           </div>
           <div className="rounded-xl border border-[var(--border-main)] p-4 bg-[var(--bg-soft)]/30 text-center flex flex-col justify-center">
             <p className="text-[10px] font-bold uppercase text-[var(--text-soft)] tracking-wider">Task Completion</p>
             <p className="text-lg font-black text-emerald-500 mt-1">
                {stats?.myTotalTasks ? Math.round(((stats?.myCompletedTasks || 0) / stats?.myTotalTasks) * 100) : 0}%
             </p>
           </div>
        </div>

        <div className="rounded-xl border border-[var(--border-main)] p-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/30">
           <div className="flex justify-between items-center mb-2">
             <p className="text-[10px] font-bold uppercase text-[var(--text-soft)] tracking-wider">Storage Quota</p>
             <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">48%</p>
           </div>
           <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: '48%' }}></div>
           </div>
           <p className="text-[10px] text-[var(--text-muted)] mt-2 text-right">2.4 GB of 5 GB used</p>
        </div>

        <div className="rounded-xl border border-[var(--border-main)] p-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-800">
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
             </div>
             <div>
                <p className="text-sm font-extrabold text-[var(--text-main)]">{stats?.logsToday || 0} Actions Today</p>
                <p className="text-[10px] font-medium text-[var(--text-soft)] uppercase tracking-wider mt-0.5">Your activity is on track</p>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
}

function TasksPanel({ tasks }) {
  return (
    <section className="white-card rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">My Tasks Overview</h3>
      </div>

      <div className="space-y-2.5 flex-1">
        {tasks.map((t) => (
          <div key={t.id} className="rounded-xl border border-[var(--border-main)] p-3 hover:bg-[var(--bg-soft)] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 pr-2">
                <p className="text-sm text-[var(--text-main)] font-semibold truncate">#{t.id} {t.task_name}</p>
                <p className="text-xs text-[var(--text-soft)] mt-1 truncate">
                  <span className="font-medium text-[var(--text-muted)]">{t.assigned_by_name}</span>
                  <span className="mx-1.5 text-[var(--text-soft)]">&rarr;</span>
                  <span className="font-medium text-[var(--text-main)]">{t.assigned_to_name}</span>
                </p>
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex-shrink-0 ${
                  t.status === "completed"
                    ? "text-emerald-700 border-emerald-500/20 bg-emerald-50"
                    : "text-indigo-700 border-indigo-500/20 bg-indigo-50"
                }`}
              >
                {t.status}
              </span>
            </div>
          </div>
        ))}
        {!tasks.length && <p className="text-sm text-[var(--text-soft)] text-center py-4">No tasks found</p>}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    StatsAPI.get().then((r) => setStats(r.data));
  }, []);

  const tasks = stats?.taskDetails || [];
  const upcomingDeadlines = stats?.upcomingDeadlines || [];
  const recentDocuments = stats?.recentDocuments || [];
  const recentActivity = stats?.recentActivity || [];
  
  const today = new Date();
  const highlightDates = upcomingDeadlines
     .filter(t => new Date(t.deadline).getMonth() === today.getMonth() && new Date(t.deadline).getFullYear() === today.getFullYear())
     .map(t => new Date(t.deadline).getDate());

  const pendingCount = Math.max(0, (stats?.myTotalTasks || 0) - (stats?.myCompletedTasks || 0));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b3260] via-[#483d73] to-[#251e3d] p-8 lg:p-10 shadow-xl text-white">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-40 -mb-20 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-sm">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
               {user?.dept_name || "Insight Workspace"}
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Good day, {user?.username}!</h2>
            <p className="text-base text-purple-200/90 mt-3 leading-relaxed">
              Here is your personalized overview. You have <strong className="text-white">{pendingCount} pending tasks</strong> and <strong className="text-white">{upcomingDeadlines.length} upcoming deadlines</strong> this week.
            </p>
          </div>
          
          <div className="flex-shrink-0 w-full md:w-auto">
             <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-5 flex items-center gap-4 shadow-inner hover:bg-white/10 transition-colors">
               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                 <Sparkles className="w-6 h-6 text-white" />
               </div>
               <div>
                 <p className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Today's Activity</p>
                 <p className="text-3xl font-extrabold text-white">{stats?.logsToday ?? 0} <span className="text-sm font-medium text-purple-300">actions</span></p>
               </div>
             </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPI title="My Documents" value={stats?.myTotalDocs ?? 0} subtitle="Uploaded by you" icon={FileText} />
        <KPI title="Shared With Me" value={stats?.mySharedDocs ?? 0} subtitle="Accessible to you" icon={Users} />
        <KPI title="Pending Tasks" value={pendingCount} subtitle="Requires action" icon={Clock3} />
        <KPI title="Completed Tasks" value={stats?.myCompletedTasks ?? 0} subtitle="Great job!" icon={CheckCircle2} />
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
           <UpcomingDeadlinesPanel deadlines={upcomingDeadlines} />
           <RecentDocumentsPanel documents={recentDocuments} />
        </div>
        <CalendarPanel highlightDates={highlightDates} />
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <PersonalProfilePanel user={user} stats={stats} />
        <div className="lg:col-span-1">
           <TasksPanel tasks={tasks} />
        </div>
        <div className="lg:col-span-1">
           <section className="white-card rounded-2xl p-5 flex flex-col h-full">
             <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-main)] pb-3">
               <Activity className="w-4 h-4 text-indigo-500" />
               <h3 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-wider">Recent Activity</h3>
             </div>

             <div className="space-y-3 flex-1">
               {recentActivity.map((a) => (
                 <div key={a.id} className="rounded-xl border border-[var(--border-main)] p-3 flex items-start justify-between gap-3 hover:bg-[var(--bg-soft)] transition-colors">
                   <div className="min-w-0">
                     <p className="text-sm text-[var(--text-main)] truncate">
                       <span className="font-bold">{a.username}</span>
                       <span className="mx-1.5 font-semibold text-indigo-600 capitalize">{a.action_type}</span>
                       <span className="text-[var(--text-muted)] font-medium">{a.document_name}</span>
                     </p>
                     <p className="text-[10px] font-medium uppercase text-[var(--text-soft)] mt-1 tracking-wide">
                       {new Date(a.changed_at).toLocaleString("en-LK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                     </p>
                   </div>
                   <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                   </div>
                 </div>
               ))}
               {!recentActivity.length && <p className="text-sm text-[var(--text-soft)] text-center py-4">No recent activity</p>}
             </div>
           </section>
        </div>
      </section>
    </div>
  );
}
