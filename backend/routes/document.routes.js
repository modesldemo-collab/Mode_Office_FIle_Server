/**
 * routes/document.routes.js
 */

const router   = require("express").Router();
const { authenticate }  = require("../middleware/auth.middleware");
const upload            = require("../config/multer");
const {
  getAll,
  getOne,
  upload: uploadDoc,
  updateMetadata,
  softDelete,
  preview,
  download,
} = require("../controllers/document.controller");

router.get("/",              authenticate, getAll);
router.get("/:id",           authenticate, getOne);
router.post("/",             authenticate, upload.single("file"), uploadDoc);
router.put("/:id",           authenticate, updateMetadata);
router.delete("/:id",        authenticate, softDelete);
router.get("/:id/preview",   authenticate, preview);
router.get("/:id/download",  authenticate, download);

module.exports = router;
