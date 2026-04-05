/**
 * controllers/log.controller.js
 */

const { db } = require("../models/db");

const getAll = async (_req, res) => {
  const [rows] = await db.query(
    `SELECT l.*, u.username AS editor_name, d.doc_name
     FROM document_logs l
     LEFT JOIN users u ON l.edited_by = u.id
     LEFT JOIN documents d ON l.doc_id = d.id
     ORDER BY l.changed_at DESC`
  );

  res.json(rows);
};

const getByDocument = async (req, res) => {
  const [rows] = await db.query(
    `SELECT l.*, u.username AS editor_name, d.doc_name
     FROM document_logs l
     LEFT JOIN users u ON l.edited_by = u.id
     LEFT JOIN documents d ON l.doc_id = d.id
     WHERE l.doc_id = ?
     ORDER BY l.changed_at DESC`,
    [req.params.docId]
  );

  res.json(rows);
};

module.exports = { getAll, getByDocument };
