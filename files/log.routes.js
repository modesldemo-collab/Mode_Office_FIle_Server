/**
 * routes/log.routes.js
 */

const router = require("express").Router();
const { authenticate }              = require("../middleware/auth.middleware");
const { getAll, getByDocument }     = require("../controllers/log.controller");

router.get("/",         authenticate, getAll);
router.get("/:docId",   authenticate, getByDocument);

module.exports = router;
