/**
 * controllers/task.controller.js
 */

const fs   = require("fs");
const path = require("path");
const { db } = require("../models/db");
const { createNotifications } = require("../utils/notify");

const isAdminUser = (user) => user?.role === "admin";

const getTaskById = async (taskId) => {
  const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
  return rows[0] || null;
};

const isValidStatus = (status) => ["pending", "completed"].includes(status);

const normalizeAssigneeIds = (payload, fallbackUserId) => {
  const ids = [];

  if (Array.isArray(payload?.assigned_to_users)) {
    ids.push(...payload.assigned_to_users);
  }
  if (payload?.assigned_to !== undefined && payload?.assigned_to !== null) {
    ids.push(payload.assigned_to);
  }
  if (!ids.length && fallbackUserId) {
    ids.push(fallbackUserId);
  }

  return [...new Set(ids.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0))];
};

const getActiveUserIds = async (userIds) => {
  if (!userIds.length) return [];
  const [rows] = await db.query(
    "SELECT id FROM users WHERE is_active = 1 AND id IN (?)",
    [userIds]
  );
  return rows.map((r) => Number(r.id));
};

const replaceTaskAssignees = async (conn, taskId, assigneeIds, markCompleted) => {
  await conn.query("DELETE FROM task_assignments WHERE task_id = ?", [taskId]);
  if (!assigneeIds.length) return;

  const rows = assigneeIds.map((userId) => [
    taskId,
    userId,
    markCompleted ? 1 : 0,
    markCompleted ? new Date() : null,
  ]);

  await conn.query(
    "INSERT INTO task_assignments (task_id, user_id, is_completed, completed_at) VALUES ?",
    [rows]
  );
};

const loadTaskAssignees = async (taskIds) => {
  if (!taskIds.length) return new Map();
  const [rows] = await db.query(
    `SELECT ta.task_id, ta.user_id, ta.is_completed, ta.completed_at,
            ta.approval_status, ta.feedback, ta.submitted_at, ta.submission_text,
            ta.file_name, ta.file_path,
            u.username, u.dept_id, d.dept_name
     FROM task_assignments ta
     LEFT JOIN users u ON u.id = ta.user_id
     LEFT JOIN departments d ON d.id = u.dept_id
     WHERE ta.task_id IN (?)
     ORDER BY u.username ASC`,
    [taskIds]
  );

  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.task_id)) grouped.set(row.task_id, []);
    grouped.get(row.task_id).push({
      user_id: row.user_id,
      username: row.username,
      dept_id: row.dept_id,
      dept_name: row.dept_name,
      is_completed: Number(row.is_completed) === 1,
      completed_at: row.completed_at,
      approval_status: row.approval_status,
      feedback: row.feedback,
      submitted_at: row.submitted_at,
      submission_text: row.submission_text,
      file_name: row.file_name,
      file_path: row.file_path,
    });
  });
  return grouped;
};

