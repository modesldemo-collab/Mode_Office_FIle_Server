/**
 * routes/project.routes.js
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  list,
  create,
  update,
  remove,
} = require("../controllers/project.controller");

router.get("/", authenticate, list);
router.post("/", authenticate, create);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

module.exports = router;
