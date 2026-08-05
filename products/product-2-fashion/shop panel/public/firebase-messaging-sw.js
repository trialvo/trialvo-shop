/**
 * public/firebase-messaging-sw.js  — V2-056
 * Firebase background push service worker for Graduate Fashion Shop.
 *
 * DUAL-PATH STRATEGY (prevents duplicate notifications):
 *   PATH A: Firebase IS initialized → onBackgroundMessage handles it
 *   PATH B: Firebase NOT initialized (SW was killed/restarted) → raw 'push' fallback
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Deep-link helpers ─────────────────────────────────────────────────────────
function getDeepLinkTarget(data) {
  if (data.order_id)   return `/account/my-order/${data.order_id}`;
  if (data.report_id)  return `/account/my-reports?reportId=${data.report_id}`;
  if (data.message_id) return `/account/my-contact?messageId=${data.message_id}`;
  return '/account';
}

function getNotificationTag(data) {
  if (data.order_id)   return `order-${data.order_id}`;
  if (data.report_id)  return `report-${data.report_id}`;
  if (data.message_id) return `msg-${data.message_id}`;
  return 'gf-shop';
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
const IDB_NAME = 'gf_shop_sw_config';
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

// ── Shared notification logic ─────────────────────────────────────────────────
async function handleIncomingPush(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'Graduate Fashion';
  const body  = notification.body  || data.body  || 'You have a new notification.';

  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const hasFocused = clientList.some((c) => c.visibilityState === 'visible');

  if (!hasFocused) {
    await self.registration.showNotification(title, {
      body,
      icon:  '/favicon.ico',
      badge: '/favicon.ico',
      tag:   getNotificationTag(data),
      data,
    });
  }

  clientList.forEach((client) => {
    client.postMessage({ type: 'GF_PUSH_NOTIFICATION', title, body, data, showToast: hasFocused });
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

    // PATH A: Firebase is ready — handle pushes via onBackgroundMessage.
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG' && event.data?.config) {
    initFirebase(event.data.config);
    saveConfigToIDB(event.data.config);
  }
});

if (!firebaseInitialized) {
  loadConfigFromIDB().then((config) => {
    if (config) initFirebase(config);
  }).catch(() => {});
}

// ── PATH B: Raw push fallback ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (firebaseInitialized) return;

  console.log('[SW] PATH B: raw push fallback');
  event.waitUntil((async () => {
    let payload;
    try { payload = event.data?.json(); } catch { return; }
    await handleIncomingPush(payload);
  })());
});

// ── notificationclick ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data   = event.notification.data || {};
  const target = getDeepLinkTarget(data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((c) => c.postMessage({ type: 'GF_NOTIFICATION_CLICKED', data }));
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((fc) => fc.navigate(target));
        }
      }
      return clients.openWindow(target);
    })
  );
});
