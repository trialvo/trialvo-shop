import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Option = {
  value: string;
  label: string;
  status?: boolean | "active" | "inactive";
};

type MenuPlacement = "auto" | "top" | "bottom";

type SelectProps = {
  options: Option[];
  placeholder?: string;

  /** controlled */
  value?: string;
  /** uncontrolled */
  defaultValue?: string;

  onChange?: (value: string) => void;

  disabled?: boolean;
  isLoading?: boolean;

  className?: string;     // trigger wrapper
  menuClassName?: string; // menu scrollable list

  /** dropdown positioning */
  menuPlacement?: MenuPlacement; // default: "auto"
  menuMaxHeight?: number;        // default: 280

  /** render menu in a portal-like fixed layer (avoids overflow clipping) */
  useFixedLayer?: boolean; // default: true

  /** shows a live-filter search box inside the dropdown */
  searchable?: boolean; // default: false
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GAP = 6;
const VIEWPORT_PADDING = 8;
const MIN_MENU_WIDTH = 180;
const FALLBACK_MENU_HEIGHT = 240;

// Spring: open feels alive, ease-in: close feels instant and responsive
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
const EASE_STD = "cubic-bezier(0.4, 0, 0.2, 1)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeStatus(status: Option["status"]): boolean | undefined {
  if (status === "active") return true;
  if (status === "inactive") return false;
  if (typeof status === "boolean") return status;
  return undefined;
}

function toStatusLabel(status: boolean | undefined): "Active" | "Inactive" | null {
  if (typeof status !== "boolean") return null;
  return status ? "Active" : "Inactive";
}

/** Wraps the matched substring in a <mark> with brand highlight colours. */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lc = text.toLowerCase();
  const lq = query.toLowerCase();
  const idx = lc.indexOf(lq);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-brand-100 px-[1px] text-brand-800 dark:bg-brand-500/30 dark:text-brand-200">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** Pill badge for Active / Inactive status, used in both trigger and menu items. */
