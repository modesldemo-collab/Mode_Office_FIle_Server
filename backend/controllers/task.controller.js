/**
 * controllers/task.controller.js
 */

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
    });
  });
  return grouped;
};

const syncTaskOverallStatus = async (taskId) => {
  const [[agg]] = await db.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) AS done
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
    `SELECT t.id, t.task_name, t.assigned_by, t.assigned_to, t.deadline, t.status, t.created_at, t.updated_at,
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
  const { task_name, deadline } = req.body;
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
      "INSERT INTO tasks (task_name, assigned_by, assigned_to, deadline, status) VALUES (?,?,?,?,?)",
      [task_name.trim(), req.user.id, primaryAssignee, deadline || null, "pending"]
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

module.exports = {
  list,
  create,
  assignToUser,
  selfAssign,
  updateStatus,
  restore,
  remove,
};
