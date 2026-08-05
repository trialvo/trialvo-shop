"use client";

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

export type SelectOption = {
  value: string;
  label: string;
  status?: boolean | "active" | "inactive";
};

type MenuPlacement = "auto" | "top" | "bottom";

type SelectProps = {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  menuClassName?: string;
  menuPlacement?: MenuPlacement;
  menuMaxHeight?: number;
  useFixedLayer?: boolean;
  searchable?: boolean;
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
};

const GAP = 4;
const VIEWPORT_PADDING = 8;
const MIN_MENU_WIDTH = 180;
const FALLBACK_MENU_HEIGHT = 240;

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeStatus(status: SelectOption["status"]): boolean | undefined {
  if (status === "active") return true;
  if (status === "inactive") return false;
  if (typeof status === "boolean") return status;
  return undefined;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lc = text.toLowerCase();
  const lq = query.toLowerCase();
  const idx = lc.indexOf(lq);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-black/[0.08] px-[1px] text-black">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5",
        "text-[10px] font-semibold tracking-wide",
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          active ? "bg-green-500" : "bg-red-500",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

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
  searchable = false,
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const openRafRef = useRef<number | null>(null);
  const listboxId = useId();
  const portalRoot =
    useFixedLayer && typeof document !== "undefined" ? document.body : null;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue ?? "",
  );
  const selectedValue = isControlled ? (value ?? "") : internalValue;

  const selected = useMemo(
    () => options.find((o) => o.value === selectedValue) ?? null,
    [options, selectedValue],
  );

  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);

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

  const openMenu = useCallback(() => {
    if (open) return;
    setOpen(true);
    setIsMounted(true);
    cancelOpenRaf();
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
    setIsVisible(false);
    setSearchQuery("");
  }, [cancelOpenRaf]);

  useEffect(() => () => cancelOpenRaf(), [cancelOpenRaf]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) setIsMounted(false);
  }, [open]);

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

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuEl = menuRef.current;
    const measuredH =
      menuEl?.getBoundingClientRect().height ??
      Math.min(menuMaxHeight, FALLBACK_MENU_HEIGHT);
    const expectedH = Math.min(measuredH, menuMaxHeight);

    const availableBottom = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const availableTop = rect.top - VIEWPORT_PADDING;

    let placement: "top" | "bottom" = "bottom";
    if (menuPlacement === "top") placement = "top";
    else if (menuPlacement === "bottom") placement = "bottom";
    else if (availableBottom < expectedH && availableTop > availableBottom)
      placement = "top";

    if (!useFixedLayer) {
      setPos({ top: 0, left: 0, width: rect.width, placement });
      return;
    }

    const width = clamp(
      rect.width,
      MIN_MENU_WIDTH,
      window.innerWidth - VIEWPORT_PADDING * 2,
    );

    let left = rect.left;
    const rightEdge = left + width;
    if (rightEdge > window.innerWidth - VIEWPORT_PADDING) {
      left = rect.right - width;
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    let top = rect.bottom + GAP;
    if (placement === "top") top = rect.top - GAP - expectedH;
    top = clamp(
      top,
      VIEWPORT_PADDING,
      window.innerHeight - VIEWPORT_PADDING - 40,
    );

    setPos({ top, left, width, placement });
  }, [menuMaxHeight, menuPlacement, useFixedLayer]);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const id = window.requestAnimationFrame(computePosition);
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

  const triggerText = isLoading
    ? "Loading…"
    : (selected?.label ?? placeholder);
  const selectedStatus = normalizeStatus(selected?.status);

  const menuContainerStyle = useMemo<React.CSSProperties>(() => {
    if (useFixedLayer) {
      return {
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: pos?.width ?? 0,
      };
    }
    return {
      position: "absolute",
      left: 0,
      width: "100%",
      top:
        pos?.placement === "top" ? undefined : `calc(100% + ${GAP}px)`,
      bottom:
        pos?.placement === "top" ? `calc(100% + ${GAP}px)` : undefined,
    };
  }, [pos?.left, pos?.placement, pos?.top, pos?.width, useFixedLayer]);

  const isFromTop = pos?.placement === "top";

  const menu = (
    <div
      ref={menuRef}
      style={{
        ...menuContainerStyle,
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : isFromTop
            ? "translateY(6px) scale(0.98)"
            : "translateY(-6px) scale(0.98)",
        transition: isVisible
          ? `opacity 200ms ${SPRING}, transform 240ms ${SPRING}`
          : `opacity 120ms ${EASE_IN}, transform 120ms ${EASE_IN}`,
        transformOrigin: isFromTop ? "bottom center" : "top center",
        pointerEvents: isVisible ? "auto" : "none",
        willChange: "opacity, transform",
      }}
      className={cn(
        "z-[9999] overflow-hidden",
        "border border-black/[0.08] bg-white",
        "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)]",
        "[&::-webkit-scrollbar]:hidden",
      )}
      role="listbox"
      id={listboxId}
      onTransitionEnd={handleTransitionEnd}
    >
      {searchable && (
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(-4px)",
            transition: isVisible
              ? `opacity 180ms ${SPRING} 30ms, transform 200ms ${SPRING} 30ms`
              : "none",
          }}
          className="border-b border-black/[0.06] px-2.5 py-2"
        >
          <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5">
            <Search
              size={13}
              className="shrink-0 text-gray-400"
            />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="min-w-0 flex-1 bg-transparent text-xs text-black placeholder-gray-400 outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  opacity: searchQuery ? 1 : 0,
                  transform: searchQuery
                    ? "scale(1) rotate(0deg)"
                    : "scale(0.5) rotate(90deg)",
                  transition: `opacity 150ms ${SPRING}, transform 180ms ${SPRING}`,
                }}
                className="shrink-0 p-0.5 text-gray-400 transition-colors hover:text-black"
              >
                <X size={10} />
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div
        className={cn("py-1", menuClassName)}
        style={{
          maxHeight: menuMaxHeight,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,0,0,0.12) transparent",
        }}
      >
        {filteredOptions.length === 0 ? (
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "scale(1)" : "scale(0.97)",
              transition: isVisible
                ? `opacity 180ms ${SPRING} 40ms, transform 200ms ${SPRING} 40ms`
                : "none",
            }}
            className="flex flex-col items-center gap-1.5 px-4 py-6 text-center"
          >
            <Search size={16} className="text-gray-300" />
            <p className="text-xs font-medium text-gray-500">
              {searchQuery ? "No matches found" : "No options"}
            </p>
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            const isActive = opt.value === selectedValue;
            const optStatus = normalizeStatus(opt.status);
            const staggerDelay = isVisible
              ? Math.min(index * 12 + 20, 160)
              : 0;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => commitValue(opt.value)}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? "translateY(0)"
                    : "translateY(4px)",
                  transition: isVisible
                    ? [
                        `opacity 180ms ${SPRING} ${staggerDelay}ms`,
                        `transform 220ms ${SPRING} ${staggerDelay}ms`,
                        "background-color 100ms ease",
                      ].join(", ")
                    : "none",
                  willChange: "opacity, transform",
                }}
                className={cn(
                  "group relative mx-1 flex w-[calc(100%-8px)] items-center justify-between",
                  "gap-3 px-3 py-2 text-left text-sm",
                  isActive
                    ? "bg-black/[0.04] font-semibold text-black"
                    : "text-gray-700 hover:bg-black/[0.02]",
                )}
                role="option"
                aria-selected={isActive}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: isActive
                      ? "translateY(-50%) scaleY(1)"
                      : "translateY(-50%) scaleY(0.2)",
                    height: isActive ? "60%" : "30%",
                    width: "2px",
                    background: "black",
                    opacity: isActive ? 1 : 0,
                    transition: `opacity 180ms ${SPRING}, transform 200ms ${SPRING}, height 200ms ${SPRING}`,
                    willChange: "transform, opacity",
                  }}
                />

                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">
                    <HighlightMatch
                      text={opt.label}
                      query={searchable ? searchQuery : ""}
                    />
                  </span>
                  {optStatus !== undefined && (
                    <StatusPill active={optStatus} />
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

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
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 border px-3",
          "text-sm font-medium outline-none transition-colors",
          "border-[#CBCBCB] bg-white text-black",
          "hover:border-gray-400",
          open && "border-black",
          (disabled || isLoading) && "cursor-not-allowed opacity-50",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-2",
            !selected && "text-[#999999]",
          )}
        >
          {isLoading ? (
            <Loader2
              size={14}
              className="shrink-0 animate-spin text-gray-400"
            />
          ) : null}
          <span className="truncate">{triggerText}</span>
          {selectedStatus !== undefined && (
            <StatusPill active={selectedStatus} />
          )}
        </span>

        <ChevronDown
          size={14}
          strokeWidth={2}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: `transform 280ms ${SPRING}`,
            flexShrink: 0,
            willChange: "transform",
          }}
          className={open ? "text-black" : "text-gray-400"}
        />
      </button>

      {isMounted
        ? useFixedLayer
          ? portalRoot
            ? createPortal(
                <div className="fixed inset-0 z-[9999] pointer-events-none">
                  {menu}
                </div>,
                portalRoot,
              )
            : null
          : menu
        : null}
    </div>
  );
}