function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5",
        "text-[10px] font-semibold tracking-wide",
        "border",
        active
          ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400"
          : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400",
      )}
    >
      <span
        className={cn(
          "mr-1 inline-block h-1.5 w-1.5 rounded-full",
          active ? "bg-success-500" : "bg-error-500",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Select({
  options,
  placeholder = "Select an option",
  value,
  defaultValue,
  onChange,
  disabled,
  isLoading,
  className,
  menuClassName,
  menuPlacement = "auto",
  menuMaxHeight = 280,
  useFixedLayer = true,
  searchable = true,
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef    = useRef<HTMLDivElement    | null>(null);
  const searchRef  = useRef<HTMLInputElement  | null>(null);
  const openRafRef = useRef<number | null>(null);
  const listboxId  = useId();
  const portalRoot =
    useFixedLayer && typeof document !== "undefined" ? document.body : null;

  // ── Value state ────────────────────────────────────────────────────────────
  const isControlled  = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? "");
  const selectedValue = isControlled ? (value ?? "") : internalValue;

  const selected = useMemo(
    () => options.find((o) => o.value === selectedValue) ?? null,
    [options, selectedValue],
  );

  // ── Open / animation state ─────────────────────────────────────────────────
  const [open,      setOpen]      = useState(false);
  const [isMounted, setIsMounted] = useState(false); // DOM presence
  const [isVisible, setIsVisible] = useState(false); // CSS visible (lags one frame)
  const [pos,       setPos]       = useState<MenuPos | null>(null);

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery, searchable]);

  const cancelOpenRaf = useCallback(() => {
    if (openRafRef.current !== null) {
      window.cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openMenu = useCallback(() => {
    if (open) return;
    setOpen(true);
    setIsMounted(true);
    cancelOpenRaf();
    // Mount → paint with opacity 0 → flip isVisible (next frame) for clean transition
    openRafRef.current = window.requestAnimationFrame(() => {
      openRafRef.current = window.requestAnimationFrame(() => {
        setIsVisible(true);
        openRafRef.current = null;
      });
    });
  }, [cancelOpenRaf, open]);

  const close = useCallback(() => {
    cancelOpenRaf();
    setOpen(false);
    setIsVisible(false);  // begin exit transition
    setSearchQuery("");   // reset search when closed
  }, [cancelOpenRaf]);

  useEffect(() => () => cancelOpenRaf(), [cancelOpenRaf]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) setIsMounted(false); // unmount after exit transition completes
  }, [open]);

  // Auto-focus search input after menu appears
  useEffect(() => {
    if (isVisible && searchable && searchRef.current) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [isVisible, searchable]);

  const commitValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
      close();
    },
    [close, isControlled, onChange],
  );

  // ── Outside click / Escape ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      close();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [close, open]);

  // ── Position computation ───────────────────────────────────────────────────
  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect     = trigger.getBoundingClientRect();
    const menuEl   = menuRef.current;
    const measuredH = menuEl?.getBoundingClientRect().height ?? Math.min(menuMaxHeight, FALLBACK_MENU_HEIGHT);
    const expectedH = Math.min(measuredH, menuMaxHeight);

    const availableBottom = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const availableTop    = rect.top - VIEWPORT_PADDING;

    let placement: "top" | "bottom" = "bottom";
    if      (menuPlacement === "top")    placement = "top";
    else if (menuPlacement === "bottom") placement = "bottom";
    else if (availableBottom < expectedH && availableTop > availableBottom) placement = "top";

    if (!useFixedLayer) {
      setPos({ top: 0, left: 0, width: rect.width, placement });
      return;
    }

    const width = clamp(rect.width, MIN_MENU_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);

    let left = rect.left;
    const rightEdge = left + width;
    if (rightEdge > window.innerWidth - VIEWPORT_PADDING) {
      left = rect.right - width;
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    let   top   = rect.bottom + GAP;
    if (placement === "top") top = rect.top - GAP - expectedH;
    top = clamp(top, VIEWPORT_PADDING, window.innerHeight - VIEWPORT_PADDING - 40);

    setPos({ top, left, width, placement });
  }, [menuMaxHeight, menuPlacement, useFixedLayer]);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const id       = window.requestAnimationFrame(computePosition);
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [computePosition, open, options.length]);

  // ── Derived display values ─────────────────────────────────────────────────
  const triggerText        = isLoading ? "Loading…" : (selected?.label ?? placeholder);
  const selectedStatus      = normalizeStatus(selected?.status);
  const selectedStatusLabel = toStatusLabel(selectedStatus);

  // ── Menu container style (position) ───────────────────────────────────────
  const menuContainerStyle = useMemo<React.CSSProperties>(() => {
    if (useFixedLayer) {
      return { position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width ?? 0 };
    }
    return {
      position: "absolute",
      left: 0,
      width: "100%",
      top:    pos?.placement === "top" ? undefined : `calc(100% + ${GAP}px)`,
      bottom: pos?.placement === "top" ? `calc(100% + ${GAP}px)` : undefined,
    };
  }, [pos?.left, pos?.placement, pos?.top, pos?.width, useFixedLayer]);

  // ─────────────────────────────────────────────────────────────────────────
  // Menu JSX
  // ─────────────────────────────────────────────────────────────────────────
  const isFromTop = pos?.placement === "top";

  const menu = (
    <div
      ref={menuRef}
      style={{
        ...menuContainerStyle,
        // ── Entry / exit animation ──────────────────────────────────────────
        opacity:   isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : isFromTop
            ? "translateY(10px) scale(0.95)"
            : "translateY(-10px) scale(0.95)",
        transition: isVisible
          ? `opacity 240ms ${SPRING}, transform 300ms ${SPRING}`
          : `opacity 160ms ${EASE_IN}, transform 160ms ${EASE_IN}`,
        transformOrigin: isFromTop ? "bottom center" : "top center",
        pointerEvents:   isVisible ? "auto" : "none",
        willChange:      "opacity, transform",
      }}
      className={cn(
        "z-[9999] overflow-hidden",
        // Shape
        "rounded-2xl",
        // Frosted glass — light
        "border border-white/70 bg-white/92",
        "[backdrop-filter:blur(20px)_saturate(180%)]",
        // Layered shadow: ring + ambient + depth
        "shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_4px_8px_-2px_rgba(16,24,40,0.06),0_20px_48px_-12px_rgba(16,24,40,0.14)]",
        // Dark mode
        "dark:border-gray-700/50 dark:bg-gray-900/90",
        "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_8px_-2px_rgba(0,0,0,0.3),0_20px_48px_-12px_rgba(0,0,0,0.55)]",
        "[&::-webkit-scrollbar]:hidden",
      )}
      role="listbox"
      id={listboxId}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* ── Search input ──────────────────────────────────────────────────── */}
      {searchable && (
        <div
          style={{
            opacity:    isVisible ? 1 : 0,
            transform:  isVisible ? "translateY(0)" : "translateY(-6px)",
            transition: isVisible
              ? `opacity 200ms ${SPRING} 40ms, transform 240ms ${SPRING} 40ms`
              : "none",
          }}
          className="border-b border-gray-100/80 px-2 pb-1.5 pt-2 dark:border-gray-800/80"
        >
          <div className={cn(
            "flex items-center gap-2 rounded-xl px-2.5 py-1.5",
            "bg-gray-50 ring-1 ring-gray-200/80",
            "dark:bg-gray-800/60 dark:ring-gray-700/60",
            "transition-shadow duration-150 focus-within:ring-brand-400/50 dark:focus-within:ring-brand-500/40",
          )}>
            <Search size={13} className="shrink-0 text-gray-400 dark:text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className={cn(
                "min-w-0 flex-1 bg-transparent text-xs",
                "text-gray-700 placeholder-gray-400 outline-none",
                "dark:text-gray-200 dark:placeholder-gray-500",
              )}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  opacity:    searchQuery ? 1 : 0,
                  transform:  searchQuery ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(90deg)",
                  transition: `opacity 180ms ${SPRING}, transform 200ms ${SPRING}`,
                }}
                className={cn(
                  "shrink-0 rounded-full p-0.5",
                  "text-gray-400 hover:bg-gray-200 hover:text-gray-600",
                  "dark:hover:bg-gray-700 dark:hover:text-gray-300",
                  "transition-colors duration-100",
                )}
              >
                <X size={10} />
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Option list ──────────────────────────────────────────────────── */}
      <div
        className={cn("py-1.5", menuClassName)}
        style={{
          maxHeight:      menuMaxHeight,
          overflowY:      "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(156,163,175,0.3) transparent",
        }}
      >
        {filteredOptions.length === 0 ? (
          /* ── Empty / no-results state ─────────────────────────────────── */
          <div
            style={{
              opacity:    isVisible ? 1 : 0,
              transform:  isVisible ? "scale(1)" : "scale(0.96)",
              transition: isVisible ? `opacity 220ms ${SPRING} 60ms, transform 240ms ${SPRING} 60ms` : "none",
            }}
            className="flex flex-col items-center gap-2 px-4 py-6 text-center"
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-gray-100 dark:bg-gray-800",
            )}>
              <Search size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {searchQuery ? "No matches found" : "No options"}
              </p>
              {searchQuery && (
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  Try a different search term
                </p>
              )}
            </div>
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            const isActive      = opt.value === selectedValue;
            const optStatus     = normalizeStatus(opt.status);
            const optStatusLabel = toStatusLabel(optStatus);

            // Staggered entry: first item at 25ms, each subsequent +15ms, max 200ms
            const staggerDelay  = isVisible ? Math.min(index * 15 + 25, 200) : 0;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => commitValue(opt.value)}
                style={{
                  opacity:    isVisible ? 1 : 0,
                  transform:  isVisible ? "translateY(0) scale(1)" : "translateY(5px) scale(0.98)",
                  transition: isVisible
                    ? [
                        `opacity 220ms ${SPRING} ${staggerDelay}ms`,
                        `transform 260ms ${SPRING} ${staggerDelay}ms`,
                        `background-color 120ms ${EASE_STD}`,
                        `color 120ms ${EASE_STD}`,
                      ].join(", ")
                    : "none",
                  willChange: "opacity, transform",
                }}
                className={cn(
                  "group relative mx-1 flex w-[calc(100%-8px)] items-center justify-between",
                  "gap-3 rounded-xl px-3 py-2 text-left text-sm",
                  isActive
                    ? "bg-brand-500/[0.08] text-brand-700 dark:bg-brand-500/[0.16] dark:text-brand-300"
                    : "text-gray-700 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-white/[0.05]",
                )}
                role="option"
                aria-selected={isActive}
              >
                {/* Active indicator — pill anchored inside item's left padding */}
                <span
                  aria-hidden
                  style={{
                    position:      "absolute",
                    left:          0,
                    top:           "50%",
                    transform:     isActive
                      ? "translateY(-50%) scaleY(1)"
                      : "translateY(-50%) scaleY(0.2)",
                    height:        isActive ? "60%" : "30%",
                    width:         "3px",
                    borderRadius:  "0 3px 3px 0",
                    background:    "linear-gradient(to bottom, var(--color-brand-400, #6366f1), var(--color-brand-600, #4f46e5))",
                    opacity:       isActive ? 1 : 0,
                    boxShadow:     isActive ? "2px 0 8px rgba(99,102,241,0.45)" : "none",
                    transition:    `opacity 200ms ${SPRING}, transform 240ms ${SPRING}, height 240ms ${SPRING}, box-shadow 200ms ease`,
                    willChange:    "transform, opacity",
                  }}
                />

                <span className="flex min-w-0 items-center gap-2 pl-1">
                  <span className="truncate font-[450]">
                    <HighlightMatch text={opt.label} query={searchable ? searchQuery : ""} />
                  </span>
                  {optStatusLabel && optStatus !== undefined ? (
                    <StatusPill active={optStatus} />
                  ) : null}
                </span>


              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Trigger + portal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => {
          if (open) close();
          else openMenu();
        }}
        style={{
          // All interactive states driven by box-shadow for smooth blended glow
          boxShadow: open
            ? [
                "0 0 0 1px rgba(99,102,241,0.55)",        // border-like inner ring
                "0 0 0 4px rgba(99,102,241,0.14)",        // soft outer halo
                "0 0 12px 4px rgba(99,102,241,0.08)",     // ambient glow
                "0 1px_2px_rgba(16,24,40,0.05)",          // base shadow
              ].join(", ")
            : "0 1px 2px rgba(16,24,40,0.05)",
          transition: [
            `border-color 180ms ${EASE_STD}`,
            `box-shadow 220ms ${EASE_STD}`,
            `background-color 150ms ease`,
          ].join(", "),
        }}
        className={cn(
          // Layout — rounded-xl = 12px to match standard input radius
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3",
          "text-sm font-medium outline-none",
          // Base appearance
          "border-gray-200 bg-white text-gray-800",
          // Hover
          "hover:border-gray-300 hover:bg-gray-50/60",
          // Dark base
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
          "dark:hover:border-gray-600 dark:hover:bg-white/[0.03]",
          // Open: brand border (box-shadow does the ring)
          open
            ? "border-brand-400 dark:border-brand-500"
            : "",
          // Focus (keyboard) — extra accessible ring on top of the glow
          "focus-visible:border-brand-400 focus-visible:outline-none",
          "dark:focus-visible:border-brand-500",
          // Disabled
          (disabled || isLoading) && "cursor-not-allowed opacity-50",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
      >
        {/* ── Label ─────────────────────────────────────────────────────── */}
        <span
          className={cn(
            "flex min-w-0 items-center gap-2",
            !selected && "text-gray-400 dark:text-gray-500",
          )}
        >
          {isLoading ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-gray-400" />
          ) : null}
          <span className="truncate">{triggerText}</span>
          {selectedStatusLabel && selectedStatus !== undefined ? (
            <StatusPill active={selectedStatus} />
          ) : null}
        </span>

        {/* ── Chevron ───────────────────────────────────────────────────── */}
        <ChevronDown
          size={15}
          strokeWidth={2}
          style={{
            transform:  open ? "rotate(180deg)" : "rotate(0deg)",
            transition: `transform 320ms ${SPRING}, color 200ms ease`,
            flexShrink: 0,
            willChange: "transform",
          }}
          className={cn(
            open ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500",
          )}
        />
      </button>

      {/* ── Dropdown portal ───────────────────────────────────────────────── */}
      {isMounted
        ? useFixedLayer
          ? portalRoot
            ? createPortal(
              <div className="fixed inset-0 z-[9999] pointer-events-none">{menu}</div>,
              portalRoot,
            )
            : null
          : menu
        : null}
    </div>
  );
}
