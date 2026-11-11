/**
 * routes/asset.routes.js
 */

const router = require("express").Router();
const { authenticate, adminOnly } = require("../middleware/auth.middleware");
const upload = require("../config/multer");
const {
  getDashboardData,
  createAsset,
  updateAsset,
  deleteAsset,
} = require("../controllers/asset.controller");

// Only admins can access these routes (as requested)
router.use(authenticate, adminOnly);

router.get("/", getDashboardData);
router.post("/", upload.single("image"), createAsset);
router.put("/:id", upload.single("image"), updateAsset);
router.delete("/:id", deleteAsset);

module.exports = router;
