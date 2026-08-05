/**
 * controllers/user_push.js  — V2-035
 * FCM push token management for registered customers (shop panel users).
 *
 * POST   /user/push-token    — Register or refresh a token (auth required)
 * DELETE /user/push-token    — Deregister a token (called on logout)
 */

'use strict';

const { api, userAuth } = require('../helpers/common');
const errors = require('../helpers/errors');


// ─── POST /user/push-token ────────────────────────────────────────────────────

exports.registerUserPushToken = api(
  {
    body: {
      fcm_token:  { type: 'string', required: true  },
      user_agent: { type: 'string', required: false },
    },
  },
  userAuth(async (req, connection, userInfo) => {
    const { fcm_token, user_agent } = req.typed.body;

    if (!fcm_token?.trim()) {
      throw new errors.INVALID_FIELDS_PROVIDED('fcm_token is required');
    }

    // Upsert: if same token already exists for this user → just reactivate + update timestamp.
    // Otherwise insert a fresh row.
    const existing = await connection.queryOne(
      `SELECT id FROM user_push_tokens WHERE user_id = ? AND fcm_token = ?`,
      [userInfo.id, fcm_token]
    );

    if (existing) {
      await connection.query(
        `UPDATE user_push_tokens SET is_active = 1, user_agent = ?, updated_at = NOW() WHERE id = ?`,
        [user_agent?.slice(0, 512) || null, existing.id]
      );
    } else {
      // Deactivate all old tokens for this user — Firebase rotates tokens,
      // so stale entries cause silent push failures.
      await connection.query(
        `UPDATE user_push_tokens SET is_active = 0 WHERE user_id = ? AND is_active = 1`,
        [userInfo.id]
      );
      await connection.query(
        `INSERT INTO user_push_tokens (user_id, fcm_token, user_agent, is_active)
         VALUES (?, ?, ?, 1)`,
        [userInfo.id, fcm_token, user_agent?.slice(0, 512) || null]
      );
    }

    return { success: true, message: 'Push token registered.' };
  })
);

// ─── DELETE /user/push-token ──────────────────────────────────────────────────

exports.unregisterUserPushToken = api(
  {
    body: {
      fcm_token: { type: 'string', required: true },
    },
  },
  userAuth(async (req, connection, userInfo) => {
    const { fcm_token } = req.typed.body;

    await connection.query(
      `UPDATE user_push_tokens SET is_active = 0, updated_at = NOW()
       WHERE user_id = ? AND fcm_token = ?`,
      [userInfo.id, fcm_token]
    );

    return { success: true, message: 'Push token deregistered.' };
  })
);
