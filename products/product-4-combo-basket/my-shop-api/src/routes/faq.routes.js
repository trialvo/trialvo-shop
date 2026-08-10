const router = require("express").Router();
const { getFAQs, createFAQ, updateFAQ, deleteFAQ } = require("../controllers/faq.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getFAQs);
router.post("/", protect, adminOnly, createFAQ);
router.put("/:id", protect, adminOnly, updateFAQ);
router.delete("/:id", protect, adminOnly, deleteFAQ);

module.exports = router;
