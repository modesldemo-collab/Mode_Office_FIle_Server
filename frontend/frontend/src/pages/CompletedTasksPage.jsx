import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { TasksAPI } from "../api";
import { formatDate } from "../utils";

export function CompletedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCompletedTasks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await TasksAPI.list();
      const all = r.data || [];
      setTasks(all.filter((t) => t.status === "completed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this completed task?")) return;
    await TasksAPI.delete(taskId);
    fetchCompletedTasks();
  };

  const handleRestore = async (taskId) => {
    if (!confirm("Restore this task back to active tasks?")) return;
    await TasksAPI.restore(taskId);
    fetchCompletedTasks();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[var(--text-main)] text-lg font-semibold">Completed Tasks</h2>
          <p className="text-[var(--text-soft)] text-sm mt-1">
            Tasks that are fully completed by all assigned members.
          </p>
        </div>
        <button
          onClick={fetchCompletedTasks}
          className="text-[var(--text-soft)] hover:text-[var(--text-main)] p-2.5 rounded-xl border border-[var(--border-main)] hover:border-cyan-500/40 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-soft)]">
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Task</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Sender</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Members</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--text-soft)]">Loading...</td>
                </tr>
              )}
              {!loading && tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--text-soft)]">No completed tasks yet</td>
                </tr>
              )}
              {!loading && tasks.map((task) => (
                <tr key={task.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-soft)]/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-[var(--text-main)] font-medium">{task.task_name}</p>
                        <p className="text-xs text-[var(--text-soft)]">#{task.id}</p>
                        {task.deadline && (
                          <p className="text-xs text-[var(--text-soft)] mt-1">Deadline: {task.deadline}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{task.assigned_by_name || "Unknown"}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{task.completed_members || 0}/{task.total_members || 0} done</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(task.updated_at || task.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRestore(task.id)}
                        className="p-1.5 text-[var(--text-soft)] hover:text-cyan-500 rounded-lg hover:bg-cyan-500/10 transition-all"
                        title="Restore task"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 text-[var(--text-soft)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
