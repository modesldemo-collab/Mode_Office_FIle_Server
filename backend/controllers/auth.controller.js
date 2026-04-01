/**
 * controllers/auth.controller.js
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { db } = require("../models/db");
const { JWT_SECRET } = require("../config/constants");

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const [rows] = await db.query(
    `SELECT u.*, d.dept_name
     FROM users u
     LEFT JOIN departments d ON u.dept_id = d.id
     WHERE u.email = ? AND u.is_active = 1`,
    [email]
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

module.exports = { login, me };