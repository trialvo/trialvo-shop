"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import type { BottomNavItemConfig } from "./bottomNav.types";

type Props = {
  item: BottomNavItemConfig;
  active: boolean;
};

const BottomNavItem: React.FC<Props> = ({ item, active }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const Icon = item.Icon;
  const isAccount = item.key === "account";
  const isOrder = item.key === "orders";
  const href = !isAuthenticated && isOrder ? "/sign-in" : item?.href;


  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-full w-full rounded-none p-2!",
        "hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
      )}
    >
      {isAccount ? (
        <button
          type="button"
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-1.5",
            "select-none",
          )}
          onClick={() => {
            if (isAuthenticated) {
              // dispatch(openDrawer({ key: "accountMenu" }));
              router?.push('/account');
            } else {
              router?.push('/sign-in');
            }
          }}
        >
          <Icon className={cn("h-6! w-6!", active ? "text-black" : "text-[#6E6E6E]")} />

          <span
            className={cn(
              "text-xs leading-none",
              active ? "font-medium text-black" : "font-normal text-[#636363]",
            )}
          >
            {item.label}
          </span>
        </button>
      ) : (
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-1.5",
            "select-none",
          )}
        >
          <Icon className={cn("h-6! w-6!", active ? "text-black" : "text-[#6E6E6E]")} />

          <span
            className={cn(
              "text-xs leading-none",
              active ? "font-medium text-black" : "font-normal text-[#636363]",
            )}
          >
            {item.label}
          </span>
        </Link>
      )}
    </Button>
  );
};

export default BottomNavItem;
