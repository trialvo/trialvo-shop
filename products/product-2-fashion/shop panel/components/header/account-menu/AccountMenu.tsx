"use client";

import Link from "next/link";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

import { FiUser } from "react-icons/fi";
import { ACCOUNT_MENU_KEYS, type AccountMenuItem } from "./accountMenu.data";

type Props = {
  userName?: string | null;
  avatarSrc?: string | null;
  onLogout: () => void | Promise<void>;
  className?: string;
  contentClassName?: string;
  firstName?: string;
};

function safeName(name?: string | null): string | null {
  const n = (name ?? "").trim();
  return n.length ? n : null;
}

function initialsFromName(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + second).toUpperCase();
}

const AccountMenu: React.FC<Props> = ({
  userName,
  avatarSrc,
  onLogout,
  className,
  contentClassName,
  firstName,
}) => {
  const { t } = useTranslation();
  const displayName = safeName(userName);
  const displayFirstName = safeName(firstName);
  const hasAvatar = Boolean((avatarSrc ?? "").trim());
  const hasName = Boolean(displayName);
  const showAvatar = hasAvatar || hasName;

  // Build menu items dynamically with translations
  const menuItems: AccountMenuItem[] = React.useMemo(() => ACCOUNT_MENU_KEYS.map((item) => ({
    ...item,
    label:
      item.key === "account"    ? t("accountMenu.myAccount")
    : item.key === "orders"     ? t("accountMenu.myOrder")
    : item.key === "address"    ? t("accountMenu.addressDelivery")
    : item.key === "my-reports" ? t("account.sidebar.myReports") // V2-036
    : t("accountMenu.logout"),
  })), [t]);

  const handleSelect = React.useCallback(
    async (item: AccountMenuItem) => {
      if (item.key === "logout") {
        await onLogout();
      }
    },
    [onLogout],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-auto rounded-none px-0 py-1 border-b border-transparent transition-colors hover:border-black shadow-none hover:bg-transparent",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            {showAvatar ? (
              <Avatar className="h-8 w-8 rounded-full border border-[#F1f1f1]">
                {hasAvatar ? <AvatarImage src={avatarSrc!} alt={displayName ?? t("common.account")} /> : null}
                <AvatarFallback className="rounded-none bg-black/5 text-xs font-semibold text-black">
                  {hasName ? initialsFromName(displayFirstName ?? displayName) : "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <FiUser className="h-6 w-6 text-black" />
            )}

            <span className="relative inline-flex flex-col">
              <span className="text-sm font-semibold leading-none text-black">
                {displayFirstName ?? t("common.account")}
              </span>
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          "w-59.25 max-w-[calc(100vw-24px)] rounded-none border-0 py-3 px-0",
          "shadow-[0px_0px_12px_rgba(0,0,0,0.12)]",
          contentClassName,
        )}
      >
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3">
            {showAvatar ? (
              <Avatar className="h-10 w-10 rounded-full border border-[#f1f1f1]">
                {hasAvatar ? <AvatarImage src={avatarSrc!} alt={displayName ?? t("common.account")} /> : null}
                <AvatarFallback className="rounded-none bg-black/5 text-sm font-semibold text-black">
                  {hasName ? initialsFromName(displayName!) : "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-none border border-[#EAEAEA] bg-black/5">
                <FiUser className="h-6 w-6 text-black" />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-sm font-semibold text-black line-clamp-1">
                {displayName ?? t("common.account")}
              </div>
              <div className="text-xs text-black/60">{t("accountMenu.myAccount")}</div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-[#EAEAEA]" />

        {menuItems.map((item, idx) => {
          const Icon = item.icon;

          const row = (
            <DropdownMenuItem
              key={item.key}
              onSelect={async (e) => {
                if (item.key === "logout") {
                  e.preventDefault();
                  await handleSelect(item);
                }
              }}
              className={cn(
                "cursor-pointer rounded-none p-2 w-full",
                "flex items-center gap-2.5",
                "text-sm font-normal text-black transition-all hover:bg-accent",
                "focus:bg-black/5",
                idx !== menuItems.length - 1 && "border-b border-[#EAEAEA]",
                item.destructive && "text-black",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-black" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );

          if (item.href) {
            return (
              <DropdownMenuItem
                key={item.key}
                asChild
                className="p-0 focus:bg-transparent"
              >
                <Link href={item.href} className="block w-full">
                  {row}
                </Link>
              </DropdownMenuItem>
            );
          }

          return row;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
