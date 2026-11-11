import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, RotateCcw, Trash2, Folder } from "lucide-react";
import { TasksAPI, ProjectsAPI } from "../api";
import { formatDate } from "../utils";
import { NavCtx } from "../layout/Sidebar";

export function CompletedTasksPage() {
  const { setPage } = React.useContext(NavCtx);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        TasksAPI.list(),
        ProjectsAPI.list()
      ]);
      setTasks((tRes.data || []).filter((t) => t.status === "completed"));
      setProjects((pRes.data || []).filter((p) => p.status === "completed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this completed task?")) return;
    await TasksAPI.delete(taskId);
    fetchData();
  };

  const handleRestoreTask = async (taskId) => {
    if (!confirm("Restore this task back to active tasks?")) return;
    await TasksAPI.updateStatus(taskId, { status: "pending" });
    fetchData();
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Delete this completed project?")) return;
    await ProjectsAPI.delete(projectId);
    fetchData();
  };

  const handleRestoreProject = async (projectId) => {
    if (!confirm("Restore this project back to active projects?")) return;
    await ProjectsAPI.update(projectId, { status: "active" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[var(--text-main)] text-lg font-semibold">Completed Tasks & Projects</h2>
          <p className="text-[var(--text-soft)] text-sm mt-1">
            Projects and tasks that have been successfully finalized.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage("tasks")}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            Back to Dashboard
          </button>
          <button
            onClick={fetchData}
            className="text-[var(--text-soft)] hover:text-[var(--text-main)] p-2.5 rounded-xl border border-[var(--border-main)] hover:border-cyan-500/40 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* COMPLETED PROJECTS SECTION */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[var(--bg-soft)] px-4 py-3 border-b border-[var(--border-main)] flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-500" />
            <h3 className="text-[var(--text-main)] font-bold text-sm">Completed Projects</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-soft)]/50">
                  <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Project</th>
                  <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Owner</th>
                  <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[var(--text-soft)]">Loading...</td>
                  </tr>
                )}
                {!loading && projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[var(--text-soft)]">No completed projects yet</td>
                  </tr>
                )}
                {!loading && projects.map((project) => (
                  <tr key={project.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-soft)]/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-[var(--text-main)] font-medium">{project.project_name}</p>
                          <p className="text-xs text-[var(--text-soft)]">#{project.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-soft)]">
                      {project.owner_name || "Manager"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-soft)]">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleRestoreProject(project.id)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Restore to Active"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Permanently Delete"
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

        {/* COMPLETED TASKS SECTION */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[var(--bg-soft)] px-4 py-3 border-b border-[var(--border-main)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-[var(--text-main)] font-bold text-sm">Completed Tasks</h3>
          </div>
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
                        onClick={() => handleRestoreTask(task.id)}
                        className="p-1.5 text-[var(--text-soft)] hover:text-cyan-500 rounded-lg hover:bg-cyan-500/10 transition-all"
                        title="Restore task"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
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
    </div>
  );
}
