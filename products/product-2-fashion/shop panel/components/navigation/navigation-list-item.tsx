"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import * as React from "react";

import { cn } from "@/lib/utils";
import { CiImageOff } from "react-icons/ci";

export type NavigationListItemProps = React.ComponentPropsWithoutRef<"li"> & {
  title: string;
  href: string;
  imageSrc?: string;
  total_stock?: number;
  onNavigate: (href: string) => void;
};

export function NavigationListItem({
  title,
  href = "#",
  imageSrc,
  className,
  total_stock,
  onNavigate,
  ...props
}: NavigationListItemProps): React.JSX.Element {
  const stockOut = total_stock === 0;

  const handleClick = (e: React.MouseEvent) => {
    if (stockOut) {
      e.preventDefault();
      return;
    }
    onNavigate(href);
  };

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (stockOut && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [stockOut]);

  return (
    <li {...props} className={cn("list-none", className)}>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group block p-0! text-left",
          "outline-none focus-visible:ring-2 focus-visible:ring-black/30",
          stockOut ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        )}
        aria-disabled={stockOut}
        tabIndex={stockOut ? -1 : 0}
      >
        <div className={cn(
          "relative h-25.5 w-25.5 overflow-hidden border border-[#EDEDED] bg-[#F6F6F6]",
          !stockOut && "hover:border-[#636363] transition-colors"
        )}>
          {!imageSrc ? (
            <div className="flex h-full w-full items-center justify-center">
              <CiImageOff className="h-6 w-6 text-foreground/50" />
            </div>
          ) : (
            <ImageWithFallback
              src={imageSrc}
              alt={title}
              fill
              sizes="110px"
              className={cn(
                "object-contain object-center",
                "transition-transform duration-200",
                !stockOut && "group-hover:scale-[1.03]"
              )}
              preload={false}
            />
          )}
        </div>

        <div className={cn(
          "text-left text-xs font-medium text-black line-clamp-1 leading-4"
        )}>
          {title}
        </div>
      </button>
    </li>
  );
}
