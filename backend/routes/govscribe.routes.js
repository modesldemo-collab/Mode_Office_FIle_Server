/**
 * routes/govscribe.routes.js
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  generate,
  improve,
  audit,
  getDraft,
  saveDraft,
  exportLetterPDF
} = require("../controllers/govscribe.controller");

router.post("/generate", authenticate, generate);
router.post("/improve", authenticate, improve);
router.post("/audit", authenticate, audit);
router.get("/draft", authenticate, getDraft);
router.post("/draft", authenticate, saveDraft);
router.post("/export-pdf", authenticate, exportLetterPDF);

module.exports = router;
