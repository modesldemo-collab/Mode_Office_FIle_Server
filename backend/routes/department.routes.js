/**
 * routes/department.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly }           = require("../middleware/auth.middleware");
const { getAll, create, update, remove }    = require("../controllers/department.controller");

router.get("/",    authenticate,            getAll);
router.post("/",   authenticate, adminOnly, create);
router.put("/:id", authenticate, adminOnly, update);
router.delete("/:id", authenticate, adminOnly, remove);

module.exports = router;
