/**
 * routes/log.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly }   = require("../middleware/auth.middleware");
const { getAll, getByDocument }     = require("../controllers/log.controller");

router.get("/",         authenticate, adminOnly, getAll);
router.get("/:docId",   authenticate, getByDocument);

module.exports = router;
