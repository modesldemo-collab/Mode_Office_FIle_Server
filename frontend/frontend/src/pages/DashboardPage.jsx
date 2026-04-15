import React, { useState, useEffect } from "react";
import { FileText, Users, Building2, ScrollText, Sparkles, TrendingUp } from "lucide-react";
import { StatsAPI } from "../api";
import { Badge } from "../components/Badge";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl p-5 border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--text-muted)] text-sm">{label}</p>
          <p className="text-3xl font-bold text-[var(--text-main)] mt-1">{value ?? "—"}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    StatsAPI.get().then((r) => setStats(r.data));
  }, []);

  const totalDocs = stats?.totalDocs || 0;
  const todayActions = stats?.logsToday || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-cyan-500 text-sm font-semibold tracking-wide uppercase">System Overview</p>
            <h2 className="text-2xl font-bold text-[var(--text-main)] mt-1">Operations Dashboard</h2>
            <p className="text-[var(--text-soft)] text-sm mt-2 max-w-2xl">
              Today recorded <span className="font-semibold text-[var(--text-main)]">{todayActions}</span> actions across
              <span className="font-semibold text-[var(--text-main)]"> {totalDocs}</span> active documents.
            </p>
          </div>
          <div className="flex items-center gap-2 text-cyan-500 bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Live Status</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={stats?.totalDocs}  icon={FileText}   color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard label="Active Users"    value={stats?.totalUsers} icon={Users}      color="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard label="Departments"     value={stats?.totalDepts} icon={Building2}  color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="Actions Today"   value={stats?.logsToday}  icon={ScrollText} color="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 transition-colors duration-300">
          <h3 className="text-[var(--text-main)] font-semibold mb-4">Documents by Department</h3>
          <div className="space-y-3">
            {(stats?.byDept || []).map((d) => (
              <div key={d.dept_name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-main)]">{d.dept_name || "Unassigned"}</span>
                    <span className="text-[var(--text-soft)]">{d.count}</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-soft)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (d.count / (stats?.totalDocs || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!stats?.byDept?.length && (
              <p className="text-[var(--text-soft)] text-sm">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            <h3 className="text-[var(--text-main)] font-semibold">Document Status</h3>
          </div>
          <div className="flex gap-6 items-center justify-center h-32">
            {(stats?.byStatus || []).map((s) => (
              <div key={s.status} className="text-center">
                <p className="text-4xl font-bold text-[var(--text-main)]">{s.count}</p>
                <Badge status={s.status} />
              </div>
            ))}
            {!stats?.byStatus?.length && (
              <p className="text-[var(--text-soft)] text-sm">No documents yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
