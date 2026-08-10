const router = require("express").Router();
const { register, login, getMe, updateMe, changePassword } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
