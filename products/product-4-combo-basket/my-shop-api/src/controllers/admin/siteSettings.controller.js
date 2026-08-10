const { SiteSettings } = require('../../models');

// ── Helper: parse JSON text fields from req.body ──────────────────────────────
const JSON_FIELDS = [
 'about_stats', 'about_values', 'about_team',
 'footer_quick_links', 'footer_company_links', 'footer_support_links',
];

function prepareUpdates(body) {
 const updates = { ...body };
 // Remove id if accidentally sent
 delete updates.id;
 delete updates.createdAt;
 delete updates.updatedAt;

 // Coerce boolean fields (checkboxes may send "true"/"false" strings)
 const BOOL_FIELDS = [
  'home_show_featured', 'home_show_categories',
  'home_show_process_steps', 'home_show_testimonials',
  'home_show_category_sections',
 ];
 for (const f of BOOL_FIELDS) {
  if (f in updates) updates[f] = updates[f] === true || updates[f] === 'true';
 }

 // Stringify JSON fields if they arrive as arrays/objects
 for (const f of JSON_FIELDS) {
  if (f in updates && typeof updates[f] !== 'string') {
   updates[f] = JSON.stringify(updates[f]);
  }
 }
 return updates;
}

exports.getSettings = async (req, res, next) => {
 try {
  const settings = await SiteSettings.getSettings();
  res.json({ success: true, settings });
 } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
 try {
  const settings = await SiteSettings.getSettings();
  const updates = prepareUpdates(req.body);
  await settings.update(updates);
  const fresh = await SiteSettings.getSettings();
  res.json({ success: true, settings: fresh });
 } catch (err) { next(err); }
};
