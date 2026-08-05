import React from "react";
import { cn } from "@/lib/utils";
import { SkeletonRows } from "@/components/ui/feedback/Skeleton";
import EmptyState from "@/components/ui/feedback/EmptyState";

type Column = {
 key: string;
 label?: string;
 align?: "left" | "right" | "center";
 width?: string;
};

type Props = {
 columns: Column[];
 loading?: boolean;
 skeletonRows?: number;
 isEmpty?: boolean;
 emptyTitle?: string;
 emptyMessage?: string;
 className?: string;
 children: React.ReactNode;
};

const TH = ({ col }: { col: Column }) => (
 <th
  className={cn(
   "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-500",
   col.align === "right" && "text-right",
   col.align === "center" && "text-center",
   col.width,
  )}
 >
  {col.label}
 </th>
);

/**
 * Responsive table with built-in skeleton loading and empty state.
 *
 * ```tsx
 * <DataTable columns={cols} loading={isLoading} isEmpty={rows.length === 0}>
 *   {rows.map(r => <tr key={r.id}>...</tr>)}
 * </DataTable>
 * ```
 */
export default function DataTable({
 columns,
 loading,
 skeletonRows = 6,
 isEmpty,
 emptyTitle = "No data",
 emptyMessage,
 className,
 children,
}: Props) {
 return (
  <div className={cn("overflow-x-auto", className)}>
   <table className="w-full border-collapse text-left text-sm">
    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
     <tr>
      {columns.map((col) => (
       <TH key={col.key} col={col} />
      ))}
     </tr>
    </thead>
    <tbody>
     {loading ? (
      <SkeletonRows cols={columns.length} rows={skeletonRows} />
     ) : isEmpty ? (
      <tr>
       <td colSpan={columns.length}>
        <EmptyState title={emptyTitle} message={emptyMessage} />
       </td>
      </tr>
     ) : (
      children
     )}
    </tbody>
   </table>
  </div>
 );
}
