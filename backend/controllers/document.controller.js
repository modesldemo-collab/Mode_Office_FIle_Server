/**
 * controllers/document.controller.js
 */

const fs   = require("fs");
const path = require("path");
const { db } = require("../models/db");
const { writeLog } = require("../utils/auditLog");

const isAdminUser = (user) => user?.role === "admin";

const canManageDocument = async (docId, user) => {
  const [rows] = await db.query(
    "SELECT uploader_id FROM documents WHERE id = ? AND is_deleted = 0",
    [docId]
  );
  if (!rows.length) return false;
  if (isAdminUser(user)) return true;
  return rows[0].uploader_id === user.id;
};

const hasDocumentAccess = async (docId, user) => {
  if (isAdminUser(user)) {
    const [rows] = await db.query(
      "SELECT id FROM documents WHERE id = ? AND is_deleted = 0",
      [docId]
    );
    return rows.length > 0;
  }

  const [rows] = await db.query(
    `SELECT d.id
     FROM documents d
     LEFT JOIN document_shares ds
       ON ds.doc_id = d.id AND ds.shared_with = ?
     WHERE d.id = ?
       AND d.is_deleted = 0
       AND (d.uploader_id = ? OR ds.shared_with IS NOT NULL)
     LIMIT 1`,
    [user.id, docId, user.id]
  );
  return rows.length > 0;
};

// GET /api/documents
const getAll = async (req, res) => {
  const {
    dept_id, status, search,
    from_date, to_date,
    folder,
    page = 1, limit = 20,
  } = req.query;

  const currentUserId = Number(req.user?.id) || 0;
  const isAdmin = isAdminUser(req.user);

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = ["d.is_deleted = 0"];

  if (!isAdmin) {
    if (folder === "my") {
      conditions.push("d.uploader_id = ?");
      params.push(currentUserId);
    } else if (folder === "shared") {
      conditions.push(
        "EXISTS (SELECT 1 FROM document_shares ds WHERE ds.doc_id = d.id AND ds.shared_with = ?)"
      );
      params.push(currentUserId);
    } else {
      conditions.push(
        "(d.uploader_id = ? OR EXISTS (SELECT 1 FROM document_shares ds WHERE ds.doc_id = d.id AND ds.shared_with = ?))"
      );
      params.push(currentUserId, currentUserId);
    }
  } else if (folder === "my") {
    conditions.push("d.uploader_id = ?");
    params.push(currentUserId);
  } else if (folder === "shared") {
    conditions.push("EXISTS (SELECT 1 FROM document_shares ds WHERE ds.doc_id = d.id)");
  }

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
           , (d.uploader_id = ${currentUserId}) AS is_owner
           , ${
             isAdmin
               ? "0"
               : `EXISTS (SELECT 1 FROM document_shares ds2 WHERE ds2.doc_id = d.id AND ds2.shared_with = ${currentUserId})`
           } AS shared_with_me
           , (SELECT COUNT(*) FROM document_shares dsc WHERE dsc.doc_id = d.id) AS share_count
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
  const docId = Number(req.params.id);
  const currentUserId = Number(req.user?.id) || 0;

  const allowed = await hasDocumentAccess(docId, req.user);
  if (!allowed) return res.status(403).json({ error: "Access denied" });

  const [rows] = await db.query(
    `SELECT d.*, u.username AS uploader_name, dept.dept_name
            , (d.uploader_id = ${currentUserId}) AS is_owner
            , ${
              isAdminUser(req.user)
                ? "0"
                : `EXISTS (SELECT 1 FROM document_shares ds2 WHERE ds2.doc_id = d.id AND ds2.shared_with = ${currentUserId})`
            } AS shared_with_me
     FROM documents d
     LEFT JOIN users u ON d.uploader_id = u.id
     LEFT JOIN departments dept ON d.dept_id = dept.id
     WHERE d.id = ? AND d.is_deleted = 0`,
    [docId]
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
  const docId = Number(req.params.id);
  const canManage = await canManageDocument(docId, req.user);
  if (!canManage) return res.status(403).json({ error: "Only owner/admin can edit this document" });

  const [existing] = await db.query(
    "SELECT * FROM documents WHERE id = ? AND is_deleted = 0",
    [docId]
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
        docId,
    ]
  );

    await writeLog(docId, req.user.id, "UPDATE_METADATA", {
    doc_name: old.doc_name,
    dept_id:  old.dept_id,
    responsible_persons: old.responsible_persons,
    status:   old.status,
  }, { doc_name, dept_id, responsible_persons, status });

  res.json({ message: "Updated" });
};

