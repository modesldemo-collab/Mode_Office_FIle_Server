/**
 * controllers/task.controller.js
 */

const { db } = require("../models/db");

const isAdminUser = (user) => user?.role === "admin";

const getTaskById = async (taskId) => {
  const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
  return rows[0] || null;
};

const isValidStatus = (status) => ["pending", "completed"].includes(status);

// GET /api/tasks
const list = async (req, res) => {
  const isAdmin = isAdminUser(req.user);
  const params = [];

  let where = "";
  if (!isAdmin) {
    where = "WHERE t.assigned_by = ? OR t.assigned_to = ?";
    params.push(req.user.id, req.user.id);
  }

  const [rows] = await db.query(
    `SELECT t.id, t.task_name, t.assigned_by, t.assigned_to, t.status, t.created_at, t.updated_at,
            ub.username AS assigned_by_name,
            ut.username AS assigned_to_name
     FROM tasks t
     LEFT JOIN users ub ON ub.id = t.assigned_by
     LEFT JOIN users ut ON ut.id = t.assigned_to
     ${where}
     ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.created_at DESC`,
    params
  );

  res.json(rows);
};

// POST /api/tasks
const create = async (req, res) => {
  const { task_name, assigned_to } = req.body;
  if (!task_name || !task_name.trim()) {
    return res.status(400).json({ error: "task_name is required" });
  }

  const assignedTo = Number(assigned_to) || req.user.id;

  const [users] = await db.query(
    "SELECT id FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
    [assignedTo]
  );
  if (!users.length) {
    return res.status(400).json({ error: "Invalid assigned_to user" });
  }

  const [result] = await db.query(
    "INSERT INTO tasks (task_name, assigned_by, assigned_to, status) VALUES (?,?,?,?)",
    [task_name.trim(), req.user.id, assignedTo, "pending"]
  );

  res.status(201).json({ id: result.insertId, message: "Task created" });
};

// PATCH /api/tasks/:id/assign
const assignToUser = async (req, res) => {
  const taskId = Number(req.params.id);
  const assignedTo = Number(req.body.assigned_to);

  if (!assignedTo) {
    return res.status(400).json({ error: "assigned_to is required" });
  }

  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const canAssign = isAdminUser(req.user) || task.assigned_by === req.user.id;
  if (!canAssign) return res.status(403).json({ error: "Only assigner/admin can reassign" });

  const [users] = await db.query(
    "SELECT id FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
    [assignedTo]
  );
  if (!users.length) {
    return res.status(400).json({ error: "Invalid assigned_to user" });
  }

  await db.query("UPDATE tasks SET assigned_to = ?, status = 'pending', updated_at = NOW() WHERE id = ?", [assignedTo, taskId]);
  res.json({ message: "Task reassigned" });
};

// PATCH /api/tasks/:id/self-assign
const selfAssign = async (req, res) => {
  const taskId = Number(req.params.id);
  const task = await getTaskById(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

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

  const canUpdate =
    isAdminUser(req.user) || task.assigned_to === req.user.id || task.assigned_by === req.user.id;
  if (!canUpdate) return res.status(403).json({ error: "Access denied" });

  await db.query("UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?", [status, taskId]);
  res.json({ message: "Task status updated" });
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
  remove,
};
