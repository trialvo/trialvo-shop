const { ShopConfig } = require('../models');

/* Helper: map a DB row prefix to the API‐friendly shape */
const mapMode = (cfg, prefix) => ({
 isActive: cfg[`${prefix}_is_active`],
 discountAmount: cfg[`${prefix}_discount_percent`],
 discountType: cfg[`${prefix}_discount_type`],
 minAmountForDiscount: cfg[`${prefix}_min_amount_for_discount`],
 minAmountForFreeDelivery: cfg[`${prefix}_min_free_delivery`],
 deliveryCharge: cfg[`${prefix}_delivery_charge`],
 deliveryConfig: cfg[`${prefix}_delivery_config`],
});

/* Helper: convert incoming mode payload → DB column updates */
const applyModeUpdates = (updates, mode, prefix) => {
 if (!mode) return;
 const map = {
  isActive: `${prefix}_is_active`,
  discountAmount: `${prefix}_discount_percent`,
  discountType: `${prefix}_discount_type`,
  minAmountForDiscount: `${prefix}_min_amount_for_discount`,
  minAmountForFreeDelivery: `${prefix}_min_free_delivery`,
  deliveryCharge: `${prefix}_delivery_charge`,
  deliveryConfig: `${prefix}_delivery_config`,
 };
 for (const [key, col] of Object.entries(map)) {
  if (mode[key] !== undefined) updates[col] = mode[key];
 }
};

/* Helper: build full response config */
const buildResponse = (cfg) => ({
 combo: mapMode(cfg, 'combo'),
 single: mapMode(cfg, 'single'),
 combo_bundle: mapMode(cfg, 'combo_bundle'),
 fraud_checker: {
  enabled: cfg.fraud_checker_enabled,
  api_key: cfg.fraud_checker_api_key,
 },
 delivery_zones: cfg.delivery_zones || [],
});

exports.getConfig = async (req, res, next) => {
 try {
  const cfg = await ShopConfig.getConfig();
  res.json({ success: true, config: buildResponse(cfg) });
 } catch (err) { next(err); }
};

exports.updateConfig = async (req, res, next) => {
 try {
  const cfg = await ShopConfig.getConfig();
  const { combo, single, combo_bundle, fraud_checker, delivery_zones } = req.body;
  const updates = {};

  applyModeUpdates(updates, combo, 'combo');
  applyModeUpdates(updates, single, 'single');
  applyModeUpdates(updates, combo_bundle, 'combo_bundle');

  if (fraud_checker) {
   if (fraud_checker.enabled !== undefined) updates.fraud_checker_enabled = fraud_checker.enabled;
   if (fraud_checker.api_key !== undefined) updates.fraud_checker_api_key = fraud_checker.api_key;
  }
  if (delivery_zones !== undefined) {
   updates.delivery_zones = delivery_zones;
  }

  await cfg.update(updates);

  const updatedCfg = await ShopConfig.getConfig();
  res.json({ success: true, config: buildResponse(updatedCfg) });
 } catch (err) { next(err); }
};
