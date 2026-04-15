/**
 * controllers/auth.controller.js
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { db } = require("../models/db");
const { JWT_SECRET } = require("../config/constants");

// POST /api/auth/login
const login = async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginId = (identifier || email || username || "").trim();

  if (!loginId || !password)
    return res.status(400).json({ error: "Username/Email and password required" });

  const [rows] = await db.query(
    `SELECT u.*, d.dept_name
     FROM users u
     LEFT JOIN departments d ON u.dept_id = d.id
     WHERE (u.email = ? OR u.username = ?) AND u.is_active = 1
     LIMIT 1`,
    [loginId, loginId]
  );
  if (!rows.length)
    return res.status(401).json({ error: "Invalid credentials" });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: {
      id:        user.id,
      username:  user.username,
      email:     user.email,
      role:      user.role,
      dept_id:   user.dept_id,
      dept_name: user.dept_name,
    },
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  return res.status(403).json({
    error: "If you want to use this system, please contact the IT Director and get your credentials.",
  });
};

// GET /api/auth/me
const me = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.email, u.role, u.dept_id, d.dept_name
     FROM users u
     LEFT JOIN departments d ON u.dept_id = d.id
     WHERE u.id = ?`,
    [req.user.id]
  );
  res.json(rows[0] || {});
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: "Current and new password are required" });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const [rows] = await db.query(
    "SELECT id, password_hash FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(current_password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const hash = await bcrypt.hash(new_password, 10);
  await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, user.id]);

  res.json({ message: "Password changed successfully" });
};

// GET /api/auth/share-users
const shareableUsers = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.email, u.dept_id, d.dept_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.dept_id
     WHERE u.is_active = 1 AND u.id <> ?
     ORDER BY u.username ASC`,
    [req.user.id]
  );
  res.json(rows);
};

module.exports = { login, register, me, changePassword, shareableUsers };
