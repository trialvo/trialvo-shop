const router = require('express').Router();
const { SiteSettings } = require('../../models');

// Public: anyone can read site settings
router.get('/', async (req, res, next) => {
 try {
  const settings = await SiteSettings.getSettings();
  res.json({ success: true, settings });
 } catch (err) { next(err); }
});

module.exports = router;
