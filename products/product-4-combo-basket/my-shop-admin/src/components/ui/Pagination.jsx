import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination — universal pagination bar.
 *
 * Usage:
 *   <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />
 */
export default function Pagination({
  page,
  pages,
  total,
  onChange,
  label = "টি",
}) {
  if (!pages || pages <= 1) return null;

  // Build visible page numbers (max 7 slots)
  const buildPages = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const items = [];
    if (page <= 4) {
      items.push(1, 2, 3, 4, 5, "...", pages);
    } else if (page >= pages - 3) {
      items.push(1, "...", pages - 4, pages - 3, pages - 2, pages - 1, pages);
    } else {
      items.push(1, "...", page - 1, page, page + 1, "...", pages);
    }
    return items;
  };

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
      <p className="text-xs text-slate-400">
        পেজ <span className="font-semibold text-slate-600">{page}</span> /{" "}
        {pages}
        {total !== undefined && (
          <>
            {" "}
            — মোট <span className="font-semibold text-slate-600">
              {total}
            </span>{" "}
            {label}
          </>
        )}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#e91e63] hover:text-[#e91e63] disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> আগে
        </button>

        {buildPages().map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`h-8 min-w-[32px] rounded-xl px-2 text-xs font-semibold transition-all ${
                page === p
                  ? "bg-[#e91e63] text-white shadow-md"
                  : "border border-slate-200 text-slate-600 hover:border-[#e91e63] hover:text-[#e91e63]"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#e91e63] hover:text-[#e91e63] disabled:opacity-30"
        >
          পরে <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