const syncTaskOverallStatus = async (taskId) => {
  const [[agg]] = await db.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN is_completed = 1 OR approval_status = 'approved' THEN 1 ELSE 0 END) AS done
     FROM task_assignments
     WHERE task_id = ?`,
    [taskId]
  );

  const total = Number(agg?.total || 0);
  const done = Number(agg?.done || 0);
  const nextStatus = total > 0 && done === total ? "completed" : "pending";
  await db.query("UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?", [nextStatus, taskId]);
};

// GET /api/tasks
const list = async (req, res) => {
  const isAdmin = isAdminUser(req.user);
  const params = [];

  let where = "";
  if (!isAdmin) {
    where = `WHERE t.assigned_by = ?
             OR t.assigned_to = ?
             OR EXISTS (
               SELECT 1 FROM task_assignments ta
               WHERE ta.task_id = t.id AND ta.user_id = ?
             )`;
    params.push(req.user.id, req.user.id, req.user.id);
  }

  const [rows] = await db.query(
    `SELECT t.id, t.project_id, t.task_name, t.assigned_by, t.assigned_to, t.deadline, t.status, t.created_at, t.updated_at,
            ub.username AS assigned_by_name,
            ut.username AS assigned_to_name
     FROM tasks t
     LEFT JOIN users ub ON ub.id = t.assigned_by
     LEFT JOIN users ut ON ut.id = t.assigned_to
     ${where}
     ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.created_at DESC`,
    params
  );

  const assigneesByTask = await loadTaskAssignees(rows.map((r) => r.id));
  const enriched = rows.map((task) => {
    let assignees = assigneesByTask.get(task.id) || [];

    // Backward compatible fallback for old rows that only used assigned_to.
    if (!assignees.length && task.assigned_to) {
      assignees = [{
        user_id: task.assigned_to,
        username: task.assigned_to_name,
        dept_id: null,
        dept_name: null,
        is_completed: task.status === "completed",
        completed_at: task.status === "completed" ? task.updated_at : null,
      }];
    }

    const totalMembers = assignees.length;
    const completedMembers = assignees.filter((m) => m.is_completed).length;

    return {
      ...task,
      assignees,
      total_members: totalMembers,
      completed_members: completedMembers,
    };
  });

  res.json(enriched);
};

// POST /api/tasks
const create = async (req, res) => {
  const { task_name, deadline, project_id } = req.body;
  if (!task_name || !task_name.trim()) {
    return res.status(400).json({ error: "task_name is required" });
  }

  if (deadline && Number.isNaN(Date.parse(deadline))) {
    return res.status(400).json({ error: "deadline must be a valid date" });
  }

  const assigneeIds = normalizeAssigneeIds(req.body, req.user.id);
  const activeIds = await getActiveUserIds(assigneeIds);

  if (!activeIds.length) {
    return res.status(400).json({ error: "At least one valid active assignee is required" });
  }
  if (activeIds.length !== assigneeIds.length) {
    return res.status(400).json({ error: "One or more assignees are invalid or inactive" });
  }

  const primaryAssignee = activeIds[0];
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO tasks (project_id, task_name, assigned_by, assigned_to, deadline, status) VALUES (?,?,?,?,?,?)",
      [project_id || null, task_name.trim(), req.user.id, primaryAssignee, deadline || null, "pending"]
    );

    await replaceTaskAssignees(conn, result.insertId, activeIds, false);
    await conn.commit();

    await createNotifications({
      userIds: activeIds,
      notificationKey: (userId) => `task-created:${result.insertId}:${userId}`,
      type: "task_created",
      title: "New task assigned",
      body: `${task_name.trim()}${deadline ? ` (deadline: ${deadline})` : ""}`,
      link: "tasks",
      sendMail: true,
      mailSubject: `New task assigned: ${task_name.trim()}`,
      mailText: (user) => `Hello ${user.username}, you have been assigned a new task: ${task_name.trim()}${deadline ? `\nDeadline: ${deadline}` : ""}.`,
    });

    res.status(201).json({ id: result.insertId, message: "Task created" });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// PATCH /api/tasks/:id/assign
const assignToUser = async (req, res) => {
  const taskId = Number(req.params.id);
  const requestedIds = normalizeAssigneeIds(req.body);

  if (!requestedIds.length) {
    return res.status(400).json({ error: "assigned_to or assigned_to_users is required" });
  }

  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const canAssign = isAdminUser(req.user) || task.assigned_by === req.user.id;
  if (!canAssign) return res.status(403).json({ error: "Only assigner/admin can reassign" });

  const activeIds = await getActiveUserIds(requestedIds);
  if (activeIds.length !== requestedIds.length) {
    return res.status(400).json({ error: "One or more assignees are invalid or inactive" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const oldTask = task;
    await conn.query(
      "UPDATE tasks SET assigned_to = ?, status = 'pending', updated_at = NOW() WHERE id = ?",
      [activeIds[0], taskId]
    );
    await replaceTaskAssignees(conn, taskId, activeIds, false);
    await conn.commit();

    await createNotifications({
      userIds: activeIds,
      notificationKey: (userId) => `task-reassigned:${taskId}:${userId}`,
      type: "task_reassigned",
      title: "Task members updated",
      body: `${oldTask.task_name} has been assigned to you${oldTask.deadline ? ` (deadline: ${oldTask.deadline})` : ""}`,
      link: "tasks",
      sendMail: true,
      mailSubject: `Task updated: ${oldTask.task_name}`,
      mailText: (user) => `Hello ${user.username}, task membership was updated for: ${oldTask.task_name}${oldTask.deadline ? `\nDeadline: ${oldTask.deadline}` : ""}.`,
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  res.json({ message: "Task assignees updated" });
};

// PATCH /api/tasks/:id/self-assign
const selfAssign = async (req, res) => {
  const taskId = Number(req.params.id);
  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  await db.query(
    `INSERT INTO task_assignments (task_id, user_id, is_completed, completed_at)
     VALUES (?, ?, 0, NULL)
     ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed), completed_at = VALUES(completed_at)`,
    [taskId, req.user.id]
  );

  await db.query(
    "UPDATE tasks SET assigned_to = ?, status = 'pending', updated_at = NOW() WHERE id = ?",
    [req.user.id, taskId]
  );

  res.json({ message: "Task assigned to yourself" });
};

// PATCH /api/tasks/:id/status
const updateStatus = async (req, res) => {
  const taskId = Number(req.params.id);
  const { status } = req.body;

  if (!isValidStatus(status)) {
    return res.status(400).json({ error: "status must be pending or completed" });
  }

  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const isManager = isAdminUser(req.user) || task.assigned_by === req.user.id;

  if (isManager) {
    await db.query(
      `UPDATE task_assignments
       SET is_completed = ?,
           completed_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END
       WHERE task_id = ?`,
      [status === "completed" ? 1 : 0, status === "completed" ? 1 : 0, taskId]
    );
    await db.query("UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?", [status, taskId]);
    return res.json({ message: "Task status updated" });
  }

  const [assignees] = await db.query(
    "SELECT id FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
    [taskId, req.user.id]
  );

  // Backward compatibility for old tasks that were assigned with assigned_to only.
  if (!assignees.length && task.assigned_to === req.user.id) {
    await db.query(
      "INSERT IGNORE INTO task_assignments (task_id, user_id, is_completed) VALUES (?,?,0)",
      [taskId, req.user.id]
    );
  }

  const [allowed] = await db.query(
    "SELECT id FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
    [taskId, req.user.id]
  );
  if (!allowed.length) {
    return res.status(403).json({ error: "Only assigned members can update their status" });
  }

  await db.query(
    `UPDATE task_assignments
     SET is_completed = ?, completed_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END
     WHERE task_id = ? AND user_id = ?`,
    [status === "completed" ? 1 : 0, status === "completed" ? 1 : 0, taskId, req.user.id]
  );
  await syncTaskOverallStatus(taskId);

  res.json({ message: "Task status updated" });
};

// PATCH /api/tasks/:id/restore
const restore = async (req, res) => {
  const taskId = Number(req.params.id);
  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const canRestore = isAdminUser(req.user) || task.assigned_by === req.user.id;
  if (!canRestore) return res.status(403).json({ error: "Only assigner/admin can restore" });

  await db.query("UPDATE tasks SET status = 'pending', updated_at = NOW() WHERE id = ?", [taskId]);
  await db.query("UPDATE task_assignments SET is_completed = 0, completed_at = NULL WHERE task_id = ?", [taskId]);
  res.json({ message: "Task restored" });
};

// PATCH /api/tasks/:id
const updateTaskDetails = async (req, res) => {
  const taskId = Number(req.params.id);
  const { task_name, deadline } = req.body;

  try {
    const task = await getTaskById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const canUpdate = isAdminUser(req.user) || task.assigned_by === req.user.id;
    if (!canUpdate) return res.status(403).json({ error: "Only task creator or admin can update details" });

    const updates = [];
    const params = [];

    if (task_name !== undefined) {
      updates.push("task_name = ?");
      params.push(task_name.trim());
    }
    if (deadline !== undefined) {
      if (deadline && Number.isNaN(Date.parse(deadline))) {
        return res.status(400).json({ error: "deadline must be a valid date" });
      }
      updates.push("deadline = ?");
      params.push(deadline || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(taskId);
    await db.query(`UPDATE tasks SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, params);

    res.json({ message: "Task updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/:id
const remove = async (req, res) => {
  const taskId = Number(req.params.id);
  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const canDelete = isAdminUser(req.user) || task.assigned_by === req.user.id;
  if (!canDelete) return res.status(403).json({ error: "Only assigner/admin can delete" });

  await db.query("DELETE FROM tasks WHERE id = ?", [taskId]);
  res.json({ message: "Task deleted" });
};

// POST /api/tasks/:id/attachments
const uploadAttachment = async (req, res) => {
  const taskId = Number(req.params.id);
  if (!req.file) {
    return res.status(400).json({ error: "File is required" });
  }

  try {
    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isAdmin = isAdminUser(req.user);
    const isCreator = task.assigned_by === req.user.id;
    
    const [assignment] = await db.query(
      "SELECT 1 FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
      [taskId, req.user.id]
    );
    const isAssigned = assignment.length > 0 || task.assigned_to === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ error: "Access denied" });
    }

    const fileType = path.extname(req.file.originalname).replace(".", "").toLowerCase();

    const [result] = await db.query(
      `INSERT INTO task_attachments (task_id, uploader_id, file_name, file_path, file_size, file_type)
       VALUES (?,?,?,?,?,?)`,
      [
        taskId,
        req.user.id,
        req.file.originalname,
        req.file.path,
        req.file.size,
        fileType
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Attachment uploaded successfully",
      attachment: {
        id: result.insertId,
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: fileType,
        created_at: new Date(),
        uploader_id: req.user.id,
        uploader_name: req.user.username
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id/attachments
const getAttachments = async (req, res) => {
  const taskId = Number(req.params.id);
  try {
    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isAdmin = isAdminUser(req.user);
    const isCreator = task.assigned_by === req.user.id;
    const [assignment] = await db.query(
      "SELECT 1 FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
      [taskId, req.user.id]
    );
    const isAssigned = assignment.length > 0 || task.assigned_to === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [rows] = await db.query(
      `SELECT ta.*, u.username AS uploader_name
       FROM task_attachments ta
       LEFT JOIN users u ON u.id = ta.uploader_id
       WHERE ta.task_id = ?
       ORDER BY ta.created_at DESC`,
      [taskId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/tasks/attachments/:attachmentId
const deleteAttachment = async (req, res) => {
  const attachmentId = Number(req.params.attachmentId);
  try {
    const [rows] = await db.query(
      "SELECT ta.*, t.assigned_by FROM task_attachments ta JOIN tasks t ON t.id = ta.task_id WHERE ta.id = ?",
      [attachmentId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const attachment = rows[0];

    const isAdmin = isAdminUser(req.user);
    const isCreator = attachment.assigned_by === req.user.id;
    const isUploader = attachment.uploader_id === req.user.id;

    if (!isAdmin && !isCreator && !isUploader) {
      return res.status(403).json({ error: "Access denied to delete this attachment" });
    }

    if (fs.existsSync(attachment.file_path)) {
      try {
        fs.unlinkSync(attachment.file_path);
      } catch (err) {
        console.error("Failed to delete file from disk:", err);
      }
    }

    await db.query("DELETE FROM task_attachments WHERE id = ?", [attachmentId]);
    res.json({ message: "Attachment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/attachments/:attachmentId/download
const downloadAttachment = async (req, res) => {
  const attachmentId = Number(req.params.attachmentId);
  try {
    const [rows] = await db.query(
      "SELECT ta.*, t.assigned_by FROM task_attachments ta JOIN tasks t ON t.id = ta.task_id WHERE ta.id = ?",
      [attachmentId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const attachment = rows[0];

    const isAdmin = isAdminUser(req.user);
    const isCreator = attachment.assigned_by === req.user.id;
    const [assignment] = await db.query(
      "SELECT 1 FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
      [attachment.task_id, req.user.id]
    );
    const isAssigned = assignment.length > 0 || attachment.uploader_id === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.download(attachment.file_path, attachment.file_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/attachments/:attachmentId/preview
const previewAttachment = async (req, res) => {
  const attachmentId = Number(req.params.attachmentId);
  try {
    const [rows] = await db.query(
      "SELECT ta.*, t.assigned_by FROM task_attachments ta JOIN tasks t ON t.id = ta.task_id WHERE ta.id = ?",
      [attachmentId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const attachment = rows[0];

    const isAdmin = isAdminUser(req.user);
    const isCreator = attachment.assigned_by === req.user.id;
    const [assignment] = await db.query(
      "SELECT 1 FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
      [attachment.task_id, req.user.id]
    );
    const isAssigned = assignment.length > 0 || attachment.uploader_id === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.sendFile(path.resolve(attachment.file_path), {
      headers: {
        "Content-Disposition": `inline; filename="${attachment.file_name}"`,
      },
    }, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to preview file" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/projects/:id/attachments
const getProjectAttachments = async (req, res) => {
  const projectId = Number(req.params.id);
  try {
    const [rows] = await db.query(
      `SELECT ta.*, t.task_name, u.username AS uploader_name
       FROM task_attachments ta
       JOIN tasks t ON t.id = ta.task_id
       LEFT JOIN users u ON u.id = ta.uploader_id
       WHERE t.project_id = ?
       ORDER BY ta.created_at DESC`,
      [projectId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id/submit
const submitForReview = async (req, res) => {
  const taskId = Number(req.params.id);
  const { submission_text } = req.body;
  const file = req.file;

  let file_name = null;
  let file_path = null;
  let file_size = null;
  let file_type = null;

  if (file) {
    file_name = file.originalname;
    file_path = file.path;
    file_size = file.size;
    file_type = file.mimetype;
  }

  try {
    const task = await getTaskById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const [assignment] = await db.query(
      "SELECT 1 FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1",
      [taskId, req.user.id]
    );
    if (!assignment.length && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: "You are not assigned to this task" });
    }

    await db.query(
      `INSERT INTO task_assignments (task_id, user_id, is_completed, approval_status, submitted_at, feedback, submission_text, file_name, file_path, file_size, file_type)
       VALUES (?, ?, 0, 'submitted', NOW(), NULL, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         approval_status = 'submitted', 
         submitted_at = NOW(), 
         feedback = NULL, 
         submission_text = ?, 
         file_name = COALESCE(?, file_name), 
         file_path = COALESCE(?, file_path), 
         file_size = COALESCE(?, file_size), 
         file_type = COALESCE(?, file_type)`,
      [
        taskId,
        req.user.id,
        submission_text || null,
        file_name,
        file_path,
        file_size,
        file_type,
        submission_text || null,
        file_name,
        file_path,
        file_size,
        file_type
      ]
    );

    if (task.assigned_by) {
      await createNotifications({
        userIds: [task.assigned_by],
        notificationKey: (userId) => `task-submitted:${taskId}:${req.user.id}:${userId}`,
        type: "task_submitted",
        title: "Task submitted for approval",
        body: `${req.user.username} submitted task "${task.task_name}" for review`,
        link: "tasks",
        sendMail: true,
        mailSubject: `Task review requested: ${task.task_name}`,
        mailText: (userObj) => `Hello ${userObj.username}, ${req.user.username} has submitted the task "${task.task_name}" for your review. Please check the attachment.`,
      });
    }

    res.json({ message: "Task submitted for review" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/tasks/:id/assignments/:userId/download
const downloadAssignmentAttachment = async (req, res) => {
  const taskId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  try {
    const [rows] = await db.query(
      `SELECT ta.*, t.assigned_by FROM task_assignments ta 
       JOIN tasks t ON t.id = ta.task_id 
       WHERE ta.task_id = ? AND ta.user_id = ?`,
      [taskId, targetUserId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const assignment = rows[0];
    if (!assignment.file_path || !assignment.file_name) {
      return res.status(404).json({ error: "No attachment found for this progress submission" });
    }

    const isAdmin = isAdminUser(req.user);
    const isCreator = assignment.assigned_by === req.user.id;
    const isSelf = assignment.user_id === req.user.id;

    if (!isAdmin && !isCreator && !isSelf) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(assignment.file_path)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.download(assignment.file_path, assignment.file_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/tasks/:id/review
const reviewTask = async (req, res) => {
  const taskId = Number(req.params.id);
  const { user_id, status, feedback } = req.body;

  if (!["approved", "needs_changes"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'approved' or 'needs_changes'" });
  }

  try {
    const task = await getTaskById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    let isProjectOwner = false;
    if (task.project_id) {
      const [projectRows] = await db.query(
        "SELECT created_by FROM projects WHERE id = ?",
        [task.project_id]
      );
      if (projectRows.length > 0 && projectRows[0].created_by === req.user.id) {
        isProjectOwner = true;
      }
    }

    const canReview = isAdminUser(req.user) || task.assigned_by === req.user.id || isProjectOwner;
    if (!canReview) {
      return res.status(403).json({ error: "Only the task assigner, project owner, or admin can review this task" });
    }

    const isCompleted = status === "approved" ? 1 : 0;
    const completedAt = status === "approved" ? new Date() : null;

    await db.query(
      `UPDATE task_assignments
       SET approval_status = ?,
           feedback = ?,
           is_completed = ?,
           completed_at = ?
       WHERE task_id = ? AND user_id = ?`,
      [status, feedback || null, isCompleted, completedAt, taskId, user_id]
    );

    await syncTaskOverallStatus(taskId);

    await createNotifications({
      userIds: [user_id],
      notificationKey: (uid) => `task-reviewed:${taskId}:${status}:${uid}`,
      type: "task_reviewed",
      title: status === "approved" ? "Task approved!" : "Task needs changes",
      body: status === "approved"
        ? `Your submission for "${task.task_name}" was approved.`
        : `Your submission for "${task.task_name}" needs changes. Feedback: ${feedback || "No details provided."}`,
      link: "tasks",
      sendMail: true,
      mailSubject: status === "approved" ? `Task Approved: ${task.task_name}` : `Task Needs Changes: ${task.task_name}`,
      mailText: (userObj) => `Hello ${userObj.username},\n\n` + (status === "approved"
        ? `Your submission for the task "${task.task_name}" has been approved by the reviewer.`
        : `Your submission for the task "${task.task_name}" requires adjustments.\nFeedback: ${feedback || "None"}`),
    });

    res.json({ message: `Task review updated to: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  list,
  create,
  updateTaskDetails,
  assignToUser,
  selfAssign,
  updateStatus,
  restore,
  remove,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  downloadAttachment,
  previewAttachment,
  getProjectAttachments,
  submitForReview,
  reviewTask,
  downloadAssignmentAttachment,
};
