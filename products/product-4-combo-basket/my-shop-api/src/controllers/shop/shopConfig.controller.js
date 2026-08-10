const { ShopConfig } = require('../../models');

function mapMode(cfg, prefix) {
 return {
  isActive: cfg[prefix + '_is_active'],
  discountAmount: cfg[prefix + '_discount_percent'],
  discountType: cfg[prefix + '_discount_type'],
  minAmountForDiscount: Number(cfg[prefix + '_min_amount_for_discount']) || 0,
  deliveryConfig: cfg[prefix + '_delivery_config'] || {},
 };
}

exports.getConfig = async (req, res, next) => {
 try {
  const cfg = await ShopConfig.getConfig();
  const data = cfg.toJSON ? cfg.toJSON() : cfg;
  res.json({
   success: true,
   config: {
    combo: mapMode(data, 'combo'),
    single: mapMode(data, 'single'),
    'combo-bundle': mapMode(data, 'combo_bundle'),
    delivery_zones: data.delivery_zones || [],
   },
  });
 } catch (err) { next(err); }
};
