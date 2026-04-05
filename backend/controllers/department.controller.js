/**
 * controllers/department.controller.js
 */

const { db } = require("../models/db");

const getAll = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM departments ORDER BY dept_name");
  res.json(rows);
};

const create = async (req, res) => {
  const { dept_name } = req.body;
  if (!dept_name) return res.status(400).json({ error: "dept_name required" });
  const [result] = await db.query(
    "INSERT INTO departments (dept_name) VALUES (?)",
    [dept_name]
  );
  res.status(201).json({ id: result.insertId, dept_name });
};

const update = async (req, res) => {
  const { dept_name } = req.body;
  await db.query("UPDATE departments SET dept_name = ? WHERE id = ?", [
    dept_name,
    req.params.id,
  ]);
  res.json({ message: "Updated" });
};

const remove = async (req, res) => {
  await db.query("DELETE FROM departments WHERE id = ?", [req.params.id]);
  res.json({ message: "Deleted" });
};

module.exports = { getAll, create, update, remove };
