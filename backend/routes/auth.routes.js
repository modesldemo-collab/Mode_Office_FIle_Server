/**
 * routes/auth.routes.js
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
	login,
	register,
	me,
	changePassword,
	shareableUsers,
} = require("../controllers/auth.controller");

router.post("/login", login);
router.post("/register", register);
router.get("/me",     authenticate, me);
router.post("/change-password", authenticate, changePassword);
router.get("/share-users", authenticate, shareableUsers);

module.exports = router;
