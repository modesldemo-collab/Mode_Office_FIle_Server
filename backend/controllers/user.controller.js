/**
 * controllers/user.controller.js
 */

const bcrypt = require("bcryptjs");
const { db } = require("../models/db");

const getAll = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at,
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

module.exports = { getAll, create, update };
