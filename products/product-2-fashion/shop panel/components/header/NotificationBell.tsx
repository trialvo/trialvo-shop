"use client";

/**
 * Header bell — opens the notifications drawer (all breakpoints).
 */

import { useNotificationStore } from "@/hooks/useNotificationStore";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { Bell } from "lucide-react";
import * as React from "react";

type Props = {
  className?: string;
};

export default function NotificationBell({ className }: Props) {
  const dispatch = useAppDispatch();
  const { unreadCount } = useNotificationStore();
  const stack = useAppSelector((s) => s.drawerManager.stack);
  const isOpen = stack.some((d) => d.key === "notifications");

  const handleOpen = () => {
    dispatch(openDrawer({ key: "notifications" }));
  };

  return (
    <button
      type="button"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      aria-expanded={isOpen}
      onClick={handleOpen}
      className={cn(
        "relative grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors duration-200",
        "text-[#6A6678] hover:bg-black/[0.06] hover:text-[#191919]",
        "min-[992px]:h-10 min-[992px]:w-10",
        isOpen && "bg-black/[0.06] text-[#191919]",
        className,
      )}
    >
      <Bell
        className="h-5 w-5 min-[992px]:h-[22px] min-[992px]:w-[22px]"
        strokeWidth={1.75}
      />
      {unreadCount > 0 ? (
        <span
          className={cn(
            "absolute top-0.5 right-0.5 grid min-w-[16px] place-items-center rounded-full",
            "bg-[#ef4444] px-1 text-[10px] font-bold leading-none text-white",
            "h-4 shadow-[0_0_0_2px_white]",
          )}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
