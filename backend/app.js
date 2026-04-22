/**
 * app.js — Express app setup
 * Registers global middleware and all route groups.
 */

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const { UPLOAD_DIR } = require("./config/constants");

// ── Route imports ────────────────────────────────────────────
const authRoutes       = require("./routes/auth.routes");
const departmentRoutes = require("./routes/department.routes");
const userRoutes       = require("./routes/user.routes");
const personRoutes     = require("./routes/person.routes");
const documentRoutes   = require("./routes/document.routes");
const logRoutes        = require("./routes/log.routes");
const exportRoutes     = require("./routes/export.routes");
const statsRoutes      = require("./routes/stats.routes");
const taskRoutes       = require("./routes/task.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// ── Global middleware ────────────────────────────────────────
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR)); // Serve uploaded files for preview

// ── API Routes ───────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/persons",     personRoutes);
app.use("/api/documents",   documentRoutes);
app.use("/api/logs",        logRoutes);
app.use("/api/export",      exportRoutes);
app.use("/api/stats",       statsRoutes);
app.use("/api/tasks",       taskRoutes);
app.use("/api/notifications", notificationRoutes);

// ── 404 fallback ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

module.exports = app;
