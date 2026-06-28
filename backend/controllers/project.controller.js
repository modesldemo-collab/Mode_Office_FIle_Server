/**
 * controllers/project.controller.js
 */

const { db } = require("../models/db");

const isAdminUser = (user) => user?.role === "admin";

const getProjectById = async (projectId) => {
  const [rows] = await db.query("SELECT * FROM projects WHERE id = ?", [projectId]);
  return rows[0] || null;
};

// GET /api/projects
const list = async (req, res) => {
  try {
    const isAdmin = isAdminUser(req.user);
    let query = `
      SELECT p.*, u.username as owner_name 
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
    `;
    const params = [];

    if (!isAdmin) {
      // Users can see projects they created OR projects where they are assigned to at least one task
      query += `
        WHERE p.created_by = ? 
        OR EXISTS (
          SELECT 1 FROM tasks t
          INNER JOIN task_assignments ta ON ta.task_id = t.id
          WHERE t.project_id = p.id AND ta.user_id = ?
        )
      `;
      params.push(req.user.id, req.user.id);
    }
    
    query += " ORDER BY p.created_at DESC";
    const [projects] = await db.query(query, params);

    if (projects.length === 0) {
      return res.json([]);
    }

    // Load tasks for these projects
    const projectIds = projects.map((p) => p.id);
    const [tasks] = await db.query(
      `SELECT t.*, ub.username AS assigned_by_name, ut.username AS assigned_to_name
       FROM tasks t
       LEFT JOIN users ub ON ub.id = t.assigned_by
       LEFT JOIN users ut ON ut.id = t.assigned_to
       WHERE t.project_id IN (?)
       ORDER BY t.created_at ASC`,
      [projectIds]
    );

    // Group tasks by project_id
    const tasksMap = new Map();
    tasks.forEach((t) => {
      if (!tasksMap.has(t.project_id)) {
        tasksMap.set(t.project_id, []);
      }
      tasksMap.get(t.project_id).push(t);
    });

    // Load assignees for tasks
    const taskIds = tasks.map((t) => t.id);
    let assigneesByTask = new Map();
    if (taskIds.length > 0) {
      const [taRows] = await db.query(
        `SELECT ta.task_id, ta.user_id, ta.is_completed, ta.completed_at,
                ta.approval_status, ta.feedback, ta.submitted_at,
                u.username, u.dept_id, d.dept_name
         FROM task_assignments ta
         LEFT JOIN users u ON u.id = ta.user_id
         LEFT JOIN departments d ON d.id = u.dept_id
         WHERE ta.task_id IN (?)`,
        [taskIds]
      );
      taRows.forEach((row) => {
        if (!assigneesByTask.has(row.task_id)) {
          assigneesByTask.set(row.task_id, []);
        }
        assigneesByTask.get(row.task_id).push({
          user_id: row.user_id,
          username: row.username,
          dept_id: row.dept_id,
          dept_name: row.dept_name,
          is_completed: Number(row.is_completed) === 1,
          completed_at: row.completed_at,
          approval_status: row.approval_status,
          feedback: row.feedback,
          submitted_at: row.submitted_at,
        });
      });
    }

    // Enrich projects with tasks
    const enriched = projects.map((p) => {
      const pTasks = tasksMap.get(p.id) || [];
      const enrichedTasks = pTasks.map((t) => {
        const assignees = assigneesByTask.get(t.id) || [];
        return {
          ...t,
          assignees,
          total_members: assignees.length,
          completed_members: assignees.filter((m) => m.is_completed).length,
        };
      });

      return {
        ...p,
        tasks: enrichedTasks,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/projects
const create = async (req, res) => {
  const { project_name, description, deadline } = req.body;
  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: "project_name is required" });
  }

  if (deadline && Number.isNaN(Date.parse(deadline))) {
    return res.status(400).json({ error: "deadline must be a valid date" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO projects (project_name, description, created_by, deadline) VALUES (?,?,?,?)",
      [project_name.trim(), description || null, req.user.id, deadline || null]
    );

    res.status(201).json({ id: result.insertId, message: "Project created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/projects/:id (Update / Extend deadline)
const update = async (req, res) => {
  const projectId = Number(req.params.id);
  const { project_name, description, deadline, status } = req.body;

  try {
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Only owner or admin can update
    const canUpdate = isAdminUser(req.user) || project.created_by === req.user.id;
    if (!canUpdate) return res.status(403).json({ error: "Access denied" });

    const updates = [];
    const params = [];

    if (project_name !== undefined) {
      updates.push("project_name = ?");
      params.push(project_name.trim());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    if (deadline !== undefined) {
      if (deadline && Number.isNaN(Date.parse(deadline))) {
        return res.status(400).json({ error: "deadline must be a valid date" });
      }
      updates.push("deadline = ?");
      params.push(deadline || null);
    }
    if (status !== undefined) {
      if (!["active", "completed"].includes(status)) {
        return res.status(400).json({ error: "status must be active or completed" });
      }
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(projectId);
    await db.query(`UPDATE projects SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, params);

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/projects/:id
const remove = async (req, res) => {
  const projectId = Number(req.params.id);

  try {
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const canDelete = isAdminUser(req.user) || project.created_by === req.user.id;
    if (!canDelete) return res.status(403).json({ error: "Access denied" });

    await db.query("DELETE FROM projects WHERE id = ?", [projectId]);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/projects/:id/updates
const getProjectUpdates = async (req, res) => {
  const projectId = Number(req.params.id);
  try {
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // 1. Task submissions and reviews
    const [subRows] = await db.query(
      `SELECT ta.task_id, t.task_name, ta.user_id, u.username, 
              ta.approval_status, ta.submitted_at, ta.completed_at, 
              ta.feedback, ta.submission_text, ta.file_name
       FROM task_assignments ta 
       JOIN tasks t ON t.id = ta.task_id 
       JOIN users u ON u.id = ta.user_id 
       WHERE t.project_id = ?`,
      [projectId]
    );

    // 2. Task attachments
    const [attachRows] = await db.query(
      `SELECT ta.id, ta.task_id, t.task_name, ta.uploader_id, u.username, 
              ta.file_name, ta.created_at
       FROM task_attachments ta 
       JOIN tasks t ON t.id = ta.task_id 
       JOIN users u ON u.id = ta.uploader_id 
       WHERE t.project_id = ?`,
      [projectId]
    );

    // 3. New tasks
    const [taskRows] = await db.query(
      `SELECT t.id, t.task_name, t.created_at, t.assigned_by, u.username AS creator_name
       FROM tasks t
       JOIN users u ON u.id = t.assigned_by
       WHERE t.project_id = ?`,
      [projectId]
    );

    const activities = [];

    // Process Task Submissions & Reviews
    subRows.forEach((row) => {
      // Submission event
      if (row.submitted_at) {
        activities.push({
          type: "submission",
          timestamp: row.submitted_at,
          user: row.username,
          taskName: row.task_name,
          taskId: row.task_id,
          details: row.submission_text || "Submitted progress log.",
          fileName: row.file_name,
        });
      }
      // Review decision event (Approved / Needs Changes)
      if (row.approval_status === "approved" && row.completed_at) {
        activities.push({
          type: "approval",
          timestamp: row.completed_at,
          user: "Supervisor",
          taskName: row.task_name,
          taskId: row.task_id,
          details: row.feedback || "Approved task progress.",
          assignee: row.username,
        });
      } else if (row.approval_status === "needs_changes") {
        activities.push({
          type: "rejection",
          timestamp: row.submitted_at, // fallback
          user: "Supervisor",
          taskName: row.task_name,
          taskId: row.task_id,
          details: row.feedback || "Requested changes/revisions.",
          assignee: row.username,
        });
      }
    });

    // Process Task Attachments
    attachRows.forEach((row) => {
      activities.push({
        type: "attachment",
        timestamp: row.created_at,
        user: row.username,
        taskName: row.task_name,
        taskId: row.task_id,
        details: `Uploaded document: ${row.file_name}`,
        fileName: row.file_name,
      });
    });

    // Process New Tasks Created
    taskRows.forEach((row) => {
      activities.push({
        type: "task_created",
        timestamp: row.created_at,
        user: row.creator_name,
        taskName: row.task_name,
        taskId: row.id,
        details: "Created new task.",
      });
    });

    // Process Project Creation
    const [ownerRows] = await db.query("SELECT username FROM users WHERE id = ?", [project.created_by]);
    activities.push({
      type: "project_created",
      timestamp: project.created_at,
      user: ownerRows[0]?.username || "Manager",
      taskName: project.project_name,
      details: "Project initiated.",
    });

    // Sort by timestamp DESC
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
  getProjectUpdates,
};
