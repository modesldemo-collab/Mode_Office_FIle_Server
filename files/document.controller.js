/**
 * controllers/document.controller.js
 */

const fs   = require("fs");
const path = require("path");
const { db } = require("../models/db");
const { writeLog } = require("../utils/auditLog");

// GET /api/documents
const getAll = async (req, res) => {
  const {
    dept_id, status, search,
    from_date, to_date,
    page = 1, limit = 20,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = ["d.is_deleted = 0"];

  if (dept_id)   { conditions.push("d.dept_id = ?"); params.push(dept_id); }
  if (status)    { conditions.push("d.status = ?");  params.push(status); }
  if (search) {
    conditions.push("(d.doc_name LIKE ? OR d.file_name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (from_date) { conditions.push("d.created_at >= ?"); params.push(from_date); }
  if (to_date)   { conditions.push("d.created_at <= ?"); params.push(to_date + " 23:59:59"); }

  const where = "WHERE " + conditions.join(" AND ");

  const [rows] = await db.query(
    `SELECT d.*, u.username AS uploader_name, dept.dept_name
     FROM documents d
     LEFT JOIN users u ON d.uploader_id = u.id
     LEFT JOIN departments dept ON d.dept_id = dept.id
     ${where}
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM documents d ${where}`,
    params
  );

  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
};

// GET /api/documents/:id
const getOne = async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.*, u.username AS uploader_name, dept.dept_name
     FROM documents d
     LEFT JOIN users u ON d.uploader_id = u.id
     LEFT JOIN departments dept ON d.dept_id = dept.id
     WHERE d.id = ? AND d.is_deleted = 0`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
};

// POST /api/documents  (file uploaded via multer)
const upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File required" });

  const { doc_name, dept_id, responsible_persons, status } = req.body;
  const filePath = req.file.path;
  const fileType = path.extname(req.file.originalname).replace(".", "").toLowerCase();

  const [result] = await db.query(
    `INSERT INTO documents
       (doc_name, file_name, file_path, file_type, file_size,
        uploader_id, dept_id, responsible_persons, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      doc_name || req.file.originalname,
      req.file.originalname,
      filePath,
      fileType,
      req.file.size,
      req.user.id,
      dept_id || null,
      responsible_persons || "[]",
      status  || "draft",
    ]
  );

  await writeLog(result.insertId, req.user.id, "UPLOAD", null, {
    doc_name: doc_name || req.file.originalname,
    dept_id,
    status: status || "draft",
  });

  res.status(201).json({ id: result.insertId, message: "Uploaded successfully" });
};

// PUT /api/documents/:id
const updateMetadata = async (req, res) => {
  const [existing] = await db.query(
    "SELECT * FROM documents WHERE id = ? AND is_deleted = 0",
    [req.params.id]
  );
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const old = existing[0];
  const { doc_name, dept_id, responsible_persons, status } = req.body;

  await db.query(
    `UPDATE documents
     SET doc_name=?, dept_id=?, responsible_persons=?, status=?, updated_at=NOW()
     WHERE id = ?`,
    [
      doc_name             ?? old.doc_name,
      dept_id              !== undefined ? dept_id              : old.dept_id,
      responsible_persons  !== undefined ? responsible_persons  : old.responsible_persons,
      status               ?? old.status,
      req.params.id,
    ]
  );

  await writeLog(req.params.id, req.user.id, "UPDATE_METADATA", {
    doc_name: old.doc_name,
    dept_id:  old.dept_id,
    responsible_persons: old.responsible_persons,
    status:   old.status,
  }, { doc_name, dept_id, responsible_persons, status });

  res.json({ message: "Updated" });
};

// DELETE /api/documents/:id  (soft delete)
const softDelete = async (req, res) => {
  const [existing] = await db.query(
    "SELECT * FROM documents WHERE id = ? AND is_deleted = 0",
    [req.params.id]
  );
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  await db.query(
    "UPDATE documents SET is_deleted = 1, updated_at = NOW() WHERE id = ?",
    [req.params.id]
  );

  await writeLog(req.params.id, req.user.id, "DELETE", {
    doc_name:  existing[0].doc_name,
    file_path: existing[0].file_path,
  }, null);

  res.json({ message: "Deleted" });
};

// GET /api/documents/:id/preview  — stream file inline
const preview = async (req, res) => {
  const [rows] = await db.query(
    "SELECT file_path, file_name FROM documents WHERE id = ? AND is_deleted = 0",
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { file_path, file_name } = rows[0];
  if (!fs.existsSync(file_path))
    return res.status(404).json({ error: "File not found on disk" });

  res.setHeader("Content-Disposition", `inline; filename="${file_name}"`);
  fs.createReadStream(file_path).pipe(res);
};

// GET /api/documents/:id/download
const download = async (req, res) => {
  const [rows] = await db.query(
    "SELECT file_path, file_name FROM documents WHERE id = ? AND is_deleted = 0",
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { file_path, file_name } = rows[0];
  if (!fs.existsSync(file_path))
    return res.status(404).json({ error: "File not on disk" });

  res.download(file_path, file_name);
};

module.exports = { getAll, getOne, upload, updateMetadata, softDelete, preview, download };
