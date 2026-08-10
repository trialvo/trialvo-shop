const { FAQ } = require('../../models');
const auditLogger = require('../../utils/auditLogger');

exports.getFAQs = async (req, res, next) => {
 try {
  const faqs = await FAQ.findAll({ order: [['sort_order', 'ASC']] });
  res.json({ success: true, faqs });
 } catch (err) { next(err); }
};

exports.createFAQ = async (req, res, next) => {
 try {
  const faq = await FAQ.create({ ...req.body, is_active: req.body.is_active ?? true });
  await auditLogger(req, 'faq', faq.id, 'create', null, faq.toJSON());
  res.status(201).json({ success: true, faq });
 } catch (err) { next(err); }
};

exports.updateFAQ = async (req, res, next) => {
 try {
  const old = await FAQ.findByPk(req.params.id);
  if (!old) return res.status(404).json({ success: false, message: 'FAQ পাওয়া যায়নি' });
  await old.update(req.body);
  await auditLogger(req, 'faq', req.params.id, 'update', old.toJSON(), req.body);
  res.json({ success: true, faq: await FAQ.findByPk(req.params.id) });
 } catch (err) { next(err); }
};

exports.deleteFAQ = async (req, res, next) => {
 try {
  const faq = await FAQ.findByPk(req.params.id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ পাওয়া যায়নি' });
  await auditLogger(req, 'faq', req.params.id, 'delete', faq.toJSON(), null);
  await faq.destroy();
  res.json({ success: true, message: 'FAQ মুছে ফেলা হয়েছে' });
 } catch (err) { next(err); }
};
