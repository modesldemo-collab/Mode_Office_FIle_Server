/**
 * config/constants.js — App-wide constants
 */

const path = require("path");
const fs   = require("fs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
const JWT_SECRET = process.env.JWT_SECRET || "mde_sri_lanka_secret_2025";

// Ensure upload directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

module.exports = { UPLOAD_DIR, JWT_SECRET };
