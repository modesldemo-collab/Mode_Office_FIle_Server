import React, { useState, useEffect } from "react";
import { FileText, Users, Building2, ScrollText } from "lucide-react";
import { StatsAPI } from "../api";
import { Badge } from "../components/Badge";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? "—"}</p>
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={stats?.totalDocs}  icon={FileText}   color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard label="Active Users"    value={stats?.totalUsers} icon={Users}      color="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard label="Departments"     value={stats?.totalDepts} icon={Building2}  color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="Actions Today"   value={stats?.logsToday}  icon={ScrollText} color="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Documents by Department</h3>
          <div className="space-y-3">
            {(stats?.byDept || []).map((d) => (
              <div key={d.dept_name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{d.dept_name || "Unassigned"}</span>
                    <span className="text-slate-400">{d.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
              <p className="text-slate-500 text-sm">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Document Status</h3>
          <div className="flex gap-6 items-center justify-center h-32">
            {(stats?.byStatus || []).map((s) => (
              <div key={s.status} className="text-center">
                <p className="text-4xl font-bold text-white">{s.count}</p>
                <Badge status={s.status} />
              </div>
            ))}
            {!stats?.byStatus?.length && (
              <p className="text-slate-500 text-sm">No documents yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
