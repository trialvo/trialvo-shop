/**
 * controllers/admin_push.js — V2-034
 * Endpoints for registering/deregistering admin FCM tokens.
 * Each browser session registers its own token; tokens are deactivated on logout.
 */
'use strict';

const { api, auth } = require('../helpers/common');
const errors        = require('../helpers/errors');
const database      = require('../utils/connection');

/**
 * POST /admin/push-token
 * Body: { fcm_token: string, user_agent?: string }
 * Upserts an FCM token for the authenticated admin.
 * On duplicate token → just refreshes updated_at.
 */
exports.registerPushToken = api(
  {
    body: {
      fcm_token:  { type: 'string', required: true },
      user_agent: { type: 'string', required: false },
    },
  },
  auth(async (req, connection, adminInfo) => {
    const { fcm_token, user_agent } = req.typed.body;

    if (!fcm_token || fcm_token.trim().length < 10) {
      throw new errors.INVALID_FIELDS_PROVIDED('Invalid FCM token.');
    }

    // Check if token already exists for this admin
    const existing = await connection.queryOne(
      `SELECT id FROM admin_push_tokens WHERE admin_id = ? AND fcm_token = ?`,
      [adminInfo.id, fcm_token]
    );

    if (existing) {
      // Refresh and ensure active
      await connection.query(
        `UPDATE admin_push_tokens SET is_active = 1, user_agent = ?, updated_at = NOW() WHERE id = ?`,
        [user_agent || null, existing.id]
      );
      return { success: true, message: 'Token refreshed.', token_id: existing.id };
    }

    // Deactivate all old tokens for this admin — Firebase rotates tokens,
    // so stale entries will cause push failures (registration-token-not-registered).
    await connection.query(
      `UPDATE admin_push_tokens SET is_active = 0 WHERE admin_id = ? AND is_active = 1`,
      [adminInfo.id]
    );

    // Insert new token
    const result = await connection.query(
      `INSERT INTO admin_push_tokens (admin_id, fcm_token, user_agent, is_active)
       VALUES (?, ?, ?, 1)`,
      [adminInfo.id, fcm_token, user_agent || null]
    );

    console.log(`[PushToken] Registered new token for admin #${adminInfo.id}`);
    return { success: true, message: 'Token registered.', token_id: result.insertId };
  })
);

/**
 * DELETE /admin/push-token
 * Body: { fcm_token: string }
 * Marks the given FCM token as inactive (called on logout / permission revoked).
 */
exports.unregisterPushToken = api(
  {
    body: {
      fcm_token: { type: 'string', required: true },
    },
  },
  auth(async (req, connection, adminInfo) => {
    const { fcm_token } = req.typed.body;

    await connection.query(
      `UPDATE admin_push_tokens SET is_active = 0 WHERE admin_id = ? AND fcm_token = ?`,
      [adminInfo.id, fcm_token]
    );

    console.log(`[PushToken] Unregistered token for admin #${adminInfo.id}`);
    return { success: true, message: 'Token deregistered.' };
  })
);
