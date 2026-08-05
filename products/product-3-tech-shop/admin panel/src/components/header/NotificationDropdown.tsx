// src/components/header/NotificationDropdown.tsx
"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, FileText, MessageSquareText, Package, Trash2, X } from "lucide-react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { cn } from "@/lib/utils";
import { useContactMessageCounts, useContactMessages, useMarkAllContactMessagesRead } from "../website-settings/contact-messages/useContactMessages";
import { formatDateTime, formatName } from "../website-settings/contact-messages/utils";
import { useAdminNotificationStore, markAllAdminNotificationsRead, clearAdminNotifications } from "@/hooks/useAdminNotificationStore";


export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);

  const countsQuery = useContactMessageCounts({ refetchIntervalMs: 30_000 });
  const contactUnread = countsQuery.data?.data?.unread ?? 0;

  const { items: pushItems, unreadCount: pushUnread } = useAdminNotificationStore();
  const recentPush = pushItems.slice(0, 4); // show latest 4 push notifications

  const unreadCount = contactUnread + pushUnread;

  function handleOpen() {
    setIsOpen((v) => !v);
    // Mark push notifications as read when dropdown opens
    if (!isOpen && pushUnread > 0) markAllAdminNotificationsRead();
  }

  const markAllReadMutation = useMarkAllContactMessagesRead();

  const unreadListQuery = useContactMessages(
    {
      status: "active",
      offset: 0,
      limit: 6,
      subject: "",
      search: "",
      is_read: "false",
      is_replied: "all",
      assigned_to_me: true, // bell only shows messages assigned to the current admin
    },
    { enabled: isOpen, refetchIntervalMs: 5_000 }
  );

  const items = unreadListQuery.data?.data ?? [];

  const hasAnyNotifications = pushItems.length > 0 || items.length > 0 || contactUnread > 0;

  function handleClearAll() {
    // Clear push notifications from localStorage
    clearAdminNotifications();
    // Mark all contact messages as read on the server
    markAllReadMutation.mutate();
  }

  function toggleDropdown() {
    handleOpen();
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors",
          "hover:bg-white hover:text-gray-700",
          "dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
        )}
        onClick={toggleDropdown}
        aria-label="Open notifications"
      >
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0.5 z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        <Bell className="h-5 w-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className={cn(
          "absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col",
          "rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg",
          "dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
        )}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread contact message(s)` : "No unread messages"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {hasAnyNotifications && (
              <>
                <button
                  onClick={() => { markAllAdminNotificationsRead(); markAllReadMutation.mutate(); }}
                  title="Mark all read"
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  aria-label="Mark all notifications read"
                >
                  <CheckCheck size={16} />
                </button>
                <button
                  onClick={handleClearAll}
                  title="Clear all"
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label="Clear all notifications"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              onClick={toggleDropdown}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Push notification events */}
          {recentPush.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Recent Alerts</p>
              <ul className="flex flex-col mb-2">
              {recentPush.map((n) => {
                // Resolve the link target and icon per notification type
                const isReport  = !!n.report_id  || n.type?.includes("report")  || n.event_type?.includes("report");
                const isContact = !!n.message_id || n.type?.includes("contact") || n.event_type?.includes("contact");
                const linkTo    = isReport  ? `/support-reports${n.report_id  ? `?reportId=${n.report_id}`   : ""}`
                                : isContact ? `/contact-page${n.message_id   ? `?messageId=${n.message_id}` : ""}`
                                : n.order_id ? `/all-orders?orderId=${n.order_id}`
                                : "/all-orders";
                const Icon      = isReport  ? FileText
                                : isContact ? MessageSquareText
                                : Package;
                const iconBg    = isReport  ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                                : isContact ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                                : "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";

                return (
                  <li key={n.id}>
                    <DropdownItem
                      onItemClick={closeDropdown}
                      tag="a"
                      to={linkTo}
                      className={cn(
                        "flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3",
                        "hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5",
                        !n.read && "bg-brand-50 dark:bg-brand-500/5"
                      )}
                    >
                      <span className={cn("relative block h-10 w-10 shrink-0 rounded-full", iconBg)}>
                        <span className="flex h-full w-full items-center justify-center">
                          <Icon size={18} />
                        </span>
                        {!n.read && <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900" />}
                      </span>
                      <span className="block min-w-0">
                        <span className="mb-0.5 block text-theme-sm font-semibold text-gray-800 dark:text-white/90 truncate">{n.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{n.body}</span>
                        <span className="mt-0.5 block text-[10px] text-gray-400">{new Date(n.receivedAt).toLocaleTimeString()}</span>
                      </span>
                    </DropdownItem>
                  </li>
                );
              })}
              </ul>
              <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Contact Messages</p>
            </>
          )}
          {unreadListQuery.isLoading ? (
            <div className="px-3 py-8 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : items.length ? (
            <ul className="flex flex-col">
              {items.map((m) => (
                <li key={m.id}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    tag="a"
                    to={`/contact-page?messageId=${m.id}`}
                    className={cn(
                      "flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3",
                      "hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                    )}
                  >
                    <span className="relative block h-10 w-10 shrink-0 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <span className="flex h-full w-full items-center justify-center">
                        <MessageSquareText size={18} />
                      </span>
                    </span>

                    <span className="block min-w-0">
                      <span className="mb-1 block text-theme-sm text-gray-800 dark:text-white/90">
                        <span className="font-semibold">{formatName(m.first_name, m.last_name)}</span>
                        <span className="text-gray-500 dark:text-gray-400"> — {m.subject || "(No subject)"}</span>
                      </span>

                      <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                        <span className="truncate">{m.email || m.phone || "-"}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span>{formatDateTime(m.created_at)}</span>
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-8 text-sm text-gray-500 dark:text-gray-400">No unread messages.</div>
          )}
        </div>

        <div className="pt-3">
          <Link
            to="/contact-page"
            onClick={closeDropdown}
            className={cn(
              "block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-semibold",
              "text-gray-800 hover:bg-gray-50",
              "dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-white/[0.03]"
            )}
          >
            View all messages
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
