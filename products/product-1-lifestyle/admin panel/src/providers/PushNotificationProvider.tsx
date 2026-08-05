/**
 * src/providers/PushNotificationProvider.tsx  — V2-056
 *
 * Manages FCM push notification permission + token lifecycle for the admin panel:
 *  1. On first render after login, checks permission state and prompts user.
 *  2. If granted, acquires token and registers it with the backend.
 *  3. SW postMessage listener (mount-only useEffect) handles ALL incoming pushes
 *     — both foreground and background — and shows rich toasts + bell badge updates.
 *  4. On logout, unregisters token from backend.
 *
 * NOTE: We do NOT use Firebase's onForegroundMessage(). The raw 'push' event
 * handler in the service worker sends postMessage for every push. Using both
 * onForegroundMessage AND the SW postMessage would cause duplicate toasts.
 */

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, BellOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  requestAndGetToken,
  getFirebaseConfig,
  consumeConfigVersionChanged,
  clearFirebaseConfigCache,
  forceDeleteExistingToken,
} from '@/lib/firebase';
import { registerPushToken, unregisterPushToken } from '@/api/admin-push.api';
import { useAuth } from '@/context/AuthProvider';
import { useAppBranding } from '@/context/AppBrandingContext';
import { pushAdminNotification } from '@/hooks/useAdminNotificationStore';

// ── Deep-link helper ───────────────────────────────────────────────────────────
function buildDeepLinkPath(data: Record<string, string>): string {
  if (data.order_id)   return `/all-orders?orderId=${data.order_id}`;
  if (data.report_id)  return `/support-reports?reportId=${data.report_id}`;
  if (data.message_id) return `/contact-page?messageId=${data.message_id}`;
  return '/dashboard';
}
// ── Storage keys ───────────────────────────────────────────────────────────────
const STORAGE_KEY          = 'gf_admin_fcm_token';
// Persists banner-dismissed state for the tab session (resets on tab close).
const BANNER_DISMISSED_KEY = 'gf_admin_push_banner_dismissed';

// Foreground message handling is done via the SW postMessage listener
// (mount-only useEffect below) — no separate onForegroundMessage needed.

