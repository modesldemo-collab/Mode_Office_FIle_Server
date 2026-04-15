/**
 * controllers/stats.controller.js
 */

const { db } = require("../models/db");

const getDashboardStats = async (req, res) => {
  const [[{ totalDocs }]] = await db.query(
    "SELECT COUNT(*) AS totalDocs FROM documents WHERE is_deleted = 0"
  );
  const [[{ totalUsers }]] = await db.query(
    "SELECT COUNT(*) AS totalUsers FROM users WHERE is_active = 1"
  );
  const [[{ totalDepts }]] = await db.query(
    "SELECT COUNT(*) AS totalDepts FROM departments"
  );
  const [[{ logsToday }]] = await db.query(
    "SELECT COUNT(*) AS logsToday FROM document_logs WHERE DATE(changed_at) = CURDATE()"
  );
  const [byDept] = await db.query(
    `SELECT dept.dept_name, COUNT(d.id) AS count
     FROM documents d
     LEFT JOIN departments dept ON d.dept_id = dept.id
     WHERE d.is_deleted = 0
     GROUP BY dept.id`
  );
  const [byStatus] = await db.query(
    `SELECT status, COUNT(*) AS count
     FROM documents
     WHERE is_deleted = 0
     GROUP BY status`
  );

  res.json({ totalDocs, totalUsers, totalDepts, logsToday, byDept, byStatus });
};

module.exports = { getDashboardStats };
