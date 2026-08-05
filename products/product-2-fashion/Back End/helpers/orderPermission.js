/**
 * helpers/orderPermission.js
 *
 * Reusable validator for order placement permissions.
 * Reads the `order_place_permission` section from permission_config and
 * enforces rules for the given scope: regular | guest | admin_manual
 *
 * V2 — added for enforcing configurable order placement restrictions.
 */

const { getPermissionConfig } = require('../config/PermissionSettingsDB');
const errors = require('./errors');

/**
 * Parse raw DB rows for a given section+scope into a flat key→value map.
 */
function extractScopeConfig(rows, section, scope) {
  const result = {};
  for (const row of rows) {
    if (row.section !== section || row.scope !== scope) continue;
    if (row.value_type === 'bool') {
      result[row.key_name] = String(row.value) === 'true';
    } else if (row.value_type === 'number') {
      result[row.key_name] = parseFloat(row.value) || 0;
    } else {
      result[row.key_name] = row.value;
    }
  }
  return result;
}

async function isUsersDefaultPhoneVerified(connection, user) {
  const userId = Number(user?.id || 0);
  const defaultPhoneId = Number(user?.default_phone_id || 0);
  if (!userId || !defaultPhoneId) return false;

  const phone = await connection.queryOne(
    `
    SELECT id, is_verified
    FROM user_phones
    WHERE id = ? AND user_id = ?
    LIMIT 1
    `,
    [defaultPhoneId, userId]
  );

  return !!(phone && (phone.is_verified === 1 || phone.is_verified === true));
}


/**
 * validateRegularOrderPermission(connection, user, address)
 *
 * Enforces `order_place_permission.regular.*` for authenticated shop orders.
 *
 * @param {object} connection   - active DB connection
 * @param {object} user         - userAuth user object (has id, isEmailVerified, default_phone_id)
 * @param {object} address      - address row (has phone_id, phone_verified)
 */
async function validateRegularOrderPermission(connection, user, address) {
  const rows = await getPermissionConfig(connection, false, 'order_place_permission');
  const cfg = extractScopeConfig(rows, 'order_place_permission', 'regular');

  // Email verification is always required for registered customer orders.
  // This is non-configurable by design: unverified users can use guest checkout.
  if (!user.isEmailVerified) {
    throw new errors.UNAUTHORIZED('Email verification is required to place an order.');
  }

  // phone_verified_mode: address_phone_verified | default_phone_verified | both | no_phone_verification_needed
  const mode = cfg.phone_verified_mode || 'both';

  if (mode === 'no_phone_verification_needed') {
    return; // no phone check needed
  }

  const addressPhoneVerified = !!(address.phone_id && address.phone_verified);
  const defaultPhoneVerified = await isUsersDefaultPhoneVerified(connection, user);

  if (mode === 'address_phone_verified') {
    if (!address.phone_id) {
      throw new errors.BAD_REQUEST('Please add a phone number to your address before placing an order.');
    }
    if (!addressPhoneVerified) {
      throw new errors.PHONE_NOT_VERIFIED('The phone number on your address must be verified to place an order.');
    }
  } else if (mode === 'default_phone_verified') {
    if (!defaultPhoneVerified) {
      throw new errors.UNVERIFIED_PHONE('Please set and verify your default phone number to place an order.');
    }
  } else {
    // 'both' — both address phone and default phone must be verified
    if (!address.phone_id) {
      throw new errors.BAD_REQUEST('Please add a phone number to your address before placing an order.');
    }
    if (!addressPhoneVerified) {
      throw new errors.PHONE_NOT_VERIFIED('The phone number on your address must be verified to place an order.');
    }
    if (!defaultPhoneVerified) {
      throw new errors.UNVERIFIED_PHONE('Please set and verify your default phone number to place an order.');
    }
  }
}


/**
 * validateGuestOrderPermission(connection, guestData)
 *
 * Enforces `order_place_permission.guest.*` for guest checkout via placeGuestOrder.
 *
 * @param {object} connection   - active DB connection
 * @param {object} guestData    - merged guest data (name, email, phone, is_phone_verified, is_email_verified)
 */
