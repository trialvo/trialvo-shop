const { FAQ } = require('../models');

exports.getFAQs = async (req, res, next) => {
 try {
  const faqs = await FAQ.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC'], ['created_at', 'ASC']] });
  res.json({ success: true, faqs });
 } catch (err) { next(err); }
};

exports.createFAQ = async (req, res, next) => {
 try {
  const faq = await FAQ.create(req.body);
  res.status(201).json({ success: true, faq });
 } catch (err) { next(err); }
};

exports.updateFAQ = async (req, res, next) => {
 try {
  const [updated] = await FAQ.update(req.body, { where: { id: req.params.id } });
  if (!updated) return res.status(404).json({ success: false, message: 'FAQ পাওয়া যায়নি' });
  const faq = await FAQ.findByPk(req.params.id);
  res.json({ success: true, faq });
 } catch (err) { next(err); }
};

exports.deleteFAQ = async (req, res, next) => {
 try {
  await FAQ.destroy({ where: { id: req.params.id } });
  res.json({ success: true, message: 'FAQ মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};
