const { FAQ } = require('../../models');

exports.getFAQs = async (req, res, next) => {
 try {
  const faqs = await FAQ.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC']] });
  res.json({ success: true, faqs });
 } catch (err) { next(err); }
};
