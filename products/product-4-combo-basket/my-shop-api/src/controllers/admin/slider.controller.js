const { Slider, Product } = require('../../models');
const { processImage } = require('../../middleware/upload');

const PRODUCT_ATTRS = ['id', 'name', 'slug', 'image', 'price', 'discount_amount', 'sell_price', 'original_price'];
const PRODUCT_INCLUDE = [{ model: Product, as: 'product', attributes: PRODUCT_ATTRS }];

// ── Helper: build relative path (frontend prepends IMAGE_BASE_URL) ────────────
function buildUrl(req, filename) {
 return `/uploads/images/${filename}`;
}

// POST /sliders/upload-banner
exports.uploadBanner = async (req, res) => {
 if (!req.file) return res.status(400).json({ success: false, message: 'কোনো ছবি পাওয়া যায়নি' });
 try {
  const { filename, size } = await processImage(req.file.buffer, req.file.originalname);
  const url = buildUrl(req, filename);
  return res.json({ success: true, url, filename, size });
 } catch (err) {
  return res.status(500).json({ success: false, message: 'ছবি প্রসেস করতে ব্যর্থ: ' + err.message });
 }
};



exports.getSliders = async (req, res, next) => {
 try {
  const sliders = await Slider.findAll({
   include: PRODUCT_INCLUDE,
   order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });
  res.json({ success: true, sliders });
 } catch (err) { next(err); }
};

exports.createSlider = async (req, res, next) => {
 try {
  const slider = await Slider.create(req.body);
  res.status(201).json({ success: true, slider });
 } catch (err) { next(err); }
};

exports.updateSlider = async (req, res, next) => {
 try {
  const [updated] = await Slider.update(req.body, { where: { id: req.params.id } });
  if (!updated) return res.status(404).json({ success: false, message: 'Slider পাওয়া যায়নি' });
  const slider = await Slider.findByPk(req.params.id, { include: PRODUCT_INCLUDE });
  res.json({ success: true, slider });
 } catch (err) { next(err); }
};

exports.deleteSlider = async (req, res, next) => {
 try {
  const deleted = await Slider.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ success: false, message: 'Slider পাওয়া যায়নি' });
  res.json({ success: true, message: 'Slider মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};

exports.reorderSliders = async (req, res, next) => {
 try {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Invalid order data' });
  await Promise.all(order.map(({ id, sort_order }) =>
   Slider.update({ sort_order }, { where: { id } })
  ));
  res.json({ success: true, message: 'ক্রম আপডেট হয়েছে' });
 } catch (err) { next(err); }
};

exports.duplicateSlider = async (req, res, next) => {
 try {
  const src = await Slider.findByPk(req.params.id);
  if (!src) return res.status(404).json({ success: false, message: 'Slider পাওয়া যায়নি' });
  const { id, createdAt, updatedAt, ...rest } = src.toJSON();
  const copy = await Slider.create({
   ...rest,
   title: `${rest.title} (Copy)`,
   sort_order: rest.sort_order + 1,
   is_active: false,
  });
  res.status(201).json({ success: true, slider: copy });
 } catch (err) { next(err); }
};

