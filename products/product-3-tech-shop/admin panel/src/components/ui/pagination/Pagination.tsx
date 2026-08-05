import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

type Props = {
 total: number;
 limit: number;
 offset: number;
 onPageChange: (offset: number) => void;
 className?: string;
};

function buildPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
 if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
 const pages: (number | "...")[] = [];
 pages.push(1);
 if (currentPage > 4) pages.push("...");
 for (
  let i = Math.max(2, currentPage - 2);
  i <= Math.min(totalPages - 1, currentPage + 2);
  i++
 ) {
  pages.push(i);
 }
 if (currentPage < totalPages - 3) pages.push("...");
 pages.push(totalPages);
 return pages;
}

const btnBase =
 "inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition";
const btnActive = "border-brand-500 bg-brand-500 text-white shadow-sm";
const btnNormal =
 "border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400";
const btnDisabled =
 "cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-700";

/**
 * Smart paginator with ellipsis page numbers.
 *
 * ```tsx
 * <Pagination total={total} limit={limit} offset={offset} onPageChange={setOffset} />
 * ```
 */
export default function Pagination({ total, limit, offset, onPageChange, className }: Props) {
 const totalPages = Math.max(1, Math.ceil(total / limit));
 const currentPage = Math.floor(offset / limit) + 1;
 const pageFrom = total === 0 ? 0 : offset + 1;
 const pageTo = Math.min(offset + limit, total);

 const pages = useMemo(
  () => buildPageNumbers(currentPage, totalPages),
  [currentPage, totalPages],
 );

 if (totalPages <= 1 && total === 0) return null;

 return (
  <div
   className={cn(
    "flex flex-col items-center justify-between gap-2 sm:flex-row",
    className,
   )}
  >
   <p className="text-xs text-gray-500 dark:text-gray-400">
    {total === 0 ? (
     "No results"
    ) : (
     <>
      Showing{" "}
      <span className="font-semibold text-gray-700 dark:text-gray-200">
       {pageFrom}–{pageTo}
      </span>{" "}
      of{" "}
      <span className="font-semibold text-gray-700 dark:text-gray-200">{total}</span>
     </>
    )}
   </p>

   {totalPages > 1 && (
    <div className="flex items-center gap-1">
     <button
      type="button"
      disabled={currentPage === 1}
      onClick={() => onPageChange(Math.max(0, offset - limit))}
      className={cn(btnBase, currentPage === 1 ? btnDisabled : btnNormal)}
      aria-label="Previous"
     >
      <ChevronLeft size={14} />
     </button>

     {pages.map((p, i) =>
      p === "..." ? (
       <span
        key={`dots-${i}`}
        className="flex h-7 w-7 items-center justify-center text-xs text-gray-400 dark:text-gray-600"
       >
        …
       </span>
      ) : (
       <button
        key={p}
        type="button"
        onClick={() => onPageChange((p - 1) * limit)}
        className={cn(btnBase, p === currentPage ? btnActive : btnNormal)}
       >
        {p}
       </button>
      ),
     )}

     <button
      type="button"
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(offset + limit)}
      className={cn(btnBase, currentPage === totalPages ? btnDisabled : btnNormal)}
      aria-label="Next"
     >
      <ChevronRight size={14} />
     </button>
    </div>
   )}
  </div>
 );
}
