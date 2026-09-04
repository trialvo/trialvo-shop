"use client";

import DrawerShell from "@/components/drawers/DrawerShell";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useNotificationStore,
  type ShopNotification,
} from "@/hooks/useNotificationStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";
import { Bell, CheckCheck, Package, Trash2, X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
};

const STATUS_EMOJI: Record<string, string> = {
  approved: "✅",
  shipped: "📦",
  out_for_delivery: "🚚",
  delivered: "🎉",
  cancelled: "❌",
  returned: "↩️",
  on_hold: "⏸️",
};

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function notificationHref(n: ShopNotification): string {
  if (n.order_id) return `/account/my-order/${n.order_id}`;
  if (n.report_id) return `/account/my-reports?reportId=${n.report_id}`;
  if (n.message_id) return `/account/my-contact?messageId=${n.message_id}`;
  return "/account";
}

const NotificationDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop = true,
  zIndex = 1000,
}) => {
  const { t } = useTranslation();
  const { items, unreadCount, markAllRead, markRead, clearAll } =
    useNotificationStore();

  // Mark unread as read shortly after open so the badge can animate out
  React.useEffect(() => {
    if (!open || unreadCount <= 0) return;
    const timer = window.setTimeout(() => markAllRead(), 450);
    return () => window.clearTimeout(timer);
  }, [open, unreadCount, markAllRead]);

  const close = () => onOpenChange(false);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      a11yTitle={t("notifications.title")}
      isTop={isTop}
      zIndex={zIndex}
      side="right"
      contentClassName={cn(
        // Mobile: full-bleed edge-to-edge; tablet+: fixed panel width
        "h-[100dvh] max-h-[100dvh]",
        "w-[100dvw] max-w-[100dvw] border-x-0",
        "min-[480px]:w-[min(100dvw,400px)] min-[480px]:max-w-[400px] min-[480px]:border-l min-[480px]:border-x-0",
        "min-[768px]:w-[420px] min-[768px]:max-w-[420px]",
        "min-[1200px]:w-[440px] min-[1200px]:max-w-[440px]",
      )}
    >
      <div className="flex h-full min-h-0 flex-col bg-white">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/8 px-4 py-3.5 min-[480px]:px-5 min-[768px]:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-[#191919] min-[768px]:text-base">
              {t("notifications.title")}
            </h2>
            {items.length > 0 ? (
              <p className="mt-0.5 text-[11px] text-[#8A8A8A] min-[768px]:text-xs">
                {unreadCount > 0
                  ? t("notifications.unreadCount").replace(
                      "{{count}}",
                      String(unreadCount),
                    )
                  : t("notifications.allCaughtUp")}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {items.length > 0 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={markAllRead}
                  aria-label={t("notifications.markAllRead")}
                  title={t("notifications.markAllRead")}
                  className="h-9 w-9 rounded-full p-0 text-[#6A6678] hover:bg-black/[0.05] hover:text-[#191919]"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearAll}
                  aria-label={t("notifications.clearAll")}
                  title={t("notifications.clearAll")}
                  className="h-9 w-9 rounded-full p-0 text-[#6A6678] hover:bg-black/[0.05] hover:text-[#191919]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              onClick={close}
              aria-label={t("common.close")}
              className="h-9 w-9 rounded-full p-0 text-[#6A6678] hover:bg-black/[0.05] hover:text-[#191919]"
            >
              <X className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center min-[768px]:py-20">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F7F5F2]">
                  <Bell className="h-6 w-6 text-[#C4C0B8]" strokeWidth={1.4} />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#191919]">
                  {t("notifications.emptyTitle")}
                </p>
                <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-[#8A8A8A]">
                  {t("notifications.emptyDescription")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {items.map((n) => {
                  const emoji = n.status ? STATUS_EMOJI[n.status] : undefined;
                  const href = notificationHref(n);

                  return (
                    <li key={n.id}>
                      <Link
                        href={href}
                        onClick={() => {
                          markRead(n.id);
                          close();
                        }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3.5 transition-colors min-[480px]:px-5 min-[768px]:px-6 min-[768px]:py-4",
                          "hover:bg-[#FAF8F5] active:bg-[#F3F1ED]",
                          !n.read && "bg-[#F4FBF6]",
                        )}
                      >
                        <div
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-base min-[768px]:h-11 min-[768px]:w-11",
                            n.read ? "bg-[#F3F1ED]" : "bg-[#DCFCE7]",
                          )}
                        >
                          {emoji ?? (
                            <Package className="h-4 w-4 text-[#16a34a]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px] text-[#191919] min-[768px]:text-sm",
                              n.read ? "font-medium" : "font-semibold",
                            )}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-[#6A6678] min-[768px]:text-[13px]">
                            {n.body}
                          </p>
                          <span className="mt-1.5 block text-[11px] text-[#9CA3AF]">
                            {timeAgo(n.receivedAt)}
                          </span>
                        </div>

                        {!n.read ? (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#16a34a]"
                            aria-hidden
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        {items.length > 0 ? (
          <div className="shrink-0 border-t border-black/8 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[480px]:px-5 min-[768px]:px-6">
            <Link
              href="/account/orders"
              onClick={close}
              className="flex h-11 w-full items-center justify-center rounded-[4px] bg-[#191919] text-[13px] font-semibold text-white transition-colors hover:bg-black"
            >
              {t("notifications.viewOrders")}
            </Link>
          </div>
        ) : null}
      </div>
    </DrawerShell>
  );
};

export default NotificationDrawer;
