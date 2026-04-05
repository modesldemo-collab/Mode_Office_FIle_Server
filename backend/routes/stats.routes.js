/**
 * routes/stats.routes.js
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { getDashboardStats } = require("../controllers/stats.controller");

router.get("/dashboard", authenticate, getDashboardStats);

module.exports = router;
