const { Product, Category } = require('../models');
const { Op } = require('sequelize');

exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, sort = 'createdAt', order = 'DESC', page = 1, limit = 20, featured, inStock } = req.query;
    const where = {};
    const catWhere = {};

    if (category) catWhere.slug = category;
    if (featured === 'true') where.is_featured = true;
    if (inStock === 'true') where.in_stock = true;
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
    ];

    const offset = (Number(page) - 1) * Number(limit);
    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', where: Object.keys(catWhere).length ? catWhere : undefined, attributes: ['id', 'name', 'slug', 'icon'] }],
      order: [[sort === 'price' ? 'price' : 'created_at', order]],
      offset,
      limit: Number(limit),
    });

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] }],
    });
    if (!product) return res.status(404).json({ success: false, message: 'প্রোডাক্ট পাওয়া যায়নি' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    if (!req.body.slug) req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const [updated] = await Product.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ success: false, message: 'প্রোডাক্ট পাওয়া যায়নি' });
    const product = await Product.findByPk(req.params.id);
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'প্রোডাক্ট পাওয়া যায়নি' });
    res.json({ success: true, message: 'প্রোডাক্ট মুছে ফেলা হয়েছে' });
  } catch (err) { next(err); }
};
