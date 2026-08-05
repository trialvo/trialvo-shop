let cachedPermissionConfig = null;

const DEFAULT_SCOPE = "default";

const PERMISSION_DEFINITIONS = [
  // forgot_pass_method
  {
    section: "forgot_pass_method",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "forgot_pass_method",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  // forget_pass_method_admin
  {
    section: "forget_pass_method_admin",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "forget_pass_method_admin",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  // order_place_permission -> regular
  // NOTE: email_verified is intentionally omitted — it is always required (hardcoded in
  // validateRegularOrderPermission). Unverified customers should use guest checkout instead.
  {
    section: "order_place_permission",
    scope: "regular",
    key_name: "phone_verified_mode",
    value_type: "enum",
    enum_values: "address_phone_verified,default_phone_verified,both,no_phone_verification_needed",
    default_value: "both"
  },
  // order_place_permission -> guest
  // NOTE: is_email_verification_required is intentionally omitted — guest email OTP
  // verification was removed (V2-044). is_email_required remains configurable.
  {
    section: "order_place_permission",
    scope: "guest",
    key_name: "is_email_required",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "order_place_permission",
    scope: "guest",
    key_name: "is_phone_verification_required",
    value_type: "bool",
    default_value: "true"
  },
  // order_place_permission -> admin_manual
  {
    section: "order_place_permission",
    scope: "admin_manual",
    key_name: "email_verified",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "order_place_permission",
    scope: "admin_manual",
    key_name: "phone_verified_mode",
    value_type: "enum",
    enum_values: "address_phone_verified,default_phone_verified,both,no_phone_verification_needed",
    default_value: "no_phone_verification_needed"
  },
  // order_place_permission -> single_page
  {
    section: "order_place_permission",
    scope: "single_page",
    key_name: "email_verified",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "order_place_permission",
    scope: "single_page",
    key_name: "phone_verified",
    value_type: "bool",
    default_value: "false"
  },
  // order_status_notification_user
  {
    section: "order_status_notification_user",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "order_status_notification_user",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "order_status_notification_user",
    scope: DEFAULT_SCOPE,
    key_name: "firebase_push_notification",
    value_type: "bool",
    default_value: "false"
  },
  // order__notification_admin (replaces legacy order_status_notification_admin)

  {
    section: "order__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "order__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "order__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "firebase_push_notification",
    value_type: "bool",
    default_value: "true"
  },
  // personal_notification_admin
  {
    section: "personal_notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "personal_notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "personal_notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "firebase_push_notification",
    value_type: "bool",
    default_value: "false"
  },
  // contact__notification_admin (V2-036)
  {
    section: "contact__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "contact__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "contact__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "firebase_push_notification",
    value_type: "bool",
    default_value: "false"
  },
  // report__notification_admin (V2-036)
  {
    section: "report__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "email",
    value_type: "bool",
    default_value: "true"
  },
  {
    section: "report__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "sms",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "report__notification_admin",
    scope: DEFAULT_SCOPE,
    key_name: "firebase_push_notification",
    value_type: "bool",
    default_value: "false"
  },
  // overall_cart_discount
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "is_enabled",
    value_type: "bool",
    default_value: "false"
  },
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "min_item_count",
    value_type: "number",
    default_value: "0"
  },
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "min_total_selling_price",
    value_type: "number",
    default_value: "0"
  },
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "discount_type",
    value_type: "enum",
    enum_values: "flat,percentage",
    default_value: "flat"
  },
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "discount_value",
    value_type: "number",
    default_value: "0"
  },
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "basis",
    value_type: "enum",
    enum_values: "item_count,total_selling_price",
    default_value: "item_count"
  },
  {
    section: "overall_cart_discount",
    scope: DEFAULT_SCOPE,
    key_name: "apply_with_bulk_combo",
    value_type: "bool",
    default_value: "true"
  },
  // announcement
  {
    section: "announcement",
    scope: DEFAULT_SCOPE,
    key_name: "auto_send_scheduled_announcement",
    value_type: "bool",
    default_value: "false"
  }
];

const makeKey = (section, scope, keyName) => `${section}.${scope}.${keyName}`;

const PERMISSION_DEFINITION_MAP = PERMISSION_DEFINITIONS.reduce((acc, item) => {
  acc[makeKey(item.section, item.scope, item.key_name)] = item;
  return acc;
}, {});

exports.PERMISSION_DEFINITIONS = PERMISSION_DEFINITIONS;
exports.PERMISSION_DEFINITION_MAP = PERMISSION_DEFINITION_MAP;
exports.DEFAULT_SCOPE = DEFAULT_SCOPE;

exports.getPermissionConfig = async (connection, forceReload = false, section = null) => {
  if (!forceReload && !section && cachedPermissionConfig) {
    return cachedPermissionConfig;
  }

  let sql = `
    SELECT
      section,
      scope,
      key_name,
      value,
      value_type,
      enum_values,
      is_active,
      updated_at
    FROM permission_config
  `;
  const params = [];

  if (section) {
    sql += " WHERE section = ?";
    params.push(section);
  }

  sql += " ORDER BY section, scope, key_name";

  const rows = await connection.query(sql, params);

  if (!section) {
    cachedPermissionConfig = rows;
  }

  return rows;
};

exports.ensurePermissionDefaults = async (connection) => {
  const existing = await connection.query(`
    SELECT section, scope, key_name
    FROM permission_config
  `);

  const existingSet = new Set(
    existing.map((row) => makeKey(row.section, row.scope, row.key_name))
  );

  // Insert any missing defaults
  for (const def of PERMISSION_DEFINITIONS) {
    const key = makeKey(def.section, def.scope, def.key_name);
    if (existingSet.has(key)) continue;

    await connection.query(
      `
      INSERT INTO permission_config
      (section, scope, key_name, value, value_type, enum_values, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        def.section,
        def.scope,
        def.key_name,
        def.default_value,
        def.value_type,
        def.enum_values || null
      ]
    );
  }

  // Remove deprecated rows that are no longer in PERMISSION_DEFINITIONS
  const definedSet = new Set(
    PERMISSION_DEFINITIONS.map((def) => makeKey(def.section, def.scope, def.key_name))
  );
  for (const row of existing) {
    const key = makeKey(row.section, row.scope, row.key_name);
    if (!definedSet.has(key)) {
      await connection.query(
        `DELETE FROM permission_config WHERE section = ? AND scope = ? AND key_name = ?`,
        [row.section, row.scope, row.key_name]
      );
    }
  }

  cachedPermissionConfig = null;
};

exports.clearPermissionCache = () => {
  cachedPermissionConfig = null;
};
