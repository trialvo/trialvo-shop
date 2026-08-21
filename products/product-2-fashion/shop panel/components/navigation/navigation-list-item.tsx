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
  onNavigate,
  ...props
}: NavigationListItemProps): React.JSX.Element {
  return (
    <li {...props} className={cn("list-none", className)}>
      <button
        type="button"
        onClick={() => onNavigate(href)}
        className={cn(
          "group block cursor-pointer p-0! text-left",
          "outline-none focus-visible:ring-2 focus-visible:ring-black/30",
        )}
      >
        <div className="relative h-25.5 w-25.5 overflow-hidden border border-black/10 bg-[#F8F8F8] transition-colors group-hover:border-black/40">
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
              className="object-contain object-center transition-transform duration-200 group-hover:scale-[1.03]"
              preload={false}
            />
          )}
        </div>

        <div className="mt-1.5 text-left text-[11px] font-medium leading-4 text-black line-clamp-1">
          {title}
        </div>
      </button>
    </li>
  );
}
