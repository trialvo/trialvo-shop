const { ShopConfig } = require('../../models');
const auditLogger = require('../../utils/auditLogger');
const { callFraudApi } = require('../../utils/fraudChecker');

/* ─── Helper: map incoming mode payload → DB column updates ─── */
const FIELD_MAP = {
 isActive: '_is_active',
 discountAmount: '_discount_percent',
 discountType: '_discount_type',
 minAmountForDiscount: '_min_amount_for_discount',
 minAmountForFreeDelivery: '_min_free_delivery',
 deliveryCharge: '_delivery_charge',
 deliveryConfig: '_delivery_config',
};

function applyModeUpdates(updates, mode, prefix) {
 if (!mode) return;
 for (const [key, suffix] of Object.entries(FIELD_MAP)) {
  if (mode[key] !== undefined) updates[prefix + suffix] = mode[key];
 }
}

/* ─── Helper: format a mode for the API response ─── */
function mapMode(cfg, prefix) {
 return {
  isActive: cfg[prefix + '_is_active'],
  discountAmount: cfg[prefix + '_discount_percent'],
  discountType: cfg[prefix + '_discount_type'],
  minAmountForDiscount: Number(cfg[prefix + '_min_amount_for_discount']) || 0,
  minAmountForFreeDelivery: Number(cfg[prefix + '_min_free_delivery']) || 0,
  deliveryCharge: Number(cfg[prefix + '_delivery_charge']) || 0,
  deliveryConfig: cfg[prefix + '_delivery_config'] || {},
 };
}

/* ─── Helper: build the full API response ─── */
function buildResponse(cfg) {
 const data = cfg.toJSON ? cfg.toJSON() : cfg;
 return {
  combo: mapMode(data, 'combo'),
  single: mapMode(data, 'single'),
  combo_bundle: mapMode(data, 'combo_bundle'),
  fraud_checker: {
   enabled: data.fraud_checker_enabled,
   api_key_set: !!data.fraud_checker_api_key,
   api_key_masked: data.fraud_checker_api_key
    ? data.fraud_checker_api_key.replace(/./g, (c, i) => i < 4 ? c : '•')
    : null,
  },
  delivery_zones: data.delivery_zones || [],
 };
}


exports.getConfig = async (req, res, next) => {
 try {
  const cfg = await ShopConfig.getConfig();
  res.json({ success: true, config: buildResponse(cfg) });
 } catch (err) { next(err); }
};

exports.updateConfig = async (req, res, next) => {
 try {
  const cfg = await ShopConfig.getConfig();
  const oldValues = cfg.toJSON();

  // Accept both snake_case and camelCase for combo_bundle
  const { combo, single, combo_bundle, comboBundle, fraud, fraud_checker, delivery_zones } = req.body;
  const updates = {};

  applyModeUpdates(updates, combo, 'combo');
  applyModeUpdates(updates, single, 'single');
  applyModeUpdates(updates, combo_bundle || comboBundle, 'combo_bundle');

  // Handle fraud checker
  const fraudData = fraud || fraud_checker;
  if (fraudData) {
   if (fraudData.enabled !== undefined) updates.fraud_checker_enabled = !!fraudData.enabled;
   if (fraudData.apiKey && !fraudData.apiKey.includes('•')) {
    updates.fraud_checker_api_key = fraudData.apiKey.trim();
   }
   if (fraudData.api_key && !fraudData.api_key.includes('•')) {
    updates.fraud_checker_api_key = fraudData.api_key.trim();
   }
   if (fraudData.clearKey === true) updates.fraud_checker_api_key = null;
  }

  if (delivery_zones !== undefined) {
   updates.delivery_zones = delivery_zones;
  }

  await cfg.update(updates);
  await auditLogger(req, 'config', cfg.id, 'update', oldValues, updates, 'Shop config updated');

  const updatedCfg = await ShopConfig.getConfig();
  res.json({ success: true, config: buildResponse(updatedCfg) });
 } catch (err) { next(err); }
};

exports.testFraud = async (req, res, next) => {
 try {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });
  const cfg = await ShopConfig.getConfig();
  if (!cfg.fraud_checker_api_key) {
   return res.status(400).json({ success: false, message: 'API key not configured' });
  }
  const result = await callFraudApi(phone, cfg.fraud_checker_api_key);
  if (!result) return res.status(502).json({ success: false, message: 'Fraud API call failed' });
  res.json({ success: true, result });
 } catch (err) { next(err); }
};
