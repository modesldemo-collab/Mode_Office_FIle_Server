/**
 * ============================================================
 * FILE MANAGEMENT SYSTEM — BACKEND
 * Ministry of Digital Economy, Sri Lanka
 * server.js — Entry point
 * ============================================================
 */

const app    = require("./app");
const { initDB } = require("./models/db");

const PORT = process.env.PORT || 5000;

initDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`\n🚀  MDE File Management Server running on http://localhost:${PORT}\n`)
    );
  })
  .catch((err) => {
    console.error("❌  DB init failed:", err);
    process.exit(1);
  });
