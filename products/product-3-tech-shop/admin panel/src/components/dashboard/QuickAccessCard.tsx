import * as React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type QuickAccessCardProps = {
  title: string;
  imgUrl?: string;
  path?: string | null;
  id?: number;
};

/**
 * Medium-deep color palette (balanced & readable)
 * Stable mapping: id % 10
 */
const BG_VARIANTS = [
  // Blue
  "bg-blue-500 text-white dark:bg-blue-800/50 dark:text-blue-100",
  // Emerald
  "bg-emerald-500 text-white dark:bg-emerald-800/50 dark:text-emerald-100",
  // Purple
  "bg-purple-500 text-white dark:bg-purple-800/50 dark:text-purple-100",
  // Amber
  "bg-amber-500 text-white dark:bg-amber-800/50 dark:text-amber-100",
  // Pink
  "bg-pink-500 text-white dark:bg-pink-800/50 dark:text-pink-100",
  // Indigo
  "bg-indigo-500 text-white dark:bg-indigo-800/50 dark:text-indigo-100",
  // Teal
  "bg-teal-500 text-white dark:bg-teal-800/50 dark:text-teal-100",
  // Rose
  "bg-rose-500 text-white dark:bg-rose-800/50 dark:text-rose-100",
  // Cyan
  "bg-cyan-500 text-white dark:bg-cyan-800/50 dark:text-cyan-100",
  // Lime
  "bg-lime-500 text-white dark:bg-lime-800/50 dark:text-lime-100",
];

function getBgById(id?: number) {
  if (id === undefined || id === null) return BG_VARIANTS[0];
  return BG_VARIANTS[Math.abs(id) % BG_VARIANTS.length];
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, imgUrl, path, id }) => {
  const navigate = useNavigate();
  const clickable = Boolean(path);
  const bgClass = getBgById(id);

  return (
    <button
      type="button"
      onClick={() => path && navigate(path)}
      disabled={!clickable}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition",
        "shadow-theme-xs hover:shadow-theme-md",
        "border-black/5 dark:border-white/10",
        clickable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
        "min-h-[92px] sm:min-h-[104px]",
        bgClass
      )}
      aria-label={clickable ? `Open ${title}` : `${title} (no link)`}
    >
      {/* Icon container */}
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg")}>
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={title}
            loading="lazy"
            className={cn(
              "h-full w-full object-contain transition",
              // ✅ Always white icon
              "brightness-0 invert"
            )}
          />
        ) : (
          <span className="text-xs font-bold">{title.slice(0, 2).toUpperCase()}</span>
        )}
      </div>

      <span className="line-clamp-1 text-xs font-semibold sm:text-sm">{title}</span>
    </button>
  );
};

export default QuickAccessCard;
