/**
 * controllers/person.controller.js
 */

const { db } = require("../models/db");

const getAll = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, d.dept_name
     FROM responsible_persons p
     LEFT JOIN departments d ON p.dept_id = d.id
     ORDER BY p.name`
  );
  res.json(rows);
};

const create = async (req, res) => {
  const { name, email, dept_id } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const [result] = await db.query(
    "INSERT INTO responsible_persons (name, email, dept_id) VALUES (?,?,?)",
    [name, email || null, dept_id || null]
  );
  res.status(201).json({ id: result.insertId, name, email });
};

const remove = async (req, res) => {
  await db.query("DELETE FROM responsible_persons WHERE id = ?", [req.params.id]);
  res.json({ message: "Deleted" });
};

module.exports = { getAll, create, remove };
