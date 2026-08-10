const router = require("express").Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/category.controller");
const { getHomeSections } = require("../controllers/shop/category.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/home-sections", getHomeSections);
router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
