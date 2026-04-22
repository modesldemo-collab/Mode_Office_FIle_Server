/**
 * routes/task.routes.js
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  list,
  create,
  assignToUser,
  selfAssign,
  updateStatus,
  restore,
  remove,
} = require("../controllers/task.controller");

router.get("/", authenticate, list);
router.post("/", authenticate, create);
router.patch("/:id/assign", authenticate, assignToUser);
router.patch("/:id/self-assign", authenticate, selfAssign);
router.patch("/:id/status", authenticate, updateStatus);
router.patch("/:id/restore", authenticate, restore);
router.delete("/:id", authenticate, remove);

module.exports = router;
