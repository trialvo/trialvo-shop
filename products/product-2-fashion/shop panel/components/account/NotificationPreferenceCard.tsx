"use client";

/**
 * components/account/NotificationPreferenceCard.tsx — V2-035
 *
 * Lets the customer enable/disable browser push notifications.
 * Does NOT use requestAndGetToken() — manages the full flow directly
 * so errors can be surfaced precisely and clearly.
 *
 * States:
 *   "default"     → browser hasn't been asked yet
 *   "asking"      → browser popup is open — waiting for user action
 *   "granted"     → browser allowed; shows subscribed/unsubscribed toggle
 *   "denied"      → browser blocked; shows unblock guide
 *   "unsupported" → browser doesn't support push
 */

import { getFirebaseConfig } from "@/lib/firebase";
import AuthCookies from "@/lib/auth/cookies";
import { Bell, BellOff, ExternalLink, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { initializeApp, getApps, getApp } from "firebase/app";

const STORAGE_KEY = "gf_shop_fcm_token";
// Same-origin BFF — never use docker-internal API_URL in the browser
const API_BASE = "/api/v1";

// ── Auth-aware fetch helpers ───────────────────────────────────────────────────
async function apiPost(path: string, body: object) {
  const token = AuthCookies.getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

async function apiDelete(path: string, body: object) {
  const token = AuthCookies.getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

// ── Get FCM token — with full stale-subscription cleanup ─────────────────────
async function getFcmToken(): Promise<string | null> {
  const cfg = await getFirebaseConfig();
  if (!cfg?.vapid_key) {
    console.error("[PushPref] VAPID_KEY is not available from API.");
    return null;
  }
  if (!cfg?.firebase_config?.apiKey) {
    console.error("[PushPref] Firebase client config not available from API.");
    return null;
  }

  const VAPID_KEY = cfg.vapid_key;
  const FIREBASE_CFG = cfg.firebase_config;

  // Debug: confirm VAPID key is loaded (first+last 6 chars)
  console.log("[PushPref] VAPID key:", VAPID_KEY.slice(0, 6) + "…" + VAPID_KEY.slice(-6));

  const app       = getApps().length === 0 ? initializeApp(FIREBASE_CFG) : getApp();
  const messaging = getMessaging(app);

  // Step 1 — delete Firebase token record
  try {
    await deleteToken(messaging);
    console.log("[PushPref] Deleted Firebase FCM token record.");
  } catch { /* nothing to delete */ }

  // Step 2 — explicitly unsubscribe at the PushManager level (browser API)
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      try {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          console.log("[PushPref] Cleared push subscription for SW:", reg.scope);
        }
        await reg.unregister();
        console.log("[PushPref] Unregistered SW:", reg.scope);
      } catch (e) {
        console.warn("[PushPref] Error clearing SW:", reg.scope, e);
      }
    }
  } catch (e) {
    console.warn("[PushPref] Could not list SW registrations:", e);
  }

  // Step 3 — register our SW fresh and send config via postMessage
  let swReg: ServiceWorkerRegistration | undefined;
  try {
    swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    await new Promise<void>((resolve) => {
      const worker = swReg!.installing ?? swReg!.waiting ?? swReg!.active;
      if (!worker || worker.state === "activated") { resolve(); return; }
      worker.addEventListener("statechange", function onStateChange() {
        if ((this as ServiceWorker).state === "activated") {
          worker.removeEventListener("statechange", onStateChange);
          resolve();
        }
      });
      setTimeout(resolve, 3000);
    });

    // Send config to SW via postMessage
    const sw = swReg.active ?? swReg.installing ?? swReg.waiting;
    sw?.postMessage({ type: "FIREBASE_CONFIG", config: FIREBASE_CFG });

    console.log("[PushPref] SW activated:", swReg.scope);
  } catch (e) {
    console.warn("[PushPref] SW registration failed — will try without SW:", e);
    swReg = undefined;
  }

  // Step 4 — get fresh FCM token
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });
    if (token) {
      console.log("[PushPref] ✅ getToken succeeded:", token.slice(0, 20) + "…");
      return token;
    }
  } catch (e: unknown) {
    const code = (e as { code?: string }).code ?? "";
    const msg  = e instanceof Error ? e.message : String(e);
    console.warn("[PushPref] getToken attempt 1 failed:", { code, msg });

    if (swReg) {
      console.log("[PushPref] Retrying getToken without custom SW…");
      try {
        const token2 = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token2) {
          console.log("[PushPref] ✅ getToken attempt 2 succeeded:", token2.slice(0, 20) + "…");
          return token2;
        }
      } catch (e2: unknown) {
        const code2 = (e2 as { code?: string }).code ?? "";
        const msg2  = e2 instanceof Error ? e2.message : String(e2);
        console.error("[PushPref] getToken attempt 2 also failed:", { code: code2, msg: msg2 });
        throw new Error(`Firebase getToken failed (${code2 || code || "unknown"}): ${msg2 || msg}`);
      }
    } else {
      throw new Error(`Firebase getToken failed (${code || "unknown"}): ${msg}`);
    }
  }

  console.warn("[PushPref] getToken returned empty token.");
  return null;
}



