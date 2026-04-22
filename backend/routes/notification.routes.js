const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { list, markRead, markAllRead } = require("../controllers/notification.controller");

router.get("/", authenticate, list);
router.patch("/:id/read", authenticate, markRead);
router.patch("/read-all", authenticate, markAllRead);

module.exports = router;
