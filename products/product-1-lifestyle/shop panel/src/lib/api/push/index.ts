/**
 * lib/api/push/index.ts  — V2-035
 * Customer push token registration API calls.
 */

"use client";

import { api } from "@/lib/api/client";

/**
 * Register (or refresh) an FCM token for the currently authenticated customer.
 */
export async function registerPushToken(fcm_token: string): Promise<void> {
  await api.post("/user/push-token", {
    fcm_token,
    user_agent: navigator.userAgent.slice(0, 512),
  });
}

/**
 * Deregister an FCM token (called on logout or permission revoked).
 */
export async function unregisterPushToken(fcm_token: string): Promise<void> {
  await api.delete("/user/push-token", { data: { fcm_token } });
}
