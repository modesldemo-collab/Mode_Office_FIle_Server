/**
 * controllers/user.controller.js
 */

const bcrypt = require("bcryptjs");
const { db } = require("../models/db");

const getAll = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.email, u.dept_id, u.role, u.is_active, u.created_at,
            d.dept_name
     FROM users u
     LEFT JOIN departments d ON u.dept_id = d.id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
};

const create = async (req, res) => {
  const { username, email, password, dept_id, role } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "username, email, password required" });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    "INSERT INTO users (username, email, password_hash, dept_id, role) VALUES (?,?,?,?,?)",
    [username, email, hash, dept_id || null, role || "user"]
  );
  res.status(201).json({ id: result.insertId, username, email });
};

const update = async (req, res) => {
  const { username, email, dept_id, role, is_active } = req.body;
  await db.query(
    "UPDATE users SET username=?, email=?, dept_id=?, role=?, is_active=? WHERE id=?",
    [username, email, dept_id || null, role, is_active, req.params.id]
  );
  res.json({ message: "Updated" });
};

const changePassword = async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const [rows] = await db.query("SELECT id FROM users WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const hash = await bcrypt.hash(new_password, 10);
  await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.params.id]);
  res.json({ message: "Password updated" });
};

const remove = async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  const [rows] = await db.query(
    "SELECT id, role FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  if (!rows.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const target = rows[0];
  if (target.role === "admin") {
    const [[{ adminCount }]] = await db.query(
      "SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin' AND is_active = 1"
    );
    if (Number(adminCount) <= 1) {
      return res.status(400).json({ error: "Cannot delete the last active admin" });
    }
  }

  await db.query("DELETE FROM users WHERE id = ?", [userId]);
  res.json({ message: "User deleted" });
};

module.exports = { getAll, create, update, changePassword, remove };
