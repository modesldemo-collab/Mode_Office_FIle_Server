/**
 * controllers/log.controller.js
 */

const { db } = require("../models/db");

// GET /api/logs  — full audit log with filters
const getAll = async (req, res) => {
  const {
    doc_id, user_id, action_type,
    from_date, to_date,
    page = 1, limit = 50,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (doc_id)      { conditions.push("l.doc_id = ?");      params.push(doc_id); }
  if (user_id)     { conditions.push("l.edited_by = ?");   params.push(user_id); }
  if (action_type) { conditions.push("l.action_type = ?"); params.push(action_type); }
  if (from_date)   { conditions.push("l.changed_at >= ?"); params.push(from_date); }
  if (to_date)     { conditions.push("l.changed_at <= ?"); params.push(to_date + " 23:59:59"); }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const [rows] = await db.query(
    `SELECT l.*, u.username AS editor_name, d.doc_name
     FROM document_logs l
     LEFT JOIN users u ON l.edited_by = u.id
     LEFT JOIN documents d ON l.doc_id = d.id
     ${where}
     ORDER BY l.changed_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM document_logs l ${where}`,
    params
  );

  res.json({ data: rows, total });
};

// GET /api/logs/:docId  — logs for a single document
const getByDocument = async (req, res) => {
  const [rows] = await db.query(
    `SELECT l.*, u.username AS editor_name
     FROM document_logs l
     LEFT JOIN users u ON l.edited_by = u.id
     WHERE l.doc_id = ?
     ORDER BY l.changed_at DESC`,
    [req.params.docId]
  );
  res.json(rows);
};

module.exports = { getAll, getByDocument };
