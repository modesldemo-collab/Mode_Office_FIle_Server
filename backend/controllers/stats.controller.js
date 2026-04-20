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
  const [[{ totalTasks }]] = await db.query(
    "SELECT COUNT(*) AS totalTasks FROM tasks"
  );
  const [[{ pendingTasks }]] = await db.query(
    "SELECT COUNT(*) AS pendingTasks FROM tasks WHERE status = 'pending'"
  );
  const [[{ completedTasks }]] = await db.query(
    "SELECT COUNT(*) AS completedTasks FROM tasks WHERE status = 'completed'"
  );

  const [byDept] = await db.query(
    `SELECT dept.dept_name, COUNT(d.id) AS count
     FROM documents d
     LEFT JOIN departments dept ON d.dept_id = dept.id
     WHERE d.is_deleted = 0
     GROUP BY dept.id
     ORDER BY count DESC`
  );

  const [byStatus] = await db.query(
    `SELECT status, COUNT(*) AS count
     FROM documents
     WHERE is_deleted = 0
     GROUP BY status`
  );

  const [tasksByAssignee] = await db.query(
    `SELECT COALESCE(u.username, 'Unassigned') AS username,
            COUNT(t.id) AS total,
            SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     GROUP BY t.assigned_to, u.username
     ORDER BY total DESC
     LIMIT 6`
  );

    const [userDetails] = await db.query(
     `SELECT u.id, u.username, u.email, u.role, u.created_at,
          d.dept_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.dept_id
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC
      LIMIT 8`
    );

    const [taskDetails] = await db.query(
     `SELECT t.id, t.task_name, t.status, t.updated_at,
          COALESCE(ub.username, 'System') AS assigned_by_name,
          COALESCE(ut.username, 'Unassigned') AS assigned_to_name
      FROM tasks t
      LEFT JOIN users ub ON ub.id = t.assigned_by
      LEFT JOIN users ut ON ut.id = t.assigned_to
      ORDER BY t.updated_at DESC
      LIMIT 8`
    );

  const [recentActivity] = await db.query(
    `SELECT l.id, l.action_type, l.changed_at,
            COALESCE(u.username, 'System') AS username,
            COALESCE(d.doc_name, CONCAT('Document #', l.doc_id)) AS document_name
     FROM document_logs l
     LEFT JOIN users u ON u.id = l.edited_by
     LEFT JOIN documents d ON d.id = l.doc_id
     ORDER BY l.changed_at DESC
     LIMIT 8`
  );

  const [logTrendRaw] = await db.query(
    `SELECT DATE(changed_at) AS day, COUNT(*) AS count
     FROM document_logs
     WHERE changed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(changed_at)
     ORDER BY day ASC`
  );

  const [docTrendRaw] = await db.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS count
     FROM documents
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       AND is_deleted = 0
     GROUP BY DATE(created_at)
     ORDER BY day ASC`
  );

  const indexByDay = (rows) => {
    const map = new Map();
    rows.forEach((r) => {
      const key = new Date(r.day).toISOString().slice(0, 10);
      map.set(key, Number(r.count) || 0);
    });
    return map;
  };

  const logMap = indexByDay(logTrendRaw);
  const docMap = indexByDay(docTrendRaw);
  const trend7d = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend7d.push({
      day: key,
      logs: logMap.get(key) || 0,
      documents: docMap.get(key) || 0,
    });
  }

  const [[{ finalDocs }]] = await db.query(
    "SELECT COUNT(*) AS finalDocs FROM documents WHERE is_deleted = 0 AND status = 'final'"
  );

  const completion = {
    documents: totalDocs ? Math.round((Number(finalDocs) / Number(totalDocs)) * 100) : 0,
    tasks: totalTasks ? Math.round((Number(completedTasks) / Number(totalTasks)) * 100) : 0,
  };

  res.json({
    totalDocs,
    totalUsers,
    totalDepts,
    logsToday,
    totalTasks,
    pendingTasks,
    completedTasks,
    byDept,
    byStatus,
    tasksByAssignee,
    userDetails,
    taskDetails,
    recentActivity,
    trend7d,
    completion,
  });
};

module.exports = { getDashboardStats };
