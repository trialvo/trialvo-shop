/**
 * src/api/admin-push.api.ts  — V2-034
 * API methods for registering / unregistering FCM push tokens for the signed-in admin.
 */

import { api } from './client';

/**
 * Register (or refresh) an FCM token for the currently authenticated admin.
 */
export async function registerPushToken(fcm_token: string): Promise<void> {
  await api.post('/admin/push-token', {
    fcm_token,
    user_agent: navigator.userAgent.slice(0, 512),
  });
}

/**
 * Deregister an FCM token (called on logout or when permission is revoked).
 */
export async function unregisterPushToken(fcm_token: string): Promise<void> {
  await api.delete('/admin/push-token', { data: { fcm_token } });
}
