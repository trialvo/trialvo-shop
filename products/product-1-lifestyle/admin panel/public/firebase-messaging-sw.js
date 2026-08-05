/**
 * public/firebase-messaging-sw.js  — V2-056
 * Firebase background push service worker for Graduate Fashion Admin Panel.
 *
 * DUAL-PATH STRATEGY (prevents duplicate notifications):
 *   PATH A: Firebase IS initialized → onBackgroundMessage handles it
 *   PATH B: Firebase NOT initialized (SW was killed/restarted) → raw 'push' fallback
 *   Only ONE path fires per push event, so exactly one notification is shown.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
const IDB_NAME = 'gf_admin_sw_config';
const IDB_STORE = 'config';

function openConfigDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveConfigToIDB(config) {
  try {
    const db = await openConfigDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(config, 'firebase_config');
    await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = j; });
    db.close();
  } catch (e) { console.warn('[SW] Failed to save config to IDB:', e); }
}

async function loadConfigFromIDB() {
  try {
    const db = await openConfigDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get('firebase_config');
    const result = await new Promise((r, j) => { req.onsuccess = () => r(req.result); req.onerror = j; });
    db.close();
    return result || null;
  } catch { return null; }
}

// ── Shared notification logic (used by BOTH paths) ────────────────────────────
async function handleIncomingPush(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'Graduate Fashion';
  const body  = notification.body  || data.body  || 'You have a new notification.';

  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const hasFocused = clientList.some((c) => c.visibilityState === 'visible');

  // Show OS notification only when no tab is visible
  if (!hasFocused) {
    await self.registration.showNotification(title, {
      body,
      icon:  '/favicon.ico',
      badge: '/favicon.ico',
      tag:   data.order_id   ? `order-${data.order_id}`
           : data.report_id  ? `report-${data.report_id}`
           : data.message_id ? `message-${data.message_id}`
           : 'gf-admin',
      data,
    });
  }

  // Always update bell badge via postMessage; toast only when tab is visible
  clientList.forEach((client) => {
    client.postMessage({
      type:  'GF_PUSH_NOTIFICATION',
      title,
      body,
      data,
      showToast: hasFocused,
    });
  });
}

// ── Firebase init ─────────────────────────────────────────────────────────────
let firebaseInitialized = false;

function initFirebase(config) {
  if (firebaseInitialized) return true;
  if (!config || !config.apiKey) return false;
  try {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    // PATH A: Firebase is ready — handle pushes here.
    // This suppresses Firebase's auto-display AND routes through our shared logic.
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] PATH A: onBackgroundMessage');
      return handleIncomingPush(payload);
    });

    firebaseInitialized = true;
    console.log('[SW] Firebase initialized.');
    return true;
  } catch (err) {
    console.error('[SW] Firebase init failed:', err);
    return false;
  }
}

// ── Receive config from main thread ──────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG' && event.data?.config) {
    initFirebase(event.data.config);
    saveConfigToIDB(event.data.config);
  }
});

// Start loading config immediately on SW start
if (!firebaseInitialized) {
  loadConfigFromIDB().then((config) => {
    if (config) initFirebase(config);
  }).catch(() => {});
}

// ── PATH B: Raw push fallback (only when Firebase hasn't initialized) ─────────
self.addEventListener('push', (event) => {
  if (firebaseInitialized) return; // PATH A handles it — skip to avoid duplicates

  console.log('[SW] PATH B: raw push fallback (Firebase not initialized)');
  const handlePush = async () => {
    let payload;
    try { payload = event.data?.json(); } catch { return; }
    await handleIncomingPush(payload);
  };

  event.waitUntil(handlePush());
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTargetPath(data) {
  if (data && data.order_id)   return '/all-orders?orderId='   + data.order_id;
  if (data && data.report_id)  return '/support-reports?reportId=' + data.report_id;
  if (data && data.message_id) return '/contact-page?messageId='   + data.message_id;
  return '/dashboard';
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data       = event.notification.data || {};
  const targetPath = buildTargetPath(data);
  const targetUrl  = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const adminClient = clientList.find((c) =>
        c.url.includes('localhost:5173') || c.url.includes('/admin')
      );
      if (adminClient) {
        return adminClient.focus().then((wc) => {
          (wc || adminClient).postMessage({ type: 'GF_NAVIGATE', path: targetPath });
        }).catch(() => clients.openWindow(targetUrl));
      }
      return clients.openWindow(targetUrl);
    })
  );
});
