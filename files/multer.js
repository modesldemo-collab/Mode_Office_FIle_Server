/**
 * config/multer.js — Multer storage & upload configuration
 */

const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const { UPLOAD_DIR } = require("./constants");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organise uploaded files by year/month
    const folder = path.join(
      UPLOAD_DIR,
      new Date().getFullYear().toString(),
      String(new Date().getMonth() + 1).padStart(2, "0")
    );
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

module.exports = upload;
