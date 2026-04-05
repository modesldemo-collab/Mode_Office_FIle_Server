/**
 * utils/auditLog.js
 */

const { db } = require("../models/db");

const writeLog = async (docId, editedBy, actionType, oldValue, newValue) => {
  await db.query(
    `INSERT INTO document_logs (doc_id, edited_by, action_type, old_value, new_value)
     VALUES (?, ?, ?, ?, ?)`,
    [
      docId || null,
      editedBy || null,
      actionType || "UNKNOWN",
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
    ]
  );
};

module.exports = { writeLog };
