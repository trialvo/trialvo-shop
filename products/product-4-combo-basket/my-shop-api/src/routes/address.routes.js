const router = require("express").Router();
const { getAddresses, addAddress, updateAddress, deleteAddress } = require("../controllers/address.controller");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
