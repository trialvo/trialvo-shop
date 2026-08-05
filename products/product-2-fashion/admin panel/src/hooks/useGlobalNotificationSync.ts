/**
 * src/hooks/useGlobalNotificationSync.ts  — V2-036
 *
 * Mounted once in AppLayout.  Watches the admin push notification store for
 * newly delivered notifications and triggers targeted React Query cache
 * invalidations so every admin page auto-refreshes without polling.
 *
 * Why here and not in PushNotificationProvider?
 *   PushNotificationProvider only handles the TAB that received the FCM push.
 *   Other open tabs receive the notification via the 'storage' event and update
 *   their bell badge, but do NOT invalidate queries.  This hook runs in the
 *   layout of every admin page, so ALL tabs auto-refetch the moment the
 *   notification store changes (regardless of how it changed).
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminNotificationStore } from "./useAdminNotificationStore";

// ── Query key roots — must match the keys used in useReports.ts and
//    useContactDistribution.ts / useContactMessages.ts ─────────────────────────
const REPORT_ROOTS  = ["reports", "report-dist-agents", "report-dist-eligible", "report-assignment-logs"];
const CONTACT_ROOTS = ["contact-messages", "contact-dist-eligible", "contact-assignment-logs"];
const ORDER_ROOTS   = ["orders"];

// Maximum age of a notification that will trigger a cache invalidation (ms).
// Prevents stale notifications loaded from localStorage on mount from firing.
const MAX_AGE_MS = 15_000;

export function useGlobalNotificationSync() {
  const qc        = useQueryClient();
  const { items } = useAdminNotificationStore();

  // Track the timestamp of the last notification we processed so we never
  // re-process the same item on re-renders.
  const lastProcessedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (items.length === 0) return;

    const now    = Date.now();
    const cutoff = lastProcessedAtRef.current;

    // Only process notifications that arrived AFTER the last render
    const fresh = items.filter(
      (n) => n.receivedAt > cutoff && now - n.receivedAt < MAX_AGE_MS
    );

    if (fresh.length === 0) return;

    // Advance the cursor to the newest item we just processed
    const newest = Math.max(...fresh.map((n) => n.receivedAt));
    lastProcessedAtRef.current = newest;

    // Determine which caches to invalidate based on event_type / type
    const invalidateReports  = fresh.some(
      (n) =>
        n.event_type?.includes("report") ||
        n.type?.includes("report") ||
        String(n.report_id).length > 0
    );
    const invalidateContacts = fresh.some(
      (n) =>
        n.event_type?.includes("contact") ||
        n.type?.includes("contact") ||
        String(n.message_id).length > 0
    );
    const invalidateOrders   = fresh.some(
      (n) =>
        n.event_type?.includes("order") ||
        n.type?.includes("order") ||
        String(n.order_id).length > 0
    );

    if (invalidateReports) {
      REPORT_ROOTS.forEach((key) =>
        qc.invalidateQueries({ queryKey: [key], exact: false })
      );
      console.debug("[GlobalSync] Report queries invalidated");
    }
    if (invalidateContacts) {
      CONTACT_ROOTS.forEach((key) =>
        qc.invalidateQueries({ queryKey: [key], exact: false })
      );
      console.debug("[GlobalSync] Contact queries invalidated");
    }
    if (invalidateOrders) {
      ORDER_ROOTS.forEach((key) =>
        qc.invalidateQueries({ queryKey: [key], exact: false })
      );
      console.debug("[GlobalSync] Order queries invalidated");
    }
  }, [items, qc]);
}
