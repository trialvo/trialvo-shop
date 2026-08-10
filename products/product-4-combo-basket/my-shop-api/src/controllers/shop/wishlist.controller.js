const { Wishlist, Product } = require('../../models');

exports.getWishlist = async (req, res, next) => {
 try {
  const items = await Wishlist.findAll({
   where: { user_id: req.shopUser.id },
   include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'slug', 'price', 'original_price', 'image', 'in_stock', 'rating'] }],
  });
  res.json({ success: true, wishlist: items.map(i => i.product) });
 } catch (err) { next(err); }
};

exports.addToWishlist = async (req, res, next) => {
 try {
  await Wishlist.findOrCreate({ where: { user_id: req.shopUser.id, product_id: req.params.productId } });
  res.json({ success: true, message: 'উইশলিস্টে যোগ হয়েছে' });
 } catch (err) { next(err); }
};

exports.removeFromWishlist = async (req, res, next) => {
 try {
  await Wishlist.destroy({ where: { user_id: req.shopUser.id, product_id: req.params.productId } });
  res.json({ success: true, message: 'উইশলিস্ট থেকে সরানো হয়েছে' });
 } catch (err) { next(err); }
};
