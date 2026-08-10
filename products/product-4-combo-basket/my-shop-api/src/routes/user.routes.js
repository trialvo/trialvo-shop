const router = require("express").Router();
const User = require("../models/User");
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

// GET /api/users  [admin]
router.get("/", async (req, res, next) => {
 try {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (search) filter.$or = [
   { name: { $regex: search, $options: "i" } },
   { email: { $regex: search, $options: "i" } },
  ];
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
   User.find(filter).sort("-createdAt").skip(skip).limit(Number(limit)),
   User.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), users });
 } catch (err) { next(err); }
});

// GET /api/users/:id  [admin]
router.get("/:id", async (req, res, next) => {
 try {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "ব্যবহারকারী পাওয়া যায়নি" });
  const orders = await Order.find({ user: req.params.id }).sort("-createdAt").limit(10);
  res.json({ success: true, user, recentOrders: orders });
 } catch (err) { next(err); }
});

// PUT /api/users/:id  [admin — toggle active, change role]
router.put("/:id", async (req, res, next) => {
 try {
  const { isActive, role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive, role }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: "ব্যবহারকারী পাওয়া যায়নি" });
  res.json({ success: true, user });
 } catch (err) { next(err); }
});

module.exports = router;
