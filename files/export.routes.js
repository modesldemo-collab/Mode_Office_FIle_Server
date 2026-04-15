/**
 * routes/export.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly }   = require("../middleware/auth.middleware");
const { exportExcel, exportPDF }    = require("../controllers/export.controller");

router.get("/logs/excel", authenticate, adminOnly, exportExcel);
router.get("/logs/pdf",   authenticate, adminOnly, exportPDF);

module.exports = router;
