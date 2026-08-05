"use client";

/**
 * components/header/NotificationBell.tsx  — V2-035
 *
 * Bell icon with unread badge + dropdown notification center.
 * Only shown when the user is authenticated.
 */

import { useEffect, useRef, useState } from "react";
import { Bell, Package, X, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useNotificationStore } from "@/hooks/useNotificationStore";

const STATUS_EMOJI: Record<string, string> = {
  approved:         "✅",
  shipped:          "📦",
  out_for_delivery: "🚚",
  delivered:        "🎉",
  cancelled:        "❌",
  returned:         "↩️",
  on_hold:          "⏸️",
};

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { items, unreadCount, markAllRead, markRead, clearAll } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Mark all read when dropdown opens
  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 400); // slight delay so badge animates out
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      {/* ── Bell button ─────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={handleOpen}
        style={{ position: "relative", cursor: "pointer", background: "none", border: "none", padding: 0, display: "flex" }}
      >
        <Bell
          size={22}
          style={{ color: open ? "#111827" : "#6A6678", transition: "color .15s" }}
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
              boxShadow: "0 0 0 2px white",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: -8,
            width: 340,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.13)",
            zIndex: 9999,
            overflow: "hidden",
            animation: "notifSlideIn .2s ease",
          }}
        >
          <style>{`
            @keyframes notifSlideIn {
              from { opacity:0; transform:translateY(-8px); }
              to   { opacity:1; transform:translateY(0); }
            }
          `}</style>

          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
              Notifications
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {items.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {items.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "36px 16px",
                  color: "#9ca3af",
                  gap: 10,
                }}
              >
                <Bell size={32} strokeWidth={1.2} style={{ color: "#d1d5db" }} />
                <span style={{ fontSize: 13 }}>No notifications yet</span>
              </div>
            ) : (
              items.map((n) => {
                const emoji = n.status ? STATUS_EMOJI[n.status] : undefined;
                const href  = n.order_id
                  ? `/account/my-order/${n.order_id}`
                  : n.report_id
                  ? `/account/my-reports?reportId=${n.report_id}`
                  : n.message_id
                  ? `/account/my-contact?messageId=${n.message_id}`
                  : "/account";

                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "12px 16px",
                      borderBottom: "1px solid #f9fafb",
                      background: n.read ? "white" : "#f0fdf4",
                      textDecoration: "none",
                      transition: "background .15s",
                      cursor: "pointer",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: n.read ? "#f3f4f6" : "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      {emoji ?? <Package size={14} style={{ color: "#16a34a" }} />}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: n.read ? 500 : 700,
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {n.title}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "#6b7280",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.body}
                      </p>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "block" }}>
                        {timeAgo(n.receivedAt)}
                      </span>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#16a34a",
                          marginTop: 4,
                        }}
                      />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid #f3f4f6",
                textAlign: "center",
              }}
            >
              <Link
                href="/account/my-order"
                onClick={() => setOpen(false)}
                style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
              >
                View all orders →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
