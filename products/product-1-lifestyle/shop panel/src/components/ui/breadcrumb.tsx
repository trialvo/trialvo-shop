"use client";

import type { ComponentProps, Ref } from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

function Breadcrumb({
  ref,
  ...props
}: ComponentProps<"nav"> & { separator?: React.ReactNode; ref?: Ref<HTMLElement> }) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ref, ...props }: ComponentProps<"ol"> & { ref?: Ref<HTMLOListElement> }) {
  return (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ref, ...props }: ComponentProps<"li"> & { ref?: Ref<HTMLLIElement> }) {
  return <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

function BreadcrumbLink({
  asChild,
  className,
  ref,
  ...props
}: ComponentProps<"a"> & { asChild?: boolean; ref?: Ref<HTMLAnchorElement> }) {
  const Comp = asChild ? Slot : "a";
  return <Comp ref={ref} className={cn("transition-colors hover:text-foreground", className)} {...props} />;
}

function BreadcrumbPage({ className, ref, ...props }: ComponentProps<"span"> & { ref?: Ref<HTMLSpanElement> }) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
