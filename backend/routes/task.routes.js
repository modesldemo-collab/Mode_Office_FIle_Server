/**
 * routes/task.routes.js
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const upload = require("../config/multer");
const {
  list,
  create,
  updateTaskDetails,
  assignToUser,
  selfAssign,
  updateStatus,
  restore,
  remove,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  downloadAttachment,
  previewAttachment,
  submitForReview,
  reviewTask,
} = require("../controllers/task.controller");

router.get("/", authenticate, list);
router.post("/", authenticate, create);
router.patch("/:id", authenticate, updateTaskDetails);
router.patch("/:id/assign", authenticate, assignToUser);
router.patch("/:id/self-assign", authenticate, selfAssign);
router.patch("/:id/status", authenticate, updateStatus);
router.patch("/:id/restore", authenticate, restore);
router.delete("/:id", authenticate, remove);

// New task attachments & review routes
router.post("/:id/attachments", authenticate, upload.single("file"), uploadAttachment);
router.get("/:id/attachments", authenticate, getAttachments);
router.delete("/attachments/:attachmentId", authenticate, deleteAttachment);
router.get("/attachments/:attachmentId/download", authenticate, downloadAttachment);
router.get("/attachments/:attachmentId/preview", authenticate, previewAttachment);

router.patch("/:id/submit", authenticate, submitForReview);
router.patch("/:id/review", authenticate, reviewTask);

module.exports = router;
