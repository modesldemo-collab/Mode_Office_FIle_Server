import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { Auth, TasksAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils";

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [taskName, setTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState("self");

  const userMap = useMemo(() => {
    const map = new Map();
    map.set(user?.id, user?.username || "You");
    users.forEach((u) => map.set(u.id, u.username));
    return map;
  }, [user, users]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await TasksAPI.list();
      setTasks(r.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    Auth.shareUsers().then((r) => setUsers(r.data || []));
  }, [fetchTasks]);

  const handleCreate = async () => {
    if (!taskName.trim()) {
      alert("Task name is required");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        task_name: taskName.trim(),
      };
      if (assignedTo !== "self") {
        payload.assigned_to = Number(assignedTo);
      }

      await TasksAPI.create(payload);
      setTaskName("");
      setAssignedTo("self");
      await fetchTasks();
    } finally {
      setCreating(false);
    }
  };

  const handleTick = async (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    await TasksAPI.updateStatus(task.id, { status: nextStatus });
    fetchTasks();
  };

  const handleSelfAssign = async (task) => {
    await TasksAPI.selfAssign(task.id);
    fetchTasks();
  };

  const handleAssign = async (taskId, value) => {
    if (value === "self") {
      await TasksAPI.selfAssign(taskId);
    } else {
      await TasksAPI.assign(taskId, { assigned_to: Number(value) });
    }
    fetchTasks();
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    await TasksAPI.delete(taskId);
    fetchTasks();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
        <h2 className="text-[var(--text-main)] text-lg font-semibold">Task Assignment Board</h2>
        <p className="text-[var(--text-soft)] text-sm mt-1">
          Create tasks, assign to any user, self-assign, and tick tasks as completed.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name"
            className="flex-1 min-w-64 bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
          />
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="self">Assign to me</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Add Task"}
          </button>
          <button
            onClick={fetchTasks}
            className="text-[var(--text-soft)] hover:text-[var(--text-main)] p-2.5 rounded-xl border border-[var(--border-main)] hover:border-cyan-500/40 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-soft)]">
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Task ID</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Task Name</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Assign By</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Assign To</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--text-soft)]">Loading tasks...</td>
                </tr>
              )}
              {!loading && tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--text-soft)]">No tasks yet</td>
                </tr>
              )}
              {!loading && tasks.map((task) => (
                (() => {
                  const canManageAssignment = user?.role === "admin" || task.assigned_by === user?.id;
                  const assignedValue = task.assigned_to === user?.id ? "self" : String(task.assigned_to || "self");

                  return (
                <tr key={task.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-soft)]/70 transition-colors">
                  <td className="px-4 py-3 text-[var(--text-muted)]">#{task.id}</td>
                  <td className="px-4 py-3 text-[var(--text-main)] font-medium">{task.task_name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{task.assigned_by_name || userMap.get(task.assigned_by) || "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    <select
                      value={assignedValue}
                      onChange={(e) => handleAssign(task.id, e.target.value)}
                      disabled={!canManageAssignment}
                      className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-cyan-500"
                    >
                      <option value="self">Myself</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTick(task)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        task.status === "completed"
                          ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                          : "text-amber-500 border-amber-500/30 bg-amber-500/10"
                      }`}
                      title="Tick to toggle status"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {task.status === "completed" ? "Completed" : "Pending"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(task.updated_at || task.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleSelfAssign(task)}
                        className="p-1.5 text-[var(--text-soft)] hover:text-cyan-500 rounded-lg hover:bg-cyan-500/10 transition-all"
                        title="Self assign"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={!canManageAssignment}
                        className="p-1.5 text-[var(--text-soft)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