// DELETE /api/documents/:id  (soft delete)
const softDelete = async (req, res) => {
  const docId = Number(req.params.id);
  const canManage = await canManageDocument(docId, req.user);
  if (!canManage) return res.status(403).json({ error: "Only owner/admin can delete this document" });

  const [existing] = await db.query(
    "SELECT * FROM documents WHERE id = ? AND is_deleted = 0",
    [docId]
  );
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  await db.query(
    "UPDATE documents SET is_deleted = 1, updated_at = NOW() WHERE id = ?",
    [docId]
  );

  await writeLog(docId, req.user.id, "DELETE", {
    doc_name:  existing[0].doc_name,
    file_path: existing[0].file_path,
  }, null);

  res.json({ message: "Deleted" });
};

// GET /api/documents/:id/preview  — stream file inline
const preview = async (req, res) => {
  const docId = Number(req.params.id);
  const allowed = await hasDocumentAccess(docId, req.user);
  if (!allowed) return res.status(403).json({ error: "Access denied" });

  const [rows] = await db.query(
    "SELECT file_path, file_name FROM documents WHERE id = ? AND is_deleted = 0",
    [docId]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { file_path, file_name } = rows[0];
  if (!fs.existsSync(file_path))
    return res.status(404).json({ error: "File not found on disk" });

  res.sendFile(path.resolve(file_path), {
    headers: {
      "Content-Disposition": `inline; filename="${file_name}"`,
    },
  }, (err) => {
    if (err && !res.headersSent) {
      return res.status(500).json({ error: "Failed to preview file" });
    }
  });
};

// GET /api/documents/:id/download
const download = async (req, res) => {
  const docId = Number(req.params.id);
  const allowed = await hasDocumentAccess(docId, req.user);
  if (!allowed) return res.status(403).json({ error: "Access denied" });

  const [rows] = await db.query(
    "SELECT file_path, file_name FROM documents WHERE id = ? AND is_deleted = 0",
    [docId]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { file_path, file_name } = rows[0];
  if (!fs.existsSync(file_path))
    return res.status(404).json({ error: "File not on disk" });

  res.download(file_path, file_name);
};

// GET /api/documents/:id/shares
const listShares = async (req, res) => {
  const docId = Number(req.params.id);
  const canManage = await canManageDocument(docId, req.user);
  if (!canManage) return res.status(403).json({ error: "Only owner/admin can view shares" });

  const [rows] = await db.query(
    `SELECT ds.id, ds.shared_with, ds.shared_by, ds.created_at,
            u.username, u.email
     FROM document_shares ds
     LEFT JOIN users u ON u.id = ds.shared_with
     WHERE ds.doc_id = ?
     ORDER BY ds.created_at DESC`,
    [docId]
  );

  res.json(rows);
};

// POST /api/documents/:id/share
const share = async (req, res) => {
  const docId = Number(req.params.id);
  const canManage = await canManageDocument(docId, req.user);
  if (!canManage) return res.status(403).json({ error: "Only owner/admin can share this document" });

  const rawIds = Array.isArray(req.body.shared_with_ids)
    ? req.body.shared_with_ids
    : req.body.shared_with_id
      ? [req.body.shared_with_id]
      : [];

  const uniqueIds = [...new Set(rawIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))]
    .filter((id) => id !== req.user.id);

  if (!uniqueIds.length) {
    return res.status(400).json({ error: "Provide at least one valid recipient user" });
  }

  const placeholders = uniqueIds.map(() => "?").join(",");
  const [validUsers] = await db.query(
    `SELECT id FROM users WHERE is_active = 1 AND id IN (${placeholders})`,
    uniqueIds
  );

  const validUserIds = validUsers.map((u) => u.id);
  if (!validUserIds.length) {
    return res.status(400).json({ error: "No valid active recipients found" });
  }

  const valueClause = validUserIds.map(() => "(?,?,?)").join(",");
  const valueParams = [];
  validUserIds.forEach((id) => {
    valueParams.push(docId, req.user.id, id);
  });

  await db.query(
    `INSERT IGNORE INTO document_shares (doc_id, shared_by, shared_with) VALUES ${valueClause}`,
    valueParams
  );

  await writeLog(docId, req.user.id, "SHARE", null, {
    shared_with_ids: validUserIds,
  });

  res.json({ message: "Document shared", shared_with_ids: validUserIds });
};

// DELETE /api/documents/:id/share/:userId
const unshare = async (req, res) => {
  const docId = Number(req.params.id);
  const recipientId = Number(req.params.userId);

  if (!Number.isInteger(recipientId) || recipientId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const canManage = await canManageDocument(docId, req.user);
  if (!canManage) return res.status(403).json({ error: "Only owner/admin can unshare this document" });

  const [result] = await db.query(
    "DELETE FROM document_shares WHERE doc_id = ? AND shared_with = ?",
    [docId, recipientId]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: "Share entry not found" });
  }

  await writeLog(docId, req.user.id, "UNSHARE", { shared_with: recipientId }, null);
  res.json({ message: "Share removed" });
};

module.exports = {
  getAll,
  getOne,
  upload,
  updateMetadata,
  softDelete,
  preview,
  download,
  listShares,
  share,
  unshare,
};
