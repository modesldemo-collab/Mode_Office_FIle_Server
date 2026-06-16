import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Folder,
  Calendar,
  Edit3,
  Clock,
  PlusCircle,
  Briefcase,
  Paperclip,
  UploadCloud,
  Download,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Eye
} from "lucide-react";
import { Auth, TasksAPI, ProjectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils";
import { NavCtx } from "../layout/Sidebar";
import { Modal } from "../components/Modal";

export function TasksPage() {
  const { user } = useAuth();
  const { setPage: setAppPage } = React.useContext(NavCtx);

  // Lists
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [activeTaskForAttachments, setActiveTaskForAttachments] = useState(null);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [activeProjectForAttachments, setActiveProjectForAttachments] = useState(null);
  const [projectAttachments, setProjectAttachments] = useState([]);
  const [showFeedbackInputUserId, setShowFeedbackInputUserId] = useState(null);
  const [reviewFeedbackText, setReviewFeedbackText] = useState("");
  const [submissionText, setSubmissionText] = useState("");

  // Form values - Project
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [selectedProjectIdForEdit, setSelectedProjectIdForEdit] = useState(null);

  // Form values - Task
  const [taskName, setTaskName] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [selectedTaskProject, setSelectedTaskProject] = useState("");
  const [selectedTaskUsers, setSelectedTaskUsers] = useState([]);
  const [taskFilterDept, setTaskFilterDept] = useState("all");
  const [selectedTaskIdForEdit, setSelectedTaskIdForEdit] = useState(null);

  // Edit Assignees inside list state
  const [editingAssigneeTaskId, setEditingAssigneeTaskId] = useState(null);
  const [editAssignees, setEditAssignees] = useState([]);
  const [editAssigneesDeptFilter, setEditAssigneesDeptFilter] = useState("all");

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
    if (taskFilterDept === "all") return allUsers;
    return allUsers.filter((u) => (u.dept_name || "No Division") === taskFilterDept);
  }, [allUsers, taskFilterDept]);

  const filteredEditUsers = useMemo(() => {
    if (editAssigneesDeptFilter === "all") return allUsers;
    return allUsers.filter((u) => (u.dept_name || "No Division") === editAssigneesDeptFilter);
  }, [allUsers, editAssigneesDeptFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        ProjectsAPI.list(),
        TasksAPI.list()
      ]);
      setProjects(pRes.data || []);
      setTasks(tRes.data || []);
    } catch (err) {
      console.error("Error loading projects/tasks data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    Auth.shareUsers().then((r) => setUsers(r.data || []));
  }, [fetchData]);

  // Attachment & Review Handlers
  const fetchTaskAttachments = async (taskId) => {
    try {
      const res = await TasksAPI.getAttachments(taskId);
      setTaskAttachments(res.data || []);
    } catch (err) {
      console.error("Error loading task attachments:", err);
    }
  };

  const handleUploadAttachment = async (taskId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingAttachment(true);
    try {
      await TasksAPI.uploadAttachment(taskId, formData);
      await fetchTaskAttachments(taskId);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (taskId, attachmentId) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await TasksAPI.deleteAttachment(attachmentId);
      await fetchTaskAttachments(taskId);
    } catch (err) {
      alert("Failed to delete attachment");
    }
  };

  const fetchProjectAttachments = async (projectId) => {
    try {
      const res = await ProjectsAPI.getAttachments(projectId);
      setProjectAttachments(res.data || []);
    } catch (err) {
      console.error("Error loading project attachments:", err);
    }
  };

  const handleSubmitForReview = async (taskId, textValue = "") => {
    try {
      await TasksAPI.submitForReview(taskId, { submission_text: textValue });
      alert("Task submitted for review!");
      await fetchData();
      const freshList = await TasksAPI.list();
      const updatedT = freshList.data?.find((t) => t.id === taskId);
      if (updatedT) setActiveTaskForAttachments(updatedT);
    } catch (err) {
      alert("Failed to submit task for review");
    }
  };

  const handleReviewTask = async (taskId, userId, status, feedback = "") => {
    try {
      await TasksAPI.reviewTask(taskId, {
        user_id: userId,
        status,
        feedback: feedback.trim() || null,
      });
      alert(`Task marked as ${status === "approved" ? "Approved" : "Needs Changes"}`);
      setShowFeedbackInputUserId(null);
      setReviewFeedbackText("");
      await fetchData();
      const freshList = await TasksAPI.list();
      const updatedT = freshList.data?.find((t) => t.id === taskId);
      if (updatedT) setActiveTaskForAttachments(updatedT);
    } catch (err) {
      alert("Failed to review task");
    }
  };

  const openTaskAttachmentsModal = async (task) => {
    setActiveTaskForAttachments(task);
    await fetchTaskAttachments(task.id);
    const myM = (task.assignees || []).find((m) => m.user_id === user?.id);
    setSubmissionText(myM?.submission_text || "");
  };

  // Standalone tasks filter
  const standaloneTasks = useMemo(() => {
    return tasks.filter((t) => !t.project_id);
  }, [tasks]);

  // Project handlers
  const handleCreateProject = async () => {
    if (!projectName.trim()) return alert("Project name is required");
    setActionLoading(true);
    try {
      await ProjectsAPI.create({
        project_name: projectName.trim(),
        description: projectDescription.trim(),
        deadline: projectDeadline || null
      });
      setProjectName("");
      setProjectDescription("");
      setProjectDeadline("");
      setCreateProjectOpen(false);
      await fetchData();
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditProject = (project) => {
    setSelectedProjectIdForEdit(project.id);
    setProjectName(project.project_name);
    setProjectDescription(project.description || "");
    setProjectDeadline(project.deadline ? project.deadline.split("T")[0] : "");
    setEditProjectOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!projectName.trim()) return alert("Project name is required");
    setActionLoading(true);
    try {
      await ProjectsAPI.update(selectedProjectIdForEdit, {
        project_name: projectName.trim(),
        description: projectDescription.trim(),
        deadline: projectDeadline || null
      });
      setEditProjectOpen(false);
      await fetchData();
    } catch (err) {
      alert("Failed to update project details");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm("Are you sure you want to delete this project? All tasks inside it will be permanently deleted.")) return;
    try {
      await ProjectsAPI.delete(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  // Task handlers
  const openCreateTask = (projectId = "") => {
    setSelectedTaskProject(projectId);
    setTaskName("");
    setTaskDeadline("");
    setSelectedTaskUsers([]);
    setTaskFilterDept("all");
    setCreateTaskOpen(true);
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) return alert("Task name is required");
    setActionLoading(true);
    try {
      await TasksAPI.create({
        task_name: taskName.trim(),
        deadline: taskDeadline || null,
        project_id: selectedTaskProject ? Number(selectedTaskProject) : null,
        assigned_to_users: selectedTaskUsers.length ? selectedTaskUsers : [user.id]
      });
      setCreateTaskOpen(false);
      await fetchData();
    } catch (err) {
      alert("Failed to create task");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditTask = (task) => {
    setSelectedTaskIdForEdit(task.id);
    setTaskName(task.task_name);
    setTaskDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    setEditTaskOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!taskName.trim()) return alert("Task name is required");
    setActionLoading(true);
    try {
      await TasksAPI.updateDetails(selectedTaskIdForEdit, {
        task_name: taskName.trim(),
        deadline: taskDeadline || null
      });
      setEditTaskOpen(false);
      await fetchData();
    } catch (err) {
      alert("Failed to update task");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await TasksAPI.delete(id);
    await fetchData();
  };

  const handleTickTask = async (task, checked) => {
    const nextStatus = checked ? "completed" : "pending";
    await TasksAPI.updateStatus(task.id, { status: nextStatus });
    await fetchData();
  };

  // Assignee Management handlers
  const startEditAssignees = (task) => {
    setEditingAssigneeTaskId(task.id);
    setEditAssignees((task.assignees || []).map((a) => a.user_id));
    setEditAssigneesDeptFilter("all");
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
    setActionLoading(true);
    try {
      await TasksAPI.assign(taskId, { assigned_to_users: editAssignees });
      setEditingAssigneeTaskId(null);
      await fetchData();
    } catch (err) {
      alert("Failed to save assignees");
    } finally {
      setActionLoading(false);
    }
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

  const renderTaskItem = (task) => {
    const canManage = user?.role === "admin" || task.assigned_by === user?.id;
    const myMember = (task.assignees || []).find((m) => m.user_id === user?.id);
    const canTickOwn = !!myMember && !canManage;
    const membersByDivision = groupByDivision(task.assignees || []);

    return (
      <div key={task.id} className="border border-[var(--border-main)] bg-[var(--bg-soft)]/40 hover:bg-[var(--bg-soft)]/80 rounded-xl p-4 transition-all">
        <div className="flex flex-wrap gap-2 justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-[var(--text-main)] truncate text-sm">
                #{task.id} {task.task_name}
              </span>
            </div>
            <p className="text-xs text-[var(--text-soft)] mt-1">
              Assigned by: {task.assigned_by_name || "Unknown"}
            </p>
            {task.deadline && (
              <p className="text-xs flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> Deadline: {task.deadline.split("T")[0]}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
              task.status === "completed"
                ? "text-emerald-800 bg-emerald-100 border-emerald-200 dark:text-emerald-500 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                : "text-amber-800 bg-amber-100 border-amber-200 dark:text-amber-500 dark:border-amber-500/30 dark:bg-amber-500/10"
            }`}>
              {task.completed_members || 0}/{task.total_members || 0} Done
            </span>

            <button
              onClick={() => openTaskAttachmentsModal(task)}
              className="p-1 text-[var(--text-soft)] hover:text-cyan-500 rounded hover:bg-[var(--bg-soft)] transition-all"
              title="Task Attachments & Reviews"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {canManage && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditTask(task)}
                  className="p-1 text-[var(--text-soft)] hover:text-cyan-500 rounded hover:bg-[var(--bg-soft)] transition-all"
                  title="Extend Deadline / Rename"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 text-[var(--text-soft)] hover:text-red-500 rounded hover:bg-[var(--bg-soft)] transition-all"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {canTickOwn && (
          <div className="mt-2 flex flex-wrap gap-2 items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-main)] cursor-pointer">
              <input
                type="checkbox"
                checked={myMember.is_completed}
                onChange={(e) => handleTickTask(task, e.target.checked)}
                className="accent-emerald-500"
              />
              <span>I completed this task</span>
            </label>
            
            <button
              onClick={() => openTaskAttachmentsModal(task)}
              className="text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 px-2 py-0.5 rounded-lg bg-cyan-500/5 transition-all"
            >
              Submit Document / Check Status
            </button>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {Object.keys(membersByDivision).sort().map((division) => (
            <div key={division} className="text-xs">
              <span className="text-[var(--text-muted)] font-medium uppercase tracking-wider text-[10px]">{division}:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {membersByDivision[division].map((m) => {
                  let statusColor = "text-amber-800 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30";
                  let statusSymbol = "⋯";
                  let statusTitle = "Pending";
                  
                  if (m.approval_status === "approved" || m.is_completed) {
                    statusColor = "text-emerald-800 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30";
                    statusSymbol = "✓";
                    statusTitle = "Approved";
                  } else if (m.approval_status === "submitted") {
                    statusColor = "text-cyan-800 bg-cyan-100 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/30";
                    statusSymbol = "⏳";
                    statusTitle = "Submitted for Review";
                  } else if (m.approval_status === "needs_changes") {
                    statusColor = "text-rose-800 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30";
                    statusSymbol = "⚠";
                    statusTitle = "Needs Changes";
                  }
                  
                  return (
                    <span
                      key={m.user_id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColor}`}
                      title={`Status: ${statusTitle}${m.feedback ? ` | Feedback: ${m.feedback}` : ""}`}
                    >
                      {m.username} {statusSymbol}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {canManage && (
          <div className="mt-3 pt-3 border-t border-[var(--border-main)]">
            {editingAssigneeTaskId === task.id ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {divisions.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setEditAssigneesDeptFilter(dept)}
                      className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                        editAssigneesDeptFilter === dept
                          ? "border-cyan-500/40 bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300"
                          : "border-[var(--border-main)] text-[var(--text-soft)]"
                      }`}
                    >
                      {dept === "all" ? "All" : dept}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto p-1 bg-[var(--bg-soft)] rounded-lg">
                  {filteredEditUsers.map((u) => {
                    const checked = editAssignees.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-1.5 text-xs text-[var(--text-main)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleEditAssigneeToggle(u.id)}
                          className="accent-cyan-500"
                        />
                        <span className="truncate">{u.username}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveAssignees(task.id)}
                    className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingAssigneeTaskId(null)}
                    className="px-2 py-1 rounded border border-[var(--border-main)] text-[var(--text-soft)] text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startEditAssignees(task)}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--text-soft)] hover:text-cyan-400"
              >
                <Users className="w-3.5 h-3.5" />
                Change Members
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header section */}
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-[var(--text-main)] text-xl font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-500" /> Project Management
          </h2>
          <p className="text-[var(--text-soft)] text-sm mt-1">
            Create projects, extend deadlines, assign multiple tasks and team members.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCreateProjectOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-transparent transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
          <button
            onClick={() => openCreateTask()}
            className="flex items-center gap-2 bg-[var(--bg-soft)] hover:bg-[var(--bg-panel)] text-[var(--text-main)] text-sm font-semibold px-4 py-2.5 rounded-xl border border-[var(--border-main)] hover:border-cyan-500/40 transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-cyan-500" /> New Task
          </button>
          <button
            onClick={() => setAppPage("completedTasks")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/40 transition-all whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Completed Tasks
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

      {loading ? (
        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-12 text-center text-[var(--text-soft)]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-500" />
          Loading project workspace...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Projects Iteration */}
          {projects.map((project) => {
            const totalTasks = project.tasks?.length || 0;
            const completedTasks = project.tasks?.filter((t) => t.status === "completed").length || 0;
            const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            const isOwner = user?.role === "admin" || project.owner_id === user?.id;

            return (
              <div key={project.id} className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder className="w-5 h-5 text-cyan-500" />
                      <h3 className="text-[var(--text-main)] text-lg font-bold">{project.project_name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full font-medium">
                        Project #{project.id}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-[var(--text-soft)] max-w-2xl">{project.description}</p>
                    )}
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Owner: <span className="text-[var(--text-soft)] font-medium">{project.owner_name || "System"}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {project.deadline && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: {project.deadline.split("T")[0]}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        setActiveProjectForAttachments(project);
                        await fetchProjectAttachments(project.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-soft)] hover:text-cyan-500 border border-[var(--border-main)] hover:border-cyan-500/40 rounded-lg transition-colors"
                      title="View all project files"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Attachments Space
                    </button>
                    {isOwner && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditProject(project)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-soft)] hover:text-cyan-500 border border-[var(--border-main)] hover:border-cyan-500/40 rounded-lg transition-colors"
                          title="Extend Deadline / Edit Project"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Project
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-soft)] hover:text-red-500 border border-[var(--border-main)] hover:border-red-500/40 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[var(--text-soft)]">Task Completion Progress</span>
                    <span className="text-cyan-500">{percent}% ({completedTasks}/{totalTasks})</span>
                  </div>
                  <div className="w-full bg-[var(--bg-soft)] rounded-full h-2 overflow-hidden border border-[var(--border-main)]">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
                    <h4 className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider">Project Tasks</h4>
                    <button
                      onClick={() => openCreateTask(project.id)}
                      className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>
                  
                  {totalTasks === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-main)] rounded-xl">
                      No tasks assigned to this project yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {project.tasks.map(renderTaskItem)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Standalone Tasks Card */}
          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <h3 className="text-[var(--text-main)] text-lg font-bold">Standalone Tasks</h3>
              </div>
              <button
                onClick={() => openCreateTask("")}
                className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Quick Task
              </button>
            </div>

            {standaloneTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-main)] rounded-xl">
                No standalone tasks found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {standaloneTasks.map(renderTaskItem)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      <Modal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} title="Create New Project">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Mode Office File Server Upgrade"
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Brief overview of the project objectives..."
              rows={3}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Deadline (Optional)</label>
            <input
              type="date"
              value={projectDeadline}
              onChange={(e) => setProjectDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleCreateProject}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {actionLoading ? "Creating Project..." : "Create Project"}
          </button>
        </div>
      </Modal>

      {/* EDIT PROJECT MODAL */}
      <Modal open={editProjectOpen} onClose={() => setEditProjectOpen(false)} title="Extend Deadline / Edit Project">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Project Deadline</label>
            <input
              type="date"
              value={projectDeadline}
              onChange={(e) => setProjectDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleUpdateProject}
            disabled={actionLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? "Updating Project..." : "Save Project Details"}
          </button>
        </div>
      </Modal>

      {/* CREATE TASK MODAL */}
      <Modal open={createTaskOpen} onClose={() => setCreateTaskOpen(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Design Database Schema"
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Project Association</label>
            <select
              value={selectedTaskProject}
              onChange={(e) => setSelectedTaskProject(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">Standalone Task (No Project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Task Deadline (Optional)</label>
            <input
              type="date"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Assign Members</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {divisions.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setTaskFilterDept(dept)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    taskFilterDept === dept
                      ? "border-cyan-500/40 bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300"
                      : "border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {dept === "all" ? "All" : dept}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-[var(--border-main)] bg-[var(--bg-soft)]/50 rounded-xl">
              {filteredCreateUsers.map((u) => {
                const checked = selectedTaskUsers.includes(u.id);
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
                      onChange={() => {
                        setSelectedTaskUsers((prev) =>
                          prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        );
                      }}
                      className="accent-cyan-500"
                    />
                    <div>
                      <p className="text-xs text-[var(--text-main)]">{u.username}{u.id === user?.id ? " (Me)" : ""}</p>
                      <p className="text-[10px] text-[var(--text-soft)]">{u.dept_name || "No Division"}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <button
            onClick={handleCreateTask}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {actionLoading ? "Adding Task..." : "Add Task"}
          </button>
        </div>
      </Modal>

      {/* EDIT TASK DETAILS MODAL */}
      <Modal open={editTaskOpen} onClose={() => setEditTaskOpen(false)} title="Extend Task Deadline / Edit Details">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wider mb-2">Task Deadline</label>
            <input
              type="date"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleUpdateTask}
            disabled={actionLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? "Updating Task..." : "Save Task Details"}
          </button>
        </div>
      </Modal>

      {/* TASK ATTACHMENTS & REVIEW MODAL */}
      <Modal
        open={!!activeTaskForAttachments}
        onClose={() => {
          setActiveTaskForAttachments(null);
          setShowFeedbackInputUserId(null);
          setReviewFeedbackText("");
        }}
        title={`Task: ${activeTaskForAttachments?.task_name || ""}`}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Upload Attachment */}
          <div className="border border-[var(--border-main)] rounded-xl p-4 bg-[var(--bg-soft)]/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cyan-500" /> Upload Task Document
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="task-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadAttachment(activeTaskForAttachments.id, e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="task-file-input"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                {uploadingAttachment ? "Uploading..." : "Select & Upload File"}
              </label>
              <span className="text-xs text-[var(--text-muted)]">
                Provide reports, document drafts, or completed forms.
              </span>
            </div>
          </div>

          {/* Section 2: List Attachments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-cyan-500" /> Attachments List
            </h4>
            {taskAttachments.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-2">No attachments uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {taskAttachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-xl hover:bg-[var(--bg-soft)] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-main)] truncate">{file.file_name}</p>
                        <p className="text-[10px] text-[var(--text-soft)]">
                          Uploaded by: {file.uploader_name || "Unknown"} • {Math.round(file.file_size / 1024)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={TasksAPI.previewAttachmentUrl(file.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[var(--text-soft)] hover:text-cyan-500 hover:bg-[var(--bg-soft)] rounded-lg transition-colors"
                        title="Preview File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={TasksAPI.downloadAttachmentUrl(file.id)}
                        className="p-1.5 text-[var(--text-soft)] hover:text-cyan-500 hover:bg-[var(--bg-soft)] rounded-lg transition-colors"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {(user?.role === "admin" ||
                        activeTaskForAttachments?.assigned_by === user?.id ||
                        file.uploader_id === user?.id) && (
                        <button
                          onClick={() => handleDeleteAttachment(activeTaskForAttachments.id, file.id)}
                          className="p-1.5 text-[var(--text-soft)] hover:text-red-500 hover:bg-[var(--bg-soft)] rounded-lg transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Review Flow */}
          <div className="space-y-3 pt-2 border-t border-[var(--border-main)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-soft)] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-500" /> Assignee Completion & Approval Status
            </h4>
            <div className="space-y-3">
              {(activeTaskForAttachments?.assignees || []).map((m) => {
                const isMySubmission = m.user_id === user?.id;
                const isReviewer =
                  user?.role === "admin" || activeTaskForAttachments?.assigned_by === user?.id;

                let badgeColor = "text-amber-800 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30";
                let statusLabel = "Pending";
                if (m.approval_status === "approved" || m.is_completed) {
                  badgeColor = "text-emerald-800 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30";
                  statusLabel = "Approved";
                } else if (m.approval_status === "submitted") {
                  badgeColor = "text-cyan-800 bg-cyan-100 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/30";
                  statusLabel = "Submitted (Waiting Approval)";
                } else if (m.approval_status === "needs_changes") {
                  badgeColor = "text-rose-800 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30";
                  statusLabel = "Needs Changes";
                }

                return (
                  <div
                    key={m.user_id}
                    className="p-4 bg-[var(--bg-soft)]/30 border border-[var(--border-main)] rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">
                          {m.username} {isMySubmission && " (You)"}
                        </p>
                        <p className="text-[10px] text-[var(--text-soft)]">{m.dept_name || "No Division"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {m.submitted_at && (
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Submitted at: {new Date(m.submitted_at).toLocaleString()}
                      </p>
                    )}

                    {m.feedback && (
                      <div className="p-2.5 bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Reviewer Feedback:</p>
                          <p>{m.feedback}</p>
                        </div>
                      </div>
                    )}

                    {m.submission_text && (
                      <div className="p-3 bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-lg text-xs space-y-1">
                        <p className="font-bold text-[var(--text-soft)] uppercase tracking-wider text-[9px]">Submitted Work / Notes:</p>
                        <p className="text-[var(--text-main)] whitespace-pre-wrap">{m.submission_text}</p>
                      </div>
                    )}

                    {/* Junior User Submission Control */}
                    {isMySubmission && m.approval_status !== "approved" && (
                      <div className="pt-2 border-t border-[var(--border-main)]/50 space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-[var(--text-soft)] uppercase tracking-wider">
                            Your written updates / notes:
                          </label>
                          <textarea
                             value={submissionText}
                             onChange={(e) => setSubmissionText(e.target.value)}
                             placeholder="Write details of your work, paste document texts, or add comments here..."
                             rows={3}
                             className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-cyan-500 resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSubmitForReview(activeTaskForAttachments.id, submissionText)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            {m.approval_status === "submitted" ? "Update Work Submission" : "Submit Work for Review"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Senior User Review Controls */}
                    {isReviewer && m.approval_status === "submitted" && (
                      <div className="pt-2 border-t border-[var(--border-main)]/50 space-y-2">
                        <p className="text-xs font-bold text-[var(--text-soft)]">Review Decision:</p>
                        
                        {showFeedbackInputUserId === m.user_id ? (
                          <div className="space-y-2">
                            <textarea
                              value={reviewFeedbackText}
                              onChange={(e) => setReviewFeedbackText(e.target.value)}
                              placeholder="Describe changes required to improve the task..."
                              rows={2}
                              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-cyan-500"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleReviewTask(activeTaskForAttachments.id, m.user_id, "needs_changes", reviewFeedbackText)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded-md transition-colors"
                              >
                                Send Feedback
                              </button>
                              <button
                                onClick={() => {
                                  setShowFeedbackInputUserId(null);
                                  setReviewFeedbackText("");
                                }}
                                className="px-2.5 py-1 border border-[var(--border-main)] text-[var(--text-soft)] text-[11px] rounded-md"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReviewTask(activeTaskForAttachments.id, m.user_id, "approved")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Submission
                            </button>
                            <button
                              onClick={() => setShowFeedbackInputUserId(m.user_id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Request Changes
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* PROJECT ATTACHMENTS SPACE MODAL */}
      <Modal
        open={!!activeProjectForAttachments}
        onClose={() => setActiveProjectForAttachments(null)}
        title={`Project Space: ${activeProjectForAttachments?.project_name || ""}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-[var(--text-soft)]">
            A dedicated shared space showing all files and documents uploaded for the tasks of this project.
          </p>

          {projectAttachments.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[var(--border-main)] rounded-xl">
              <Paperclip className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">No attachments found in this project workspace.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectAttachments.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-xl flex items-center justify-between hover:bg-[var(--bg-soft)] transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-main)] truncate">{file.file_name}</p>
                      <p className="text-[10px] text-[var(--text-soft)] truncate">
                        Task: <span className="font-semibold">{file.task_name}</span> • By: {file.uploader_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={TasksAPI.previewAttachmentUrl(file.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-[var(--text-soft)] hover:text-cyan-500 hover:bg-[var(--bg-soft)] rounded transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={TasksAPI.downloadAttachmentUrl(file.id)}
                      className="p-1 text-[var(--text-soft)] hover:text-cyan-500 hover:bg-[var(--bg-soft)] rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
