/**
 * utils/auditLog.js — Writes a row to the document_logs table.
 */

const { db } = require("../models/db");

/**
 * @param {number} docId
 * @param {number} userId
 * @param {string} action   — e.g. 'UPLOAD', 'UPDATE_METADATA', 'DELETE'
 * @param {object|null} oldVal
 * @param {object|null} newVal
 */
async function writeLog(docId, userId, action, oldVal, newVal) {
  await db.query(
    `INSERT INTO document_logs
       (doc_id, edited_by, action_type, old_value, new_value)
     VALUES (?,?,?,?,?)`,
    [docId, userId, action, JSON.stringify(oldVal), JSON.stringify(newVal)]
  );
}

module.exports = { writeLog };
