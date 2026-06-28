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
  getProjectUpdates,
} = require("../controllers/project.controller");
const { getProjectAttachments } = require("../controllers/task.controller");

router.get("/", authenticate, list);
router.post("/", authenticate, create);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);
router.get("/:id/attachments", authenticate, getProjectAttachments);
router.get("/:id/updates", authenticate, getProjectUpdates);

module.exports = router;
