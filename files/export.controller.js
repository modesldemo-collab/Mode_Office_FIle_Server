/**
 * controllers/export.controller.js
 * Handles Excel and PDF export of the audit log.
 */

const ExcelJS     = require("exceljs");
const PDFDocument = require("pdfkit");
const { db } = require("../models/db");

// GET /api/export/logs/excel
const exportExcel = async (req, res) => {
  const { from_date, to_date } = req.query;
  const params     = [];
  const conditions = [];

  if (from_date) { conditions.push("l.changed_at >= ?"); params.push(from_date); }
  if (to_date)   { conditions.push("l.changed_at <= ?"); params.push(to_date + " 23:59:59"); }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const [rows] = await db.query(
    `SELECT l.id, d.doc_name, u.username AS editor,
            l.action_type, l.old_value, l.new_value, l.changed_at
     FROM document_logs l
     LEFT JOIN users u ON l.edited_by = u.id
     LEFT JOIN documents d ON l.doc_id = d.id
     ${where}
     ORDER BY l.changed_at DESC`,
    params
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MDE File Management System";
  const sheet = workbook.addWorksheet("Audit Log");

  sheet.columns = [
    { header: "Log ID",    key: "id",          width: 8  },
    { header: "Document",  key: "doc_name",     width: 30 },
    { header: "Edited By", key: "editor",       width: 20 },
    { header: "Action",    key: "action_type",  width: 20 },
    { header: "Old Value", key: "old_value",    width: 40 },
    { header: "New Value", key: "new_value",    width: 40 },
    { header: "Timestamp", key: "changed_at",   width: 25 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: "FF1a3c5e" },
  };

  rows.forEach((r) => {
    sheet.addRow({
      id:          r.id,
      doc_name:    r.doc_name,
      editor:      r.editor,
      action_type: r.action_type,
      old_value:   JSON.stringify(r.old_value),
      new_value:   JSON.stringify(r.new_value),
      changed_at:  new Date(r.changed_at).toLocaleString(),
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=audit_log.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

// GET /api/export/logs/pdf
const exportPDF = async (req, res) => {
  const [rows] = await db.query(
    `SELECT l.id, d.doc_name, u.username AS editor, l.action_type, l.changed_at
     FROM document_logs l
     LEFT JOIN users u ON l.edited_by = u.id
     LEFT JOIN documents d ON l.doc_id = d.id
     ORDER BY l.changed_at DESC
     LIMIT 500`
  );

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=audit_log.pdf");
  doc.pipe(res);

  doc.fontSize(16).text("Ministry of Digital Economy — Audit Log", { align: "center" });
  doc.moveDown();
  doc.fontSize(9);

  rows.forEach((r) => {
    doc.text(
      `[${r.id}] ${new Date(r.changed_at).toLocaleString()} | ${r.action_type} | Doc: ${r.doc_name} | By: ${r.editor}`
    );
  });

  doc.end();
};

module.exports = { exportExcel, exportPDF };
