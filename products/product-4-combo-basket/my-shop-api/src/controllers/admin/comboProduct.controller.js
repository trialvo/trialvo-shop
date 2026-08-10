const { ComboProduct, ComboProductItem, Product, Category } = require('../../models');
const { Op } = require('sequelize');

const PRODUCT_ATTRS = ['id', 'name', 'slug', 'image', 'price', 'original_price', 'in_stock', 'category_id'];

// Helper: re-compute original_price from items
const computeOriginalPrice = async (items) => {
 let total = 0;
 for (const item of items) {
  const p = await Product.findByPk(item.product_id, { attributes: ['original_price', 'price'] });
  if (p) total += Number(p.original_price || p.price) * (item.qty || 1);
 }
 return Math.round(total * 100) / 100;
};

// Helper: save items atomically (delete old, insert new)
const saveItems = async (combo_id, items) => {
 await ComboProductItem.destroy({ where: { combo_id } });
 if (items?.length) {
  await ComboProductItem.bulkCreate(
   items.map(i => ({ combo_id, product_id: i.product_id, qty: i.qty || 1, custom_label: i.custom_label || null }))
  );
 }
};

// Helper: include for combo with items
const fullInclude = [
 {
  model: ComboProductItem, as: 'items',
  include: [{ model: Product, as: 'product', attributes: PRODUCT_ATTRS }],
  order: [['id', 'ASC']],
 },
];

// Generate slug
const slugify = (str) => str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
const uniqueSlug = async (base, excludeId) => {
 let slug = slugify(base);
 let counter = 0;
 while (true) {
  const candidate = counter === 0 ? slug : `${slug}-${counter}`;
  const where = { slug: candidate };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await ComboProduct.findOne({ where });
  if (!existing) return candidate;
  counter++;
 }
};

// ─── LIST ─────────────────────────────────────────────
exports.list = async (req, res, next) => {
 try {
  const { search = '', page = 1, limit = 15, active } = req.query;
  const where = {};
  if (search) where.name = { [Op.like]: `%${search}%` };
  if (active === 'true') where.is_active = true;
  if (active === 'false') where.is_active = false;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: combos, count: total } = await ComboProduct.findAndCountAll({
   where,
   include: fullInclude,
   order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
   offset, limit: Number(limit),
  });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), combos });
 } catch (err) { next(err); }
};

// ─── GET ONE ──────────────────────────────────────────
exports.getOne = async (req, res, next) => {
 try {
  const combo = await ComboProduct.findByPk(req.params.id, { include: fullInclude });
  if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
  res.json({ success: true, combo });
 } catch (err) { next(err); }
};

// ─── CREATE ───────────────────────────────────────────
exports.create = async (req, res, next) => {
 try {
  const {
   name, description, short_description, image, images,
   bundle_price, original_price, in_stock, stock_qty,
   is_active, is_featured, sort_order, tags,
   items = [], // [{ product_id, qty, custom_label }]
  } = req.body;

  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  if (!bundle_price) return res.status(400).json({ success: false, message: 'Bundle price is required' });

  const slug = await uniqueSlug(name);
  // Auto-compute original_price if not provided
  const finalOriginalPrice = original_price || (items.length ? await computeOriginalPrice(items) : bundle_price);

  const combo = await ComboProduct.create({
   name, slug, description, short_description, image, images: images || [],
   bundle_price: Number(bundle_price), original_price: Number(finalOriginalPrice),
   in_stock: in_stock !== false, stock_qty: Number(stock_qty) || 0,
   is_active: is_active !== false, is_featured: !!is_featured,
   sort_order: Number(sort_order) || 0, tags: tags || [],
  });

  await saveItems(combo.id, items);

  const fresh = await ComboProduct.findByPk(combo.id, { include: fullInclude });
  res.status(201).json({ success: true, combo: fresh });
 } catch (err) { next(err); }
};

// ─── UPDATE ───────────────────────────────────────────
exports.update = async (req, res, next) => {
 try {
  const combo = await ComboProduct.findByPk(req.params.id);
  if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

  const {
   name, description, short_description, image, images,
   bundle_price, original_price, in_stock, stock_qty,
   is_active, is_featured, sort_order, tags,
   items,
  } = req.body;

  const updates = {};
  if (name !== undefined) { updates.name = name; updates.slug = await uniqueSlug(name, combo.id); }
  if (description !== undefined) updates.description = description;
  if (short_description !== undefined) updates.short_description = short_description;
  if (image !== undefined) updates.image = image;
  if (images !== undefined) updates.images = images;
  if (bundle_price !== undefined) updates.bundle_price = Number(bundle_price);
  if (original_price !== undefined) updates.original_price = Number(original_price);
  if (in_stock !== undefined) updates.in_stock = !!in_stock;
  if (stock_qty !== undefined) updates.stock_qty = Number(stock_qty);
  if (is_active !== undefined) updates.is_active = !!is_active;
  if (is_featured !== undefined) updates.is_featured = !!is_featured;
  if (sort_order !== undefined) updates.sort_order = Number(sort_order);
  if (tags !== undefined) updates.tags = tags;

  // If items updated and no manual original_price, auto-recompute
  if (items !== undefined && original_price === undefined) {
   updates.original_price = await computeOriginalPrice(items);
  }

  await combo.update(updates);
  if (items !== undefined) await saveItems(combo.id, items);

  const fresh = await ComboProduct.findByPk(combo.id, { include: fullInclude });
  res.json({ success: true, combo: fresh });
 } catch (err) { next(err); }
};

// ─── TOGGLE ACTIVE ────────────────────────────────────
exports.toggle = async (req, res, next) => {
 try {
  const combo = await ComboProduct.findByPk(req.params.id);
  if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
  await combo.update({ is_active: !combo.is_active });
  res.json({ success: true, is_active: combo.is_active });
 } catch (err) { next(err); }
};

// ─── DELETE ───────────────────────────────────────────
exports.destroy = async (req, res, next) => {
 try {
  const combo = await ComboProduct.findByPk(req.params.id);
  if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
  await ComboProductItem.destroy({ where: { combo_id: combo.id } });
  await combo.destroy();
  res.json({ success: true });
 } catch (err) { next(err); }
};
