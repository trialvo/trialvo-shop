"use client";

/**
 * hooks/useNotificationStore.ts  — V2-035
 *
 * Lightweight client-side notification store backed by localStorage.
 * Shared across the app via a module-level singleton so any component
 * that imports this hook sees the same state without a context provider.
 */

import { useCallback, useEffect, useState } from "react";

export interface ShopNotification {
  id: string;         // unique id (timestamp + random)
  title: string;
  body: string;
  order_id?: string;  // from FCM data payload
  report_id?: string; // V2-036: from report_reply / contact_reply push
  message_id?: string; // V2-036: from contact_reply push
  status?: string;    // new_status from FCM data payload
  type?: string;      // V2-036: notification type
  read: boolean;
  receivedAt: number; // ms timestamp
}

const STORAGE_KEY = "gf_shop_notifications";
const MAX_STORED   = 20; // keep last N notifications

// ── Module-level singleton ─────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function readStore(): ShopNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShopNotification[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: ShopNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
  } catch { /* storage full – ignore */ }
  listeners.forEach((fn) => fn());
}

/** Push a new notification into the store. Returns true if stored, false if duplicate. */
export function pushNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): boolean {
  // ── Deduplication guard ───────────────────────────────────────────────────
  // Both the FCM foreground handler and the SW background handler can fire for
  // the same push in some browser/SDK combinations.  Skip if a notification
  // with the same entity-id + type/status was already stored within 5 seconds.
  //   order push  → order_id + new_status
  //   report push → report_id + type
  //   contact push → message_id + type
  const now   = Date.now();
  const store = readStore();
  const entityId  = data?.order_id || data?.report_id || data?.message_id;
  const eventKey  = data?.new_status || data?.type;
  const isDuplicate = store.some(
    (n) => {
      const storedEntityId = n.order_id || n.report_id || n.message_id;
      const storedEventKey = n.status || n.type;
      return (
        storedEntityId === entityId &&
        storedEventKey === eventKey &&
        entityId !== undefined &&
        now - n.receivedAt < 5_000
      );
    }
  );
  if (isDuplicate) {
    console.debug('[NotifStore] Duplicate push suppressed', entityId, eventKey);
    return false;
  }
  // ────────────────────────────────────────────────────────────────────────

  const next: ShopNotification = {
    id:         `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    order_id:   data?.order_id,
    report_id:  data?.report_id,
    message_id: data?.message_id,
    status:     data?.new_status,
    type:       data?.type,
    read:       false,
    receivedAt: now,
  };
  writeStore([next, ...store]);
  return true;
}

/** Clear all stored notifications. */
export function clearNotifications(): void {
  writeStore([]);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useNotificationStore() {
  const [items, setItems] = useState<ShopNotification[]>([]);

  const refresh = useCallback(() => setItems([...readStore()]), []);

  useEffect(() => {
    // Hydrate on mount
    refresh();
    // Subscribe to cross-component updates (same-tab writes)
    listeners.add(refresh);

    // Cross-tab sync: when another tab writes to localStorage, the 'storage'
    // event fires in every OTHER open tab.  This keeps the bell badge in sync
    // across all open shop windows without any server round-trip.
    function handleStorageEvent(e: StorageEvent) {
      if (e.key === STORAGE_KEY) refresh();
    }
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      listeners.delete(refresh);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [refresh]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    const updated = readStore().map((n) => ({ ...n, read: true }));
    writeStore(updated);
  }, []);

  const markRead = useCallback((id: string) => {
    const updated = readStore().map((n) => n.id === id ? { ...n, read: true } : n);
    writeStore(updated);
  }, []);

  const clearAll = useCallback(() => clearNotifications(), []);

  return { items, unreadCount, markAllRead, markRead, clearAll };
}