// ── Types ─────────────────────────────────────────────────────────────────────
type PermState = "loading" | "default" | "asking" | "granted" | "denied" | "unsupported";

// ── Component ──────────────────────────────────────────────────────────────────
export default function NotificationPreferenceCard() {
  const [permState,  setPermState]  = useState<PermState>("loading");
  const [subscribed, setSubscribed] = useState(false);
  const [working,    setWorking]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [info,       setInfo]       = useState<string | null>(null);

  // Sync with real browser permission on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermState("unsupported");
      return;
    }

    // Check if Firebase config is available from API
    getFirebaseConfig().then((cfg) => {
      if (!cfg?.firebase_config?.apiKey || !cfg?.vapid_key) {
        // Firebase not configured — hide the card gracefully
        setPermState("unsupported");
        console.warn("[PushPref] Firebase config not configured in DB.");
        return;
      }

      const perm = Notification.permission;
      if (perm === "denied") {
        setPermState("denied");
      } else if (perm === "granted") {
        setPermState("granted");
        setSubscribed(!!localStorage.getItem(STORAGE_KEY));
      } else {
        setPermState("default");
      }
    }).catch(() => {
      setPermState("unsupported");
    });
  }, []);

  // ── Enable flow ────────────────────────────────────────────────────────────
  async function handleEnable() {
    setError(null);
    setSuccess(null);

    // Step 1 — request browser permission
    setInfo("A browser popup will appear — click 'Allow' to enable notifications.");
    setPermState("asking");


    let browserPerm: NotificationPermission;
    try {
      browserPerm = await Notification.requestPermission();
    } catch {
      // Old callback-style API fallback (some Safari versions)
      browserPerm = Notification.permission;
    }

    setInfo(null);

    if (browserPerm === "denied") {
      setPermState("denied");
      return;
    }
    if (browserPerm !== "granted") {
      // User dismissed without choosing — reset to default
      setPermState("default");
      setError('Click "Allow" in the browser popup to enable notifications.');
      return;
    }

    // Permission granted — Step 1: get FCM token from Firebase
    setPermState("granted");
    setWorking(true);

    let fcmToken: string | null = null;
    try {
      console.log("[PushPref] Permission granted — fetching FCM token…");
      fcmToken = await getFcmToken();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      console.error("[PushPref] Firebase getToken failed:", msg);
      setError(`Could not get a push token from Firebase. Try refreshing the page and enabling again. (${msg})`);
      setWorking(false);
      return;
    }

    if (!fcmToken) {
      setError("Could not get a push token. Make sure Firebase is configured and try again.");
      setWorking(false);
      return;
    }

    // Step 2: register token with backend
    try {
      console.log("[PushPref] Token OK, registering with backend:", fcmToken.slice(0, 20) + "…");
      await apiPost("/user/push-token", {
        fcm_token:  fcmToken,
        user_agent: navigator.userAgent.slice(0, 512),
      });

      localStorage.setItem(STORAGE_KEY, fcmToken);
      setSubscribed(true);
      setSuccess("✓ Push notifications enabled for this browser.");
      console.log("[PushPref] ✅ Token registered successfully.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      console.error("[PushPref] Backend token registration failed:", msg);
      setError(`Got push token but backend registration failed: ${msg}`);

    } finally {
      setWorking(false);
    }
  }

  // ── Disable flow ───────────────────────────────────────────────────────────
  async function handleDisable() {
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const fcmToken = localStorage.getItem(STORAGE_KEY);
      if (fcmToken) {
        console.log("[PushPref] Deregistering token…");
        await apiDelete("/user/push-token", { fcm_token: fcmToken });
        localStorage.removeItem(STORAGE_KEY);
      }
      setSubscribed(false);
      setSuccess("Push notifications disabled for this browser.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setWorking(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (permState === "loading" || permState === "unsupported") return null;

  const isOn = subscribed && permState === "granted";
  const showToggle = permState !== "denied";

  return (
    <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.08)] px-4 py-4">

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {/* Bell icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isOn ? "#dcfce7" : "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isOn
            ? <Bell    size={17} style={{ color: "#16a34a" }} />
            : <BellOff size={17} style={{ color: "#6b7280" }} />}
        </div>

        {/* Label */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>
            Order Push Notifications
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
            Instant browser alerts when your order status changes.
          </p>
        </div>

        {/* Toggle */}
        {showToggle && (
          <button
            type="button"
            id="push-notification-toggle"
            disabled={working || permState === "asking"}
            onClick={isOn ? handleDisable : handleEnable}
            aria-label={isOn ? "Disable push notifications" : "Enable push notifications"}
            aria-pressed={isOn}
            style={{
              flexShrink: 0,
              width: 44, height: 24, borderRadius: 12, border: "none",
              background: isOn ? "#16a34a" : "#d1d5db",
              cursor: (working || permState === "asking") ? "default" : "pointer",
              position: "relative",
              opacity: (working || permState === "asking") ? 0.7 : 1,
              transition: "background .2s",
            }}
          >
            {working
              ? <Loader2
                  size={12}
                  style={{ color: "white", position: "absolute", top: 6, left: 16,
                    animation: "spin 1s linear infinite" }}
                />
              : <span style={{
                  position: "absolute", top: 3,
                  left: isOn ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "white", transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }} />
            }
          </button>
        )}
      </div>

      {/* "asking" info — shown while browser popup is pending */}
      {permState === "asking" && (
        <div style={{
          background: "#eff6ff", borderRadius: 8, padding: "8px 12px",
          display: "flex", gap: 8, alignItems: "flex-start",
          border: "1px solid #bfdbfe", marginTop: 4,
        }}>
          <Info size={14} style={{ color: "#1d4ed8", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: "#1e40af" }}>
            A browser popup should appear — click <strong>Allow</strong> to enable notifications.
          </p>
        </div>
      )}

      {/* Denied state */}
      {permState === "denied" && (
        <div style={{
          background: "#fef9c3", borderRadius: 8, padding: "10px 12px",
          display: "flex", gap: 8, alignItems: "flex-start",
          border: "1px solid #fde047", marginTop: 4,
        }}>
          <Info size={15} style={{ color: "#854d0e", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "#854d0e", fontWeight: 600 }}>
              Notifications are blocked in your browser
            </p>
            <p style={{ margin: "4px 0 6px", fontSize: 12, color: "#78350f" }}>
              Click the 🔒 lock icon in the browser address bar →{" "}
              <strong>Notifications</strong> → <strong>Allow</strong>, then reload this page.
            </p>
            <a
              href="https://support.google.com/chrome/answer/3220216"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              Step-by-step guide <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Contextual hints */}
      {!isOn && permState === "default" && !error && !info && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
          Toggle on — your browser will ask to allow notifications.
        </p>
      )}
      {!subscribed && permState === "granted" && !error && !success && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
          Notifications allowed but not active. Toggle on to subscribe.
        </p>
      )}

      {/* Feedback */}
      {success && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#16a34a", fontWeight: 500 }}>{success}</p>}
      {error   && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#dc2626"               }}>{error}</p>}
    </div>
  );
}