export default function PushNotificationProvider() {
  const { token: authToken } = useAuth();
  const { branding } = useAppBranding();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);

  const tokenRef          = useRef<string | null>(null);
  const isRegisteringRef  = useRef(false);
  // Track previous auth token value to detect genuine login/logout transitions
  const prevAuthTokenRef  = useRef<string | null | undefined>(undefined);
  // Always-current navigate ref so the mount-only SW listener never goes stale
  const navigateRef       = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  // Branding fallback for toast titles (vertical-agnostic)
  const appNameRef = useRef(branding.appName);
  useEffect(() => { appNameRef.current = branding.appName; }, [branding.appName]);

  // ── Single mount-only effect ───────────────────────────────────────────────
  // Registers the SW message listener once. Foreground listener is managed
  // imperatively via onLogin() / onLogout() below.
  useEffect(() => {
    function handleSWMessage(event: MessageEvent) {
      if (event.data?.type === 'GF_PUSH_NOTIFICATION') {
        const { title, body, data, showToast: shouldToast } = event.data;
        const fallbackTitle = appNameRef.current;

        // Update bell badge — returns false if this is a duplicate (dedup guard)
        const wasNew = pushAdminNotification(
          title || fallbackTitle,
          body  || 'You have a new notification.',
          (data || {}) as Record<string, string>
        );

        // Show in-app toast only when:
        // 1. It's a new notification (not duplicate)
        // 2. SW says showToast=true (no OS notification was shown)
        if (wasNew && shouldToast !== false) {
          const deepPath = buildDeepLinkPath((data || {}) as Record<string, string>);
          toast.custom(
            (t) => (
              <div
                role="button"
                tabIndex={0}
                onClick={() => { navigate(deepPath); toast.dismiss(t.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { navigate(deepPath); toast.dismiss(t.id); } }}
                className={`flex items-start gap-3 rounded-xl border border-brand-200 bg-white px-4 py-3 shadow-lg dark:border-brand-700 dark:bg-gray-900 transition-all cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-500/5 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
                style={{ maxWidth: 360 }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title || fallbackTitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{body || 'You have a new notification.'}</p>
                  {data?.order_id && (
                    <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mt-1">
                      🛒 Order #{data.order_id}
                    </p>
                  )}
                  {data?.report_id && (
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1">
                      🚩 Report #{data.report_id}
                    </p>
                  )}
                  {data?.message_id && (
                    <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mt-1">
                      💬 Contact Message #{data.message_id}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                  className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              </div>
            ),
            { duration: 8000, position: 'top-right' }
          );
        }
      } else if (event.data?.type === 'GF_NAVIGATE') {
        // Sent by the service worker notificationclick handler when the admin tab
        // is already open and has been focused. Navigate via React Router so the
        // SPA transitions without a full page reload.
        const path = event.data.path as string | undefined;
        if (path) navigateRef.current(path);
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);


    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      isRegisteringRef.current = false;
    };
  }, []); // ← empty deps: run once on mount, cleanup on unmount only

  // ── Watch authToken transitions ────────────────────────────────────────────
  // React may re-run this block with the same authToken value (StrictMode, etc.)
  // We only act on GENUINE transitions (undefined→token or token→null).
  useEffect(() => {
    const prev = prevAuthTokenRef.current;
    prevAuthTokenRef.current = authToken;

    const justLoggedIn  = !prev && !!authToken;   // undefined/null → token
    const justLoggedOut = !!prev && !authToken;   // token → null/undefined

    if (justLoggedIn) {
      onLogin();
    } else if (justLoggedOut) {
      onLogout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // ── Login handler ──────────────────────────────────────────────────────────
  function onLogin() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    // Check if Firebase config is available from the API
    getFirebaseConfig().then(async (cfg) => {
      if (!cfg?.firebase_config?.apiKey || !cfg?.vapid_key) return;

      if (Notification.permission === 'granted') {
        // If config_version changed since last session, force re-registration
        if (consumeConfigVersionChanged()) {
          console.info('[Push] Config version changed — forcing token re-registration.');
          await forceDeleteExistingToken();
          clearFirebaseConfigCache();
          localStorage.removeItem(STORAGE_KEY);
          tokenRef.current = null;
        }
        void registerToken();
      } else {
        const alreadyDismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1';
        if (!alreadyDismissed) setShowBanner(true);
      }
    }).catch(() => { /* config not available, skip push */ });
  }


  // ── Logout handler ─────────────────────────────────────────────────────────
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

  // ── Register FCM token ─────────────────────────────────────────────────────
  async function registerToken() {
    // Guard against concurrent calls (StrictMode double-invoke, etc.)
    if (isRegisteringRef.current) return;
    isRegisteringRef.current = true;

    try {
      const fcmToken = await requestAndGetToken();
      if (!fcmToken) return;

      tokenRef.current = fcmToken;
      localStorage.setItem(STORAGE_KEY, fcmToken);

      await registerPushToken(fcmToken);
      console.info('[Push] Token registered.');
    } catch (err) {
      console.error('[Push] Token registration failed:', err);
    } finally {
      isRegisteringRef.current = false;
    }
  }

  function handleEnablePush() {
    setShowBanner(false);
    void registerToken();
  }

  function handleDismissBanner() {
    setShowBanner(false);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
  }

  if (!showBanner || !authToken) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl border border-brand-200 bg-white shadow-2xl dark:border-brand-800 dark:bg-gray-900 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Bell size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Enable Push Notifications
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Get real-time alerts for new orders, assignments, and pool updates — even when this tab isn't active.
          </p>
        </div>
        <button
          onClick={handleDismissBanner}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <button
          onClick={handleEnablePush}
          className="flex-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Enable Push
        </button>
        <button
          onClick={handleDismissBanner}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <BellOff size={11} />
          Not Now
        </button>
      </div>
    </div>
  );
}
