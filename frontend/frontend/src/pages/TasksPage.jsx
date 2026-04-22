import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, RefreshCw, Save, Trash2, Users } from "lucide-react";
import { Auth, TasksAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils";

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);

  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedCreateUsers, setSelectedCreateUsers] = useState([]);
  const [createDeptFilter, setCreateDeptFilter] = useState("all");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editAssignees, setEditAssignees] = useState([]);
  const [editDeptFilter, setEditDeptFilter] = useState("all");

  const allUsers = useMemo(() => {
    if (!user) return users;
    const map = new Map();
    map.set(user.id, {
      id: user.id,
      username: user.username,
      email: user.email,
      dept_id: user.dept_id ?? null,
      dept_name: user.dept_name ?? "No Division",
    });
    users.forEach((u) => {
      map.set(u.id, {
        ...u,
        dept_name: u.dept_name || "No Division",
      });
    });
    return Array.from(map.values()).sort((a, b) => a.username.localeCompare(b.username));
  }, [user, users]);

  const divisions = useMemo(() => {
    const names = new Set(allUsers.map((u) => u.dept_name || "No Division"));
    return ["all", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [allUsers]);

  const filteredCreateUsers = useMemo(() => {
    if (createDeptFilter === "all") return allUsers;
    return allUsers.filter((u) => (u.dept_name || "No Division") === createDeptFilter);
  }, [allUsers, createDeptFilter]);

  const filteredEditUsers = useMemo(() => {
    if (editDeptFilter === "all") return allUsers;
    return allUsers.filter((u) => (u.dept_name || "No Division") === editDeptFilter);
  }, [allUsers, editDeptFilter]);

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
        assigned_to_users: selectedCreateUsers.length ? selectedCreateUsers : [user.id],
        deadline: deadline || null,
      };

      await TasksAPI.create(payload);
      setTaskName("");
      setDeadline("");
      setSelectedCreateUsers([]);
      await fetchTasks();
    } finally {
      setCreating(false);
    }
  };

  const handleTick = async (task, checked) => {
    const nextStatus = checked ? "completed" : "pending";
    await TasksAPI.updateStatus(task.id, { status: nextStatus });
    fetchTasks();
  };

  const handleCreateAssigneeToggle = (id) => {
    setSelectedCreateUsers((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const startEditAssignees = (task) => {
    setEditingTaskId(task.id);
    setEditAssignees((task.assignees || []).map((a) => a.user_id));
    setEditDeptFilter("all");
  };

  const handleEditAssigneeToggle = (id) => {
    setEditAssignees((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const saveAssignees = async (taskId) => {
    if (!editAssignees.length) {
      alert("Select at least one member");
      return;
    }
    setSavingTaskId(taskId);
    try {
      await TasksAPI.assign(taskId, { assigned_to_users: editAssignees });
      setEditingTaskId(null);
      setEditAssignees([]);
      await fetchTasks();
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    await TasksAPI.delete(taskId);
    fetchTasks();
  };

  const groupByDivision = (members = []) => {
    const grouped = {};
    members.forEach((m) => {
      const key = m.dept_name || "No Division";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return grouped;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
        <h2 className="text-[var(--text-main)] text-lg font-semibold">Task Assignment Board</h2>
        <p className="text-[var(--text-soft)] text-sm mt-1">
          Add multiple members by division, track each person, and let assignees tick completion.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-4">
        <div className="flex flex-wrap gap-3 items-center mb-3">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name"
            className="flex-1 min-w-64 bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            title="Optional deadline"
          />
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

        <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)]/60 p-3">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-[var(--text-soft)] uppercase tracking-wider">Division</span>
            {divisions.map((dept) => (
              <button
                key={dept}
                onClick={() => setCreateDeptFilter(dept)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  createDeptFilter === dept
                    ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                    : "border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)]"
                }`}
              >
                {dept === "all" ? "All" : dept}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredCreateUsers.map((u) => {
              const checked = selectedCreateUsers.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-[var(--border-main)] hover:border-cyan-500/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleCreateAssigneeToggle(u.id)}
                    className="accent-cyan-500"
                  />
                  <div>
                    <p className="text-sm text-[var(--text-main)]">{u.username}{u.id === user?.id ? " (Me)" : ""}</p>
                    <p className="text-xs text-[var(--text-soft)]">{u.dept_name || "No Division"}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading && (
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-8 text-center text-[var(--text-soft)]">
            Loading tasks...
          </div>
        )}
        {!loading && tasks.length === 0 && (
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-8 text-center text-[var(--text-soft)]">
            No tasks yet
          </div>
        )}

        {!loading && tasks.map((task) => {
          const canManage = user?.role === "admin" || task.assigned_by === user?.id;
          const myMember = (task.assignees || []).find((m) => m.user_id === user?.id);
          const canTickOwn = !!myMember && !canManage;
          const membersByDivision = groupByDivision(task.assignees || []);

          return (
            <div key={task.id} className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-4">
              <div className="flex flex-wrap gap-2 justify-between items-start">
                <div>
                  <h3 className="text-[var(--text-main)] font-semibold">#{task.id} {task.task_name}</h3>
                  <p className="text-xs text-[var(--text-soft)] mt-1">
                    Sender: {task.assigned_by_name || "Unknown"} · Updated: {formatDate(task.updated_at || task.created_at)}
                  </p>
                  {task.deadline && (
                    <p className="text-xs text-[var(--text-soft)] mt-1">Deadline: {task.deadline}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    task.status === "completed"
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                      : "text-amber-500 border-amber-500/30 bg-amber-500/10"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {task.completed_members || 0}/{task.total_members || 0} done
                  </span>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={!canManage}
                    className="p-1.5 text-[var(--text-soft)] hover:text-red-500 rounded-lg hover:bg-red-500/10 disabled:opacity-40 transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {canTickOwn && (
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--text-main)]">
                  <input
                    type="checkbox"
                    checked={myMember.is_completed}
                    onChange={(e) => handleTick(task, e.target.checked)}
                    className="accent-emerald-500"
                  />
                  I completed this task
                </label>
              )}

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.keys(membersByDivision).sort((a, b) => a.localeCompare(b)).map((division) => (
                  <div key={division} className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)]/60 p-3">
                    <p className="text-xs uppercase tracking-wider text-[var(--text-soft)] mb-2">{division}</p>
                    <div className="space-y-1.5">
                      {membersByDivision[division].map((m) => (
                        <div key={`${task.id}-${m.user_id}`} className="flex items-center justify-between">
                          <span className="text-sm text-[var(--text-main)]">{m.username}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            m.is_completed
                              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                          }`}>
                            {m.is_completed ? "Done" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="mt-3 border-t border-[var(--border-main)] pt-3">
                  {editingTaskId === task.id ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[var(--text-soft)] uppercase tracking-wider">Edit members by division</span>
                        {divisions.map((dept) => (
                          <button
                            key={dept}
                            onClick={() => setEditDeptFilter(dept)}
                            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                              editDeptFilter === dept
                                ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                                : "border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)]"
                            }`}
                          >
                            {dept === "all" ? "All" : dept}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {filteredEditUsers.map((u) => {
                          const checked = editAssignees.includes(u.id);
                          return (
                            <label
                              key={`edit-${task.id}-${u.id}`}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                checked
                                  ? "border-cyan-500/40 bg-cyan-500/10"
                                  : "border-[var(--border-main)] hover:border-cyan-500/30"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleEditAssigneeToggle(u.id)}
                                className="accent-cyan-500"
                              />
                              <div>
                                <p className="text-sm text-[var(--text-main)]">{u.username}{u.id === user?.id ? " (Me)" : ""}</p>
                                <p className="text-xs text-[var(--text-soft)]">{u.dept_name || "No Division"}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveAssignees(task.id)}
                          disabled={savingTaskId === task.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold disabled:opacity-60"
                        >
                          <Save className="w-4 h-4" />
                          {savingTaskId === task.id ? "Saving..." : "Save Members"}
                        </button>
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="px-3 py-2 rounded-lg border border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)] text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditAssignees(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-main)] text-[var(--text-soft)] hover:text-cyan-400 hover:border-cyan-500/40 text-sm"
                    >
                      <Users className="w-4 h-4" />
                      Edit Members
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
