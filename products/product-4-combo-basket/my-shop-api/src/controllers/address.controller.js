const { Address } = require('../models');

exports.getAddresses = async (req, res, next) => {
 try {
  const addresses = await Address.findAll({ where: { user_id: req.user.id } });
  res.json({ success: true, addresses });
 } catch (err) { next(err); }
};

exports.addAddress = async (req, res, next) => {
 try {
  if (req.body.is_default) await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  const address = await Address.create({ ...req.body, user_id: req.user.id });
  res.status(201).json({ success: true, address });
 } catch (err) { next(err); }
};

exports.updateAddress = async (req, res, next) => {
 try {
  if (req.body.is_default) await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  const [updated] = await Address.update(req.body, { where: { id: req.params.id, user_id: req.user.id } });
  if (!updated) return res.status(404).json({ success: false, message: 'ঠিকানা পাওয়া যায়নি' });
  const address = await Address.findByPk(req.params.id);
  res.json({ success: true, address });
 } catch (err) { next(err); }
};

exports.deleteAddress = async (req, res, next) => {
 try {
  await Address.destroy({ where: { id: req.params.id, user_id: req.user.id } });
  res.json({ success: true });
 } catch (err) { next(err); }
};
