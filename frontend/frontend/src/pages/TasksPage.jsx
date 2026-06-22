import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Folder,
  Calendar,
  Clock,
  PlusCircle,
  Briefcase,
  Paperclip,
  Upload,
  Download,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Eye,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  FileText
} from "lucide-react";
import { Auth, TasksAPI, ProjectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils";
import { NavCtx } from "../layout/Sidebar";
import { Modal } from "../components/Modal";

export function TasksPage() {
  const { user } = useAuth();
  const { setPage: setAppPage } = React.useContext(NavCtx);

  // Lists state
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Navigation states
  const [selectedProjectId, setSelectedProjectId] = useState(null); // Drill down to project tasks
  const [selectedTaskId, setSelectedTaskId] = useState(null);       // Open task workspace view

  // Modal states
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editAssigneesOpen, setEditAssigneesOpen] = useState(false);

  // Attachment and upload states
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Form states - Projects
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [selectedProjectIdForEdit, setSelectedProjectIdForEdit] = useState(null);

  // Form states - Tasks
  const [taskName, setTaskName] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [selectedTaskProject, setSelectedTaskProject] = useState("");
  const [selectedTaskUsers, setSelectedTaskUsers] = useState([]);
  const [taskFilterDept, setTaskFilterDept] = useState("all");
  const [selectedTaskIdForEdit, setSelectedTaskIdForEdit] = useState(null);

  // Inline members update state
  const [editAssignees, setEditAssignees] = useState([]);
  const [editAssigneesDeptFilter, setEditAssigneesDeptFilter] = useState("all");

  // User progress input
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  
  // Review feedback
  const [showFeedbackInputUserId, setShowFeedbackInputUserId] = useState(null);
  const [reviewFeedbackText, setReviewFeedbackText] = useState("");

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

  // Load and refresh core lists
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
      console.error("Error loading project workspace data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    Auth.shareUsers().then((r) => setUsers(r.data || []));
  }, [fetchData]);

  // Refresh active task state & attachments when workspace is open
  const fetchTaskAttachments = async (taskId) => {
    try {
      const res = await TasksAPI.getAttachments(taskId);
      setTaskAttachments(res.data || []);
    } catch (err) {
      console.error("Error loading task attachments:", err);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#view-") && tasks.length > 0) {
      const targetId = Number(hash.replace("#view-", ""));
      const t = tasks.find((x) => x.id === targetId);
      if (t) {
        handleOpenTaskWorkspace(t);
        window.location.hash = "";
      }
    }
  }, [tasks, user]);

  const activeTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const activeProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Open task workspace
  const handleOpenTaskWorkspace = async (task) => {
    setSelectedTaskId(task.id);
    await fetchTaskAttachments(task.id);
    const myM = (task.assignees || []).find((m) => m.user_id === user?.id);
    setSubmissionText(myM?.submission_text || "");
    setSubmissionFile(null);
    setShowFeedbackInputUserId(null);
    setReviewFeedbackText("");
  };

  // Upload handlers
  const handleUploadFile = async (file) => {
    if (!file || !selectedTaskId) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingAttachment(true);
    try {
      await TasksAPI.uploadAttachment(selectedTaskId, formData);
      await fetchTaskAttachments(selectedTaskId);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("Are you sure you want to remove this attached file?")) return;
    try {
      await TasksAPI.deleteAttachment(attachmentId);
      if (selectedTaskId) {
        await fetchTaskAttachments(selectedTaskId);
      }
    } catch (err) {
      alert("Failed to delete attachment");
    }
  };

  // Junior User: submit updates
  const handleSubmitProgress = async () => {
    if (!selectedTaskId) return;
    setActionLoading(true);
    try {
      let payload;
      if (submissionFile) {
        payload = new FormData();
        payload.append("submission_text", submissionText.trim());
        payload.append("file", submissionFile);
      } else {
        payload = { submission_text: submissionText.trim() };
      }
      await TasksAPI.submitForReview(selectedTaskId, payload);
      alert("Your daily log has been submitted successfully!");
      setSubmissionFile(null);
      await fetchData();
    } catch (err) {
      alert("Failed to submit progress update");
    } finally {
      setActionLoading(false);
    }
  };

  // Senior User: approve or reject updates (Restricted to creator of task or creator of project)
  const handleReviewDecision = async (assigneeUserId, status, feedback = "") => {
    if (!selectedTaskId) return;
    try {
      await TasksAPI.reviewTask(selectedTaskId, {
        user_id: assigneeUserId,
        status,
        feedback: feedback.trim() || null,
      });
      alert(`Update marked as ${status === "approved" ? "Approved" : "Revision Requested"}`);
      setShowFeedbackInputUserId(null);
      setReviewFeedbackText("");
      await fetchData();
    } catch (err) {
      alert("Failed to save review decision");
    }
  };

  // Create Project
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

  // Edit Project Details
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
    if (!confirm("Are you sure you want to delete this project and all its tasks?")) return;
    try {
      await ProjectsAPI.delete(id);
      setSelectedProjectId(null);
      setSelectedTaskId(null);
      await fetchData();
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  // Create Task
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

  // Edit Task Details
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
    if (selectedTaskId === id) setSelectedTaskId(null);
    await fetchData();
  };

  // Assignee edit
  const startEditAssignees = (task) => {
    setEditAssignees((task.assignees || []).map((a) => a.user_id));
    setEditAssigneesDeptFilter("all");
    setEditAssigneesOpen(true);
  };

  const handleEditAssigneeToggle = (id) => {
    setEditAssignees((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const saveAssignees = async () => {
    if (!editAssignees.length) {
      alert("Please select at least one assigned team member");
      return;
    }
    setActionLoading(true);
    try {
      await TasksAPI.assign(activeTask.id, { assigned_to_users: editAssignees });
      setEditAssigneesOpen(false);
      await fetchData();
    } catch (err) {
      alert("Failed to update task assignees");
    } finally {
      setActionLoading(false);
    }
  };

  // Avatar helper
  const renderAvatar = (name) => {
    if (!name) return null;
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return (
      <div 
        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0" 
        title={name}
      >
        {initials}
      </div>
    );
  };

  // Dashboard calculations
  const dashboardStats = useMemo(() => {
    const totalProjects = projects.length;
    let pendingCount = 0;
    tasks.forEach((t) => {
      (t.assignees || []).forEach((m) => {
        if (m.approval_status === "submitted") pendingCount++;
      });
    });

    const todayStr = new Date().toISOString().split("T")[0];
    let overdueCount = 0;
    tasks.forEach((t) => {
      if (t.deadline && t.status !== "completed" && t.deadline.split("T")[0] < todayStr) {
        overdueCount++;
      }
    });

    return { totalProjects, pendingCount, overdueCount };
  }, [projects, tasks]);

  // Document approval list
  const reviewQueue = useMemo(() => {
    const queue = [];
    tasks.forEach((t) => {
      const projectAssociated = projects.find(p => p.id === t.project_id);
      // Strictly check ownership permission:
      const isOwner = t.assigned_by === user?.id || projectAssociated?.owner_id === user?.id;
      
      (t.assignees || []).forEach((m) => {
        if (m.approval_status === "submitted") {
          queue.push({
            task: t,
            assignee: m,
            projectName: t.project_name || "Standalone Task",
            isAuthorizedToReview: isOwner
          });
        }
      });
    });
    return queue;
  }, [tasks, projects, user]);

  const timelineHighlights = useMemo(() => {
    const list = [];
    projects.forEach((p) => {
      if (p.deadline) {
        list.push({
          title: `Project Target: ${p.project_name}`,
          date: p.deadline.split("T")[0],
          type: "project"
        });
      }
    });
    tasks.forEach((t) => {
      if (t.deadline && t.status !== "completed") {
        list.push({
          title: `Task Target: ${t.task_name}`,
          date: t.deadline.split("T")[0],
          type: "task"
        });
      }
    });
    return list.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);
  }, [projects, tasks]);


  // Computed states for views
  const projectAssociated = activeTask ? projects.find(p => p.id === activeTask.project_id) : null;
  const myMember = activeTask ? (activeTask.assignees || []).find((m) => m.user_id === user?.id) : null;
  const isOwner = activeTask ? (activeTask.assigned_by === user?.id || projectAssociated?.owner_id === user?.id) : false;
  const canSubmit = activeTask ? (!!myMember && myMember.approval_status !== "approved") : false;
  const deadlineDisplay = activeTask ? (activeTask.deadline ? activeTask.deadline.split("T")[0] : "No target date set") : "";

  const projectTasks = activeProject ? tasks.filter((t) => t.project_id === activeProject.id) : [];
  const isProjectOwner = activeProject ? (activeProject.owner_id === user?.id || user?.role === "admin") : false;

  return (
    <div className="space-y-6">
      
      {/* ----------------------------------------------------
          VIEWS RENDERING GATED IN A SINGLE OUTER WRAPPER
         ---------------------------------------------------- */}

      {selectedTaskId && activeTask ? (
        
        // 1. SIMPLE TASK WORKSPACE VIEW
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Simple Top Navigation Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
            <button 
              onClick={() => setSelectedTaskId(null)} 
              className="flex items-center gap-2 text-sm lg:text-base font-bold text-blue-500 hover:underline"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={() => openEditTask(activeTask)}
                  className="px-4 py-2 border border-[var(--border-main)] text-sm font-bold rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-soft)] text-[var(--text-main)]"
                >
                  Change Target Date
                </button>
              )}
            </div>
          </div>

          {/* Task Main Headers */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 space-y-2">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              {projectAssociated ? `Project: ${projectAssociated.project_name}` : "Standalone Task"}
            </p>
            <h2 className="text-2xl font-black text-[var(--text-main)]">
              {activeTask.task_name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-[var(--text-soft)] pt-2">
              <p>Target Completion: <strong className="text-[var(--text-main)]">{deadlineDisplay}</strong></p>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-main)]" />
              <p>Task ID: <strong className="text-[var(--text-main)]">#{activeTask.id}</strong></p>
            </div>
          </div>

          {/* Dedicated Supporting Documents & Attachments Section (Visible to everyone) */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-blue-500" /> Supporting Documents & Attachments
              </h3>
              <span className="text-xs bg-[var(--bg-soft)] px-2.5 py-1 rounded-full text-[var(--text-soft)] font-bold">
                {taskAttachments.length} {taskAttachments.length === 1 ? "File" : "Files"}
              </span>
            </div>

            {taskAttachments.length === 0 ? (
              <p className="text-sm text-[var(--text-soft)] italic py-2">
                No documents or files have been attached to this task yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {taskAttachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3.5 bg-[var(--bg-soft)]/30 border border-[var(--border-main)] rounded-xl text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text-main)] truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                        <p className="text-[10px] text-[var(--text-soft)] mt-0.5">
                          Uploaded by {file.uploader_name || "Team Member"} • {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={TasksAPI.downloadAttachmentUrl(file.id)}
                        className="px-2.5 py-1.5 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 rounded-lg text-xs font-bold transition-all"
                      >
                        Download
                      </a>
                      {(isOwner || file.uploader_id === user?.id) && (
                        <button
                          onClick={() => handleDeleteAttachment(file.id)}
                          className="px-2.5 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Panel for Assignees: Step-by-Step submission */}
          {canSubmit && (
            <div className="bg-[var(--bg-panel)] border-2 border-blue-500/20 rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-3">
                Submit Your Progress Update
              </h3>

              {/* Step 1: Text box */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--text-main)]">
                  Step 1: Write down what you achieved today
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Write a simple sentence describing your progress (e.g., Prepared the draft budget proposal and shared with coordinator)."
                  rows={5}
                  className="w-full bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] text-base focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Step 2: Attachments */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[var(--text-main)]">
                  Step 2: Add files or documents (Optional)
                </label>
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="simple-file-picker"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSubmissionFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label 
                    htmlFor="simple-file-picker"
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm cursor-pointer shadow transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Select File from Computer
                  </label>
                  {submissionFile ? (
                    <div className="flex items-center gap-2 bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)]">
                      <span className="font-semibold truncate max-w-xs">{submissionFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSubmissionFile(null)}
                        className="text-red-500 hover:text-red-400 font-bold ml-1.5"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-soft)]">
                      No file attached to this submission.
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Action */}
              <div className="pt-4 border-t border-[var(--border-main)] flex items-center justify-between">
                <p className="text-xs text-[var(--text-soft)]">
                  Make sure you check your text and files before submitting.
                </p>
                <button
                  onClick={handleSubmitProgress}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-black text-sm rounded-xl shadow hover:opacity-90 transition-opacity"
                >
                  {actionLoading ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </div>
          )}

          {/* Update History and Status Timeline */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-3">
              Review & Approval Status
            </h3>

            <div className="space-y-4">
              {(activeTask.assignees || []).map((m) => {
                let statusText = "Waiting for Progress Update";
                let badgeStyle = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                if (m.approval_status === "approved" || m.is_completed) {
                  statusText = "Approved";
                  badgeStyle = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                } else if (m.approval_status === "submitted") {
                  statusText = "Submitted - Under Review";
                  badgeStyle = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                } else if (m.approval_status === "needs_changes") {
                  statusText = "Revision Requested";
                  badgeStyle = "bg-red-500/10 text-red-500 border-red-500/20";
                }

                return (
                  <div key={m.user_id} className="p-4 bg-[var(--bg-soft)]/20 border border-[var(--border-main)] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-main)]">{m.username}</p>
                        <p className="text-xs text-[var(--text-soft)]">{m.dept_name || "No Division"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${badgeStyle}`}>
                        {statusText}
                      </span>
                    </div>

                    {m.submission_text ? (
                      <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl text-sm space-y-2">
                        <div>
                          <p className="text-xs font-bold text-[var(--text-soft)] uppercase mb-1">Submitted Notes:</p>
                          <p className="text-[var(--text-main)] whitespace-pre-wrap">{m.submission_text}</p>
                        </div>
                        {m.file_name && (
                          <div className="pt-2 border-t border-[var(--border-main)]/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="font-semibold text-[var(--text-main)] text-xs truncate max-w-xs md:max-w-md" title={m.file_name}>
                                {m.file_name}
                              </span>
                            </div>
                            <a 
                              href={TasksAPI.downloadAssignmentAttachmentUrl(activeTask.id, m.user_id)} 
                              className="text-blue-500 hover:underline font-bold text-xs"
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-soft)] italic">No progress logs submitted yet.</p>
                    )}

                    {/* General task attachments uploaded by this assignee */}
                    {(() => {
                      const userAttachments = taskAttachments.filter(
                        (att) => att.uploader_id === m.user_id
                      );
                      if (userAttachments.length === 0) return null;
                      return (
                        <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl text-sm space-y-2">
                          <p className="text-xs font-bold text-[var(--text-soft)] uppercase mb-1">
                            Associated Task Attachments:
                          </p>
                          <div className="space-y-1.5">
                            {userAttachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center justify-between p-2.5 bg-[var(--bg-soft)]/40 border border-[var(--border-main)] rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                  <span
                                    className="font-semibold text-[var(--text-main)] truncate max-w-xs md:max-w-md"
                                    title={att.file_name}
                                  >
                                    {att.file_name}
                                  </span>
                                </div>
                                <a
                                  href={TasksAPI.downloadAttachmentUrl(att.id)}
                                  className="text-blue-500 hover:underline font-bold text-xs flex-shrink-0"
                                >
                                  Download File
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {m.feedback && (
                      <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-sm text-red-500">
                        <p className="font-bold text-xs uppercase mb-1">Correction Needed / Instructions:</p>
                        <p>{m.feedback}</p>
                      </div>
                    )}

                    {/* Supervisor decision box (Strictly visible only to project/task owner) */}
                    {isOwner && m.approval_status === "submitted" && (
                      <div className="pt-3 border-t border-[var(--border-main)]/50 space-y-3 mt-3">
                        <p className="font-bold text-[var(--text-main)] text-sm">Supervisor Decisions:</p>
                        
                        {showFeedbackInputUserId === m.user_id ? (
                          <div className="space-y-2 bg-[var(--bg-panel)] p-4 rounded-xl border border-[var(--border-main)]">
                            <label className="block text-xs font-bold text-red-400 uppercase">Write instructions for correction:</label>
                            <textarea
                              value={reviewFeedbackText}
                              onChange={(e) => setReviewFeedbackText(e.target.value)}
                              placeholder="State what needs to be changed..."
                              rows={3}
                              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg p-2 text-sm text-[var(--text-main)] focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewDecision(m.user_id, "needs_changes", reviewFeedbackText)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg"
                              >
                                Send Revision Request
                              </button>
                              <button
                                onClick={() => {
                                  setShowFeedbackInputUserId(null);
                                  setReviewFeedbackText("");
                                }}
                                className="px-4 py-2 border border-[var(--border-main)] text-[var(--text-soft)] text-xs font-bold rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewDecision(m.user_id, "approved")}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <Check className="w-4 h-4" /> Approve this Work
                            </button>
                            <button
                              onClick={() => setShowFeedbackInputUserId(m.user_id)}
                              className="px-5 py-2.5 bg-red-650 hover:bg-red-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" /> Request Revision (Reject)
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isOwner && m.approval_status === "submitted" && (
                      <p className="text-xs text-[var(--text-soft)] italic pt-2">
                        Waiting for supervisor review. Only the task/project owner ({activeTask.assigned_by_name || projectAssociated?.owner_name || "Supervisor"}) can approve this.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Team List Card */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-main)]">Assigned Team Members</h3>
              {isOwner && (
                <button
                  onClick={() => startEditAssignees(activeTask)}
                  className="text-sm font-bold text-blue-500 hover:underline"
                >
                  Change Team Members
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(activeTask.assignees || []).map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-main)]">
                  {renderAvatar(m.username)}
                  <span>{m.username} ({m.dept_name || "General Division"})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : selectedProjectId && activeProject ? (
        
        // 2. SIMPLE PROJECT DETAILED LIST VIEW
        <div className="space-y-6">
          {/* Back navigation */}
          <div className="pb-4 border-b border-[var(--border-main)] flex items-center justify-between">
            <button 
              onClick={() => setSelectedProjectId(null)} 
              className="flex items-center gap-2 text-sm lg:text-base font-bold text-blue-500 hover:underline"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Ministerial Overview
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => openCreateTask(activeProject.id)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Task to Project
              </button>
              {isProjectOwner && (
                <>
                  <button
                    onClick={() => openEditProject(activeProject)}
                    className="px-3 py-2 border border-[var(--border-main)] text-xs font-bold rounded-xl bg-[var(--bg-panel)] text-[var(--text-main)] hover:bg-[var(--bg-soft)]"
                  >
                    Edit Project
                  </button>
                  <button
                    onClick={() => handleDeleteProject(activeProject.id)}
                    className="px-3 py-2 border border-red-500/20 text-xs font-bold rounded-xl text-red-500 hover:bg-red-500/5"
                  >
                    Delete Project
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Project Header Info Card */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Folder className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-black text-[var(--text-main)]">{activeProject.project_name}</h2>
            </div>
            {activeProject.description && (
              <p className="text-sm text-[var(--text-soft)] leading-relaxed">{activeProject.description}</p>
            )}
            <div className="pt-2 flex items-center gap-4 text-xs text-[var(--text-soft)]">
              <p>Target Date: <strong className="text-[var(--text-main)]">{activeProject.deadline ? activeProject.deadline.split("T")[0] : "No date set"}</strong></p>
              <span className="w-1 h-1 rounded-full bg-[var(--border-main)]" />
              <p>Owner: <strong className="text-[var(--text-main)]">{activeProject.owner_name || "Director General"}</strong></p>
            </div>
          </div>

          {/* Project Tasks */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Project Task List</h3>
            
            {projectTasks.length === 0 ? (
              <div className="text-center py-10 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl text-[var(--text-soft)]">
                No tasks added yet. Click "+ Add Task to Project" to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTaskWorkspace(t)}
                    className="cursor-pointer bg-[var(--bg-panel)] border border-[var(--border-main)] p-5 rounded-2xl hover:border-blue-500/40 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Task #{t.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {t.status === "completed" ? "Completed" : "Active"}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-main)]">{t.task_name}</h4>
                    <p className="text-xs text-[var(--text-soft)]">
                      Target: {t.deadline ? t.deadline.split("T")[0] : "None set"}
                    </p>
                    <div className="pt-2 border-t border-[var(--border-main)] flex justify-between items-center text-xs text-blue-500 font-bold">
                      <span>Assigned Team: {(t.assignees || []).length} members</span>
                      <span>Open Workspace →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      ) : (
        
        // 3. SIMPLE MINISTERIAL OVERVIEW DASHBOARD VIEW
        <div className="space-y-6">
          {/* Header and Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-main)]">
            <div className="space-y-1">
              <h2 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight">
                Ministerial Overview
              </h2>
              <p className="text-sm text-[var(--text-soft)]">
                Strategic progress across Digital Economy initiatives.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCreateProjectOpen(true)}
                className="flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 shadow"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
              <button
                onClick={() => openCreateTask("")}
                className="flex items-center gap-1.5 bg-[var(--bg-panel)] border border-[var(--border-main)] text-[var(--text-main)] px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-[var(--bg-soft)]/20"
              >
                <PlusCircle className="w-4 h-4 text-blue-500" /> New Task
              </button>
              <button
                onClick={() => setAppPage("completedTasks")}
                className="flex items-center gap-1.5 border border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)] px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-[var(--bg-soft)]/20"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Tasks
              </button>
              <button
                onClick={fetchData}
                className="p-2.5 border border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)] rounded-xl transition-all hover:bg-[var(--bg-soft)]/20"
                title="Refresh dashboard"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-16 text-center text-[var(--text-soft)]">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
              Loading dashboard...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick stats grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Projects */}
                <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] border-t-4 border-t-blue-500 rounded-2xl p-5 shadow-sm min-h-[100px] flex flex-col justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">Active Projects</p>
                  <p className="text-3xl font-black text-[var(--text-main)]">{String(dashboardStats.totalProjects).padStart(2, "0")}</p>
                </div>

                {/* Pending Approvals */}
                <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm min-h-[100px] flex flex-col justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">Pending Approvals</p>
                  <p className="text-3xl font-black text-[var(--text-main)]">{String(dashboardStats.pendingCount).padStart(2, "0")}</p>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] border-l-4 border-l-red-500 rounded-2xl p-5 shadow-sm min-h-[100px] flex flex-col justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">Overdue Tasks</p>
                  <p className="text-3xl font-black text-red-500">{String(dashboardStats.overdueCount).padStart(2, "0")}</p>
                </div>

                {/* Budget Utilization (Dark card) */}
                <div className="bg-[#0b0c21] border border-white/5 rounded-2xl p-5 shadow flex flex-col justify-between min-h-[100px]">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Budget Utilization</p>
                    <p className="text-2xl font-black text-white">68.4%</p>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "68.4%" }} />
                  </div>
                </div>
              </div>

              {/* Key Strategic Projects Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Key Strategic Projects
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project) => {
                    const projectTasks = tasks.filter((t) => t.project_id === project.id);
                    const totalT = projectTasks.length;
                    const completedT = projectTasks.filter((t) => t.status === "completed").length;
                    const percent = totalT === 0 ? 0 : Math.round((completedT / totalT) * 100);

                    let daysLeftText = "No target date";
                    let daysLeftClass = "text-slate-400";
                    if (project.deadline) {
                      const diff = new Date(project.deadline) - new Date();
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      if (days < 0) {
                        daysLeftText = "Overdue";
                        daysLeftClass = "text-red-500 font-bold";
                      } else {
                        daysLeftText = `${days} days left`;
                        daysLeftClass = "text-amber-500 font-medium";
                      }
                    }

                    return (
                      <div 
                        key={project.id}
                        className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 hover:border-blue-500/30 transition-all flex flex-col justify-between shadow-sm min-h-[180px]"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2">
                              <Folder className="w-5 h-5 text-blue-500" />
                              <h4 
                                onClick={() => setSelectedProjectId(project.id)}
                                className="text-base font-bold text-[var(--text-main)] hover:text-blue-500 cursor-pointer transition-colors line-clamp-1"
                              >
                                {project.project_name}
                              </h4>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold">
                              {percent}% Done
                            </span>
                          </div>

                          {project.description && (
                            <p className="text-xs text-[var(--text-soft)] line-clamp-2">{project.description}</p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-[var(--border-main)]/50 flex justify-between items-center text-xs">
                          <span className={`text-[11px] flex items-center gap-1 ${daysLeftClass}`}>
                            <Clock className="w-3.5 h-3.5" /> {daysLeftText}
                          </span>
                          <button
                            onClick={() => setSelectedProjectId(project.id)}
                            className="text-xs text-blue-500 font-bold hover:underline"
                          >
                            Open Workspace →
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {projects.length === 0 && (
                    <div className="col-span-2 text-center py-10 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl text-[var(--text-soft)]">
                      No projects created yet. Click "New Project" to add one.
                    </div>
                  )}
                </div>
              </div>

              {/* Lower Section: Approval Queue & Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Document Approval Queue (2/3 width) */}
                <div className="lg:col-span-2 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--border-main)]">
                    <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                      Document Approval Queue
                    </h3>
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
                      {reviewQueue.length} Pending Approval
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-[var(--text-soft)] uppercase tracking-wider border-b border-[var(--border-main)]">
                          <th className="py-2.5 font-bold">Document / Task Name</th>
                          <th className="py-2.5 font-bold">Assignee</th>
                          <th className="py-2.5 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewQueue.map((item, index) => (
                          <tr key={index} className="border-b border-[var(--border-main)]/50 hover:bg-[var(--bg-soft)]/20 transition-colors">
                            <td className="py-3 font-semibold text-[var(--text-main)]">
                              {item.task.task_name}
                              <p className="text-[10px] text-[var(--text-soft)] font-normal">{item.projectName}</p>
                            </td>
                            <td className="py-3 text-[var(--text-soft)]">{item.assignee.username}</td>
                            <td className="py-3 text-right">
                              {item.isAuthorizedToReview ? (
                                <button
                                  onClick={() => handleOpenTaskWorkspace(item.task)}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors"
                                >
                                  Review Now
                                </button>
                              ) : (
                                <span className="text-[10px] text-[var(--text-soft)] italic">Owner review only</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {reviewQueue.length === 0 && (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-[var(--text-soft)] italic">
                              No pending submissions awaiting approval.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Timeline highlights (1/3 width) */}
                <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider pb-2 border-b border-[var(--border-main)]">
                    Target Dates
                  </h3>

                  <div className="space-y-4">
                    {timelineHighlights.map((hl, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 font-bold">
                          {hl.type === "project" ? "P" : "T"}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-[var(--text-main)] truncate">{hl.title}</p>
                          <p className="text-[10px] text-[var(--text-soft)]">Target: {hl.date}</p>
                        </div>
                      </div>
                    ))}
                    {timelineHighlights.length === 0 && (
                      <p className="text-xs text-[var(--text-soft)] italic text-center py-6">
                        No active targets.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Standalone Tasks Section */}
              <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-main)]">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                      Standalone Tasks
                    </h3>
                  </div>
                  <button
                    onClick={() => openCreateTask("")}
                    className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.filter((t) => !t.project_id).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleOpenTaskWorkspace(t)}
                      className="cursor-pointer bg-[var(--bg-soft)]/20 border border-[var(--border-main)] rounded-xl p-4 hover:border-blue-500/40 transition-all flex flex-col justify-between min-h-[100px]"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-main)] line-clamp-2">{t.task_name}</h4>
                      </div>
                      <div className="pt-2 border-t border-[var(--border-main)]/50 mt-2 flex justify-between items-center text-[10px] text-[var(--text-soft)]">
                        <span>Target: {t.deadline ? t.deadline.split("T")[0] : "None"}</span>
                        <span className="text-blue-500 font-bold">Open Workspace →</span>
                      </div>
                    </div>
                  ))}
                  {tasks.filter((t) => !t.project_id).length === 0 && (
                    <div className="col-span-3 text-center py-6 text-xs text-[var(--text-soft)] italic">
                      No standalone tasks found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          MODALS RENDERED OUTSIDE AND ALWAYS ACCESSIBLE
         ---------------------------------------------------- */}

      {/* CREATE PROJECT MODAL */}
      <Modal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} title="Create New Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Cabinet Paper: National Cyber Strategy"
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Description (Optional)</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Write a brief description..."
              rows={3}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Target Completion Date</label>
            <input
              type="date"
              value={projectDeadline}
              onChange={(e) => setProjectDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleCreateProject}
            disabled={actionLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? "Creating Project..." : "Create Project"}
          </button>
        </div>
      </Modal>

      {/* EDIT PROJECT MODAL */}
      <Modal open={editProjectOpen} onClose={() => setEditProjectOpen(false)} title="Edit Project Details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Description</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Target Completion Date</label>
            <input
              type="date"
              value={projectDeadline}
              onChange={(e) => setProjectDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleUpdateProject}
            disabled={actionLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? "Updating..." : "Save Project Details"}
          </button>
        </div>
      </Modal>

      {/* CREATE TASK MODAL */}
      <Modal open={createTaskOpen} onClose={() => setCreateTaskOpen(false)} title="Create New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Budget Proposal Draft"
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Project Association</label>
            <select
              value={selectedTaskProject}
              onChange={(e) => setSelectedTaskProject(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Standalone Task (No Project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Target Completion Date</label>
            <input
              type="date"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Assign Team Members</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {divisions.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setTaskFilterDept(dept)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    taskFilterDept === dept
                      ? "border-blue-500/40 bg-blue-100 text-blue-850 dark:bg-blue-500/20 dark:text-blue-300"
                      : "border-[var(--border-main)] text-[var(--text-soft)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {dept === "all" ? "All" : dept}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-[var(--border-main)] bg-[var(--bg-soft)]/30 rounded-xl">
              {filteredCreateUsers.map((u) => {
                const checked = selectedTaskUsers.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-[var(--border-main)] hover:border-blue-500/30"
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
                      className="accent-blue-500"
                    />
                    <div>
                      <p className="text-xs text-[var(--text-main)] font-semibold">{u.username}{u.id === user?.id ? " (Me)" : ""}</p>
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? "Adding Task..." : "Add Task"}
          </button>
        </div>
      </Modal>

      {/* EDIT TASK DETAILS MODAL */}
      <Modal open={editTaskOpen} onClose={() => setEditTaskOpen(false)} title="Change Task Details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-main)] mb-1.5">Target Completion Date</label>
            <input
              type="date"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleUpdateTask}
            disabled={actionLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? "Updating..." : "Save Task Details"}
          </button>
        </div>
      </Modal>

      {/* EDIT ASSIGNEES / MEMBERS MODAL */}
      <Modal open={editAssigneesOpen} onClose={() => setEditAssigneesOpen(false)} title="Change Team Members">
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-soft)]">
            Select the team members responsible for this task.
          </p>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {divisions.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setEditAssigneesDeptFilter(dept)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    editAssigneesDeptFilter === dept
                      ? "border-blue-500/40 bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                      : "border-[var(--border-main)] text-[var(--text-soft)]"
                  }`}
                >
                  {dept === "all" ? "All" : dept}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-[var(--border-main)] bg-[var(--bg-soft)]/30 rounded-xl">
              {filteredEditUsers.map((u) => {
                const checked = editAssignees.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-[var(--border-main)] hover:border-blue-500/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleEditAssigneeToggle(u.id)}
                      className="accent-blue-500"
                    />
                    <div>
                      <p className="text-xs text-[var(--text-main)] font-semibold">{u.username}</p>
                      <p className="text-[10px] text-[var(--text-soft)]">{u.dept_name || "No Division"}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveAssignees}
              disabled={actionLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setEditAssigneesOpen(false)}
              className="flex-1 border border-[var(--border-main)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)]/20 py-2.5 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
