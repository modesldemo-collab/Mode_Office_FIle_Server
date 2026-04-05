/**
 * routes/person.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly }  = require("../middleware/auth.middleware");
const { getAll, create, remove }   = require("../controllers/person.controller");

router.get("/",       authenticate,            getAll);
router.post("/",      authenticate, adminOnly, create);
router.delete("/:id", authenticate, adminOnly, remove);

module.exports = router;
