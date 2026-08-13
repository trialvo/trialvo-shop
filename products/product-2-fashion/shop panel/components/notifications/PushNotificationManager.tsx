"use client";

/**
 * components/notifications/PushNotificationManager.tsx  — V2-035
 *
 * Manages FCM push notification lifecycle for shop customers:
 *  1. Watches login/logout via AuthCookies `auth:changed` window event.
 *  2. On login → prompts for permission (custom banner) → registers token.
 *  3. On logout → deregisters token from backend.
 *  4. Foreground messages → displays a toast via sonner (already in the project).
 *
 * This is a client-only component — mount it once in the layout.
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, X, Package, MessageSquare } from "lucide-react";
import AuthCookies from "@/lib/auth/cookies";
import { requestAndGetToken, getFirebaseConfig, consumeConfigVersionChanged, clearFirebaseConfigCache, forceDeleteExistingToken } from "@/lib/firebase";
import { registerPushToken, unregisterPushToken } from "@/lib/api/push";
import { pushNotification } from "@/hooks/useNotificationStore";

const STORAGE_KEY = "gf_shop_fcm_token";

// Foreground message handling is done via the SW postMessage listener
// (mount-only useEffect below) — no separate onForegroundMessage needed.

// Hard dedup: track recent push keys to prevent ANY duplicate toast
const _recentPushes = new Map<string, number>();

export default function PushNotificationManager() {
  const [showBanner, setShowBanner] = useState(false);
  const tokenRef         = useRef<string | null>(null);
  const isAuthedRef      = useRef(AuthCookies.isAuthenticated());
  const isRegisteringRef = useRef(false);


  // ── Watch auth changes + SW background push → bell badge ────────────────────
  useEffect(() => {
    function handleAuthChange() {
      const nowAuthed = AuthCookies.isAuthenticated();
      const wasAuthed = isAuthedRef.current;
      isAuthedRef.current = nowAuthed;

      if (nowAuthed && !wasAuthed) {
        onLogin();
      } else if (!nowAuthed && wasAuthed) {
        onLogout();
      }
    }

    // Background push (tab was hidden) → SW postMessages here → update bell
    function handleSWMessage(event: MessageEvent) {
      if (event.data?.type === "GF_PUSH_NOTIFICATION") {
        const { title: rawTitle, body: rawBody, data, showToast: shouldToast } = event.data;
        const title = rawTitle || "Vellora";
        const body  = rawBody  || "You have a new notification.";

        // ── Hard dedup (catches ALL duplication sources) ──────────────────
        const entityId = data?.order_id || data?.report_id || data?.message_id || title;
        const pushKey = `${entityId}_${data?.new_status || data?.type || data?.event_type || ''}`;
        const now = Date.now();
        if (_recentPushes.has(pushKey) && now - (_recentPushes.get(pushKey) || 0) < 5000) {
          return; // duplicate within 5s — skip everything
        }
        _recentPushes.set(pushKey, now);
        // Clean old entries
        if (_recentPushes.size > 20) {
          for (const [k, t] of _recentPushes) { if (now - t > 10000) _recentPushes.delete(k); }
        }

        // Update bell badge
        pushNotification(title, body, (data || {}) as Record<string, string>);

        // Skip toast if OS notification was already shown (tab was hidden)
        if (shouldToast === false) return;

        const orderId   = data?.order_id;
        const reportId  = data?.report_id;
        const messageId = data?.message_id;
        const notifType = data?.type;
        const isReplyType = notifType === 'report_reply' || notifType === 'contact_reply';

        toast.custom(
          (t) => (
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                background: "white", border: "1px solid #e5e7eb",
                borderRadius: 14, padding: "12px 16px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)", maxWidth: 360,
              }}
            >
              <div
                style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                  background: isReplyType ? "#eff6ff" : "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isReplyType ? "#2563eb" : "#16a34a",
                }}
              >
                {isReplyType ? <MessageSquare size={16} /> : <Package size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#111827" }}>{title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{body}</p>
                {orderId && !isReplyType && (
                  <a href={`/account/my-order/${orderId}`}
                    style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                    View Order #{orderId} →
                  </a>
                )}
                {isReplyType && reportId && (
                  <a href={`/account/my-reports?reportId=${reportId}`}
                    style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                    View Report #{reportId} →
                  </a>
                )}
                {isReplyType && messageId && !reportId && (
                  <a href={`/account/my-contact?messageId=${messageId}`}
                    style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                    View Message #{messageId} →
                  </a>
                )}
              </div>
              <button
                onClick={() => toast.dismiss(t as string | number)}
                style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
          ),
          { duration: 8000, position: "top-right" }
        );
      }
    }

    if (isAuthedRef.current) onLogin();

    window.addEventListener("auth:changed", handleAuthChange);
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => {
      window.removeEventListener("auth:changed", handleAuthChange);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      isRegisteringRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ── Login handler ────────────────────────────────────────────────────────────
  function onLogin() {
    if (!("Notification" in window)) return;   // browser doesn't support
    if (Notification.permission === "denied") return;

    // Check if Firebase config is available from the API
    getFirebaseConfig().then(async (cfg) => {
      if (!cfg?.firebase_config?.apiKey || !cfg?.vapid_key) return; // not configured

      if (Notification.permission === "granted") {
        // If config_version changed since last session, force re-registration
        if (consumeConfigVersionChanged()) {
          console.info('[Push] Config version changed — forcing token re-registration.');
          await forceDeleteExistingToken();
          clearFirebaseConfigCache();
          localStorage.removeItem(STORAGE_KEY);
          tokenRef.current = null;
        }
        void doRegisterToken();
      } else {
        // Show our custom banner before the browser prompt
        setShowBanner(true);
      }
    }).catch(() => { /* config not available, skip push */ });
  }

  // ── Logout handler ───────────────────────────────────────────────────────────
  function onLogout() {
    setShowBanner(false);
    isRegisteringRef.current = false;

    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
      unregisterPushToken(savedToken).catch(() => {});
      localStorage.removeItem(STORAGE_KEY);
      tokenRef.current = null;
    }
  }

  async function doRegisterToken() {
    if (isRegisteringRef.current) return;
    isRegisteringRef.current = true;

    try {
      const fcmToken = await requestAndGetToken();
      if (!fcmToken) return;

      tokenRef.current = fcmToken;
      localStorage.setItem(STORAGE_KEY, fcmToken);

      await registerPushToken(fcmToken);
      console.info("[Push] Token registered.");
    } catch (err) {
      console.error("[Push] doRegisterToken error:", err);
    } finally {
      isRegisteringRef.current = false;
    }
  }

  function handleEnablePush() {
    setShowBanner(false);
    void doRegisterToken();
  }

  function handleDismiss() {
    setShowBanner(false);
  }

  if (!showBanner) return null;

  // ── Optional in-app notification permission banner ───────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 320,
        borderRadius: 18,
        background: "white",
        border: "1px solid #e5e7eb",
        boxShadow: "0 20px 60px rgba(0,0,0,0.14)",
        overflow: "hidden",
        animation: "slideUpIn 0.35s ease",
      }}
    >
      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 16px 12px" }}>
        <div
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 12,
            background: "#f0fdf4", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#16a34a",
          }}
        >
          <Bell size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>
            Stay in the loop
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            Get real-time updates when your order is confirmed, shipped, or delivered.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", marginTop: -2 }}
        >
          <X size={15} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
        <button
          onClick={handleEnablePush}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
            background: "#16a34a", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          Enable Notifications
        </button>
        <button
          onClick={handleDismiss}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8px 14px",
            borderRadius: 10, border: "1px solid #e5e7eb", background: "transparent",
            color: "#6b7280", fontSize: 12, cursor: "pointer",
          }}
        >
          <BellOff size={13} />
          Not now
        </button>
      </div>
    </div>
  );
}
