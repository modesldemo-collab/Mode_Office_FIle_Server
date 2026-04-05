/**
 * routes/user.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly } = require("../middleware/auth.middleware");
const { db } = require("../models/db");

router.get("/", authenticate, adminOnly, async (_req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.email, u.role, u.dept_id, u.is_active, d.dept_name
     FROM users u
     LEFT JOIN departments d ON u.dept_id = d.id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

module.exports = router;
