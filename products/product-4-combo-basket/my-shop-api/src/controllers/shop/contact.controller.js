const { ContactMessage } = require('../../models');

exports.submitContact = async (req, res, next) => {
 try {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'নাম, ইমেইল ও মেসেজ দিন' });
  await ContactMessage.create({ name, email, phone, subject, message });
  res.status(201).json({ success: true, message: 'আপনার বার্তা পাঠানো হয়েছে।' });
 } catch (err) { next(err); }
};
