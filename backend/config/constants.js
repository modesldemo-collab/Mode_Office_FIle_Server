/**
 * config/constants.js
 * Centralized environment-backed constants.
 */

const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

module.exports = {
  JWT_SECRET,
  UPLOAD_DIR,
};
