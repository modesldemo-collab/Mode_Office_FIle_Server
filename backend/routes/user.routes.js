/**
 * routes/user.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly }    = require("../middleware/auth.middleware");
const { getAll, create, update, changePassword, remove } = require("../controllers/user.controller");

router.get("/",    authenticate, adminOnly, getAll);
router.post("/",   authenticate, adminOnly, create);
router.put("/:id", authenticate, adminOnly, update);
router.put("/:id/password", authenticate, adminOnly, changePassword);
router.delete("/:id", authenticate, adminOnly, remove);

module.exports = router;