async function validateGuestOrderPermission(connection, guestData) {
  const rows = await getPermissionConfig(connection, false, 'order_place_permission');
  const cfg = extractScopeConfig(rows, 'order_place_permission', 'guest');

  const isEmailRequired = cfg.is_email_required !== false; // default true
  const isPhoneVerificationRequired = cfg.is_phone_verification_required !== false; // default true

  // Email OTP verification (is_email_verification_required) was removed in V2-044.
  // Guests must provide an email if required, but no OTP verification step.
  if (isEmailRequired && !guestData.email) {
    throw new errors.BAD_REQUEST('Email is required to place a guest order.');
  }

  if (isPhoneVerificationRequired) {
    if (!guestData.is_phone_verified) {
      throw new errors.PHONE_NOT_VERIFIED('Phone must be verified before placing a guest order.');
    }
  }
}


/**
 * validateAdminManualOrderPermission(connection, customer, address)
 *
 * Enforces `order_place_permission.admin_manual.*` for manually-created admin orders.
 *
 * @param {object} connection   - active DB connection
 * @param {object} customer     - customer row (has is_email_verified)
 * @param {object} address      - address row (has phone_id, phone_verified, phone_number)
 */
async function validateAdminManualOrderPermission(connection, customer, address) {
  const rows = await getPermissionConfig(connection, false, 'order_place_permission');
  const cfg = extractScopeConfig(rows, 'order_place_permission', 'admin_manual');

  // By default admin_manual: email_verified=false, phone_verified_mode=no_phone_verification_needed
  const requireEmailVerified = cfg.email_verified === true;
  const mode = cfg.phone_verified_mode || 'no_phone_verification_needed';

  if (requireEmailVerified) {
    if (!customer.is_email_verified) {
      throw new errors.BAD_REQUEST("Customer's email must be verified to create a manual order.");
    }
  }

  if (mode === 'no_phone_verification_needed') {
    return; // no phone check
  }

  const addressPhoneVerified = !!(address.phone_id && address.phone_verified);
  const defaultPhoneVerified = customer.is_fully_verified === true || customer.is_fully_verified === 1;

  if (mode === 'default_phone_verified' || mode === 'both') {
    if (!defaultPhoneVerified) {
      throw new errors.BAD_REQUEST("The customer's default account phone must be verified.");
    }
  }

  if (mode === 'address_phone_verified' || mode === 'both') {
    if (!address.phone_id) {
      throw new errors.BAD_REQUEST("Customer's address must have a phone number.");
    }
    if (!addressPhoneVerified) {
      throw new errors.BAD_REQUEST("The phone number on the selected address must be verified.");
    }
  }
}


/**
 * validateSinglePageOrderPermission(connection, user, address)
 *
 * Enforces `order_place_permission.single_page.*` for single-page checkout orders.
 *
 * @param {object} connection   - active DB connection
 * @param {object} user         - userAuth user object (has id, isEmailVerified, default_phone_id)
 * @param {object} address      - address row (has phone_id, phone_verified)
 */
async function validateSinglePageOrderPermission(connection, user, address) {
  const rows = await getPermissionConfig(connection, false, 'order_place_permission');
  const cfg = extractScopeConfig(rows, 'order_place_permission', 'single_page');

  // email_verified — boolean, default false
  const requireEmailVerified = cfg.email_verified === true;
  if (requireEmailVerified) {
    if (!user.isEmailVerified) {
      throw new errors.UNAUTHORIZED('Email verification is required to place an order.');
    }
  }

  // phone_verified — boolean, default false
  const requirePhoneVerified = cfg.phone_verified === true;
  if (requirePhoneVerified) {
    const addressPhoneVerified = !!(address.phone_id && address.phone_verified);
    if (!addressPhoneVerified) {
      throw new errors.PHONE_NOT_VERIFIED('Phone must be verified before placing an order.');
    }
  }
}


module.exports = {
  validateRegularOrderPermission,
  validateGuestOrderPermission,
  validateAdminManualOrderPermission,
  validateSinglePageOrderPermission,
};
