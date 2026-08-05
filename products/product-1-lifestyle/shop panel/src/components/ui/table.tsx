"use client";

import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/utils";

function Table({ className, ref, ...props }: HTMLAttributes<HTMLTableElement> & { ref?: Ref<HTMLTableElement> }) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  );
}

function TableRow({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { ref?: Ref<HTMLTableRowElement> }) {
  return (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  );
}

function TableHead({
  className,
  ref,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { ref?: Ref<HTMLTableCellElement> }) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  ref,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { ref?: Ref<HTMLTableCellElement> }) {
  return (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  );
}

function TableCaption({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement> & { ref?: Ref<HTMLTableCaptionElement> }) {
  return <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
