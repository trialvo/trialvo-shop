const router = require("express").Router();
const { getConfig, updateConfig } = require("../controllers/shopConfig.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getConfig);
router.put("/", protect, adminOnly, updateConfig);

module.exports = router;
