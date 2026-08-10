const router = require("express").Router();
const { submitContact, getMessages, markRead } = require("../controllers/contact.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", submitContact);       // public
router.get("/", protect, adminOnly, getMessages);
router.put("/:id/read", protect, adminOnly, markRead);

module.exports = router;
