// src/components/shared/AdminZonePicker.tsx
// Nested City → Area dropdown for admin forms (New Sale, Order Editor)
// Mirrors the shop panel's DeliveryAreaSelector UX.
// Smooth spring-based open / close transitions matching the custom Select component.

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, MapPin, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDeliveryAreas } from "@/api/delivery-areas.api";
import { cn } from "@/lib/utils";

// ─── Spring / easing curves (matching custom Select) ───────────────────────
const SPRING  = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

export type ZoneSelection = {
  location_mapping_id: number;
  city_name: string;
  area_name: string;
};

type Props = {
  value: ZoneSelection | null;
  onChange: (sel: ZoneSelection | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

type CityGroup = {
  city_name: string;
  areas: { id: number; area_name: string }[];
};

export default function AdminZonePicker({ value, onChange, placeholder = "Select delivery zone…", disabled = false }: Props) {
  // ── Menu lifecycle: open → isMounted (DOM) → isVisible (CSS transition) ──
  const [open, setOpen]           = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  type Placement = "top" | "bottom";
  const [placement, setPlacement] = useState<Placement>("bottom");


  const [search, setSearch]         = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(value?.city_name ?? null);

  const ref        = useRef<HTMLDivElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);
  const openRafRef = useRef<number | null>(null);

  // Fetch delivery areas
  const { data, isLoading } = useQuery({
    queryKey: ["admin-delivery-areas"],
    queryFn: getDeliveryAreas,
    staleTime: 10 * 60 * 1000,
  });

  // Group by city — backend returns nested [{city_name, areas:[{id,area_name}]}]
  const groups = useMemo<CityGroup[]>(() => {
    const raw = (data?.data ?? []) as Array<{
      city_name: string;
      areas: { id: number; area_name: string }[];
    }>;
    return raw.map((city) => ({
      city_name: city.city_name,
      areas: city.areas ?? [],
    }));
  }, [data]);

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        areas: g.areas.filter((a) => a.area_name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.city_name.toLowerCase().includes(q) || g.areas.length > 0);
  }, [groups, search]);

  // ── Animation helpers (matching Select component pattern) ─────────────────
  const cancelRaf = useCallback(() => {
    if (openRafRef.current !== null) {
      window.cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    if (open) return;
    setOpen(true);
    setIsMounted(true);
    setSearch("");
    cancelRaf();
    // Mount → paint with opacity 0 → flip isVisible next frame for clean transition
    openRafRef.current = window.requestAnimationFrame(() => {
      openRafRef.current = window.requestAnimationFrame(() => {
        setIsVisible(true);
        openRafRef.current = null;
      });
    });
  }, [cancelRaf, open]);

  const closeMenu = useCallback(() => {
    cancelRaf();
    setOpen(false);
    setIsVisible(false); // begin exit transition
    setSearch("");
  }, [cancelRaf]);

  // Unmount DOM after exit transition finishes
  const handleTransitionEnd = useCallback(() => {
    if (!isVisible) setIsMounted(false);
  }, [isVisible]);

  // Clean up rAF on unmount
  useEffect(() => () => cancelRaf(), [cancelRaf]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeMenu]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeMenu]);

  // Sync active city when value changes externally
  useEffect(() => {
    if (value?.city_name) setActiveCity(value.city_name);
  }, [value?.city_name]);

  // ── Dynamic placement: measure real menu DOM, recalculate on scroll/resize ──
  const computePlacement = useCallback(() => {
    if (!ref.current) return;
    const triggerRect = ref.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const VIEWPORT_PAD = 8;
    const GAP           = 4;
    const FALLBACK_H    = 320;
    const measuredH = menuEl?.getBoundingClientRect().height ?? FALLBACK_H;

    const availableBottom = window.innerHeight - triggerRect.bottom - VIEWPORT_PAD - GAP;
    const availableTop    = triggerRect.top - VIEWPORT_PAD - GAP;

    if (availableBottom >= measuredH) {
      setPlacement("bottom");
    } else if (availableTop > availableBottom) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePlacement();
    const rafId = window.requestAnimationFrame(computePlacement);
    const onScroll = () => computePlacement();
    const onResize = () => computePlacement();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [computePlacement, open, filtered.length]);

  const displayLabel = value
    ? `${value.city_name} — ${value.area_name}`
    : null;

  const handleSelect = (city_name: string, area: { id: number; area_name: string }) => {
    onChange({ location_mapping_id: area.id, city_name, area_name: area.area_name });
    closeMenu();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setActiveCity(null);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (open) closeMenu();
    else openMenu();
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3.5 text-sm transition-all duration-200",
          "hover:border-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-gray-800/60 dark:text-white dark:hover:border-gray-600 dark:focus:border-brand-500 dark:focus:ring-brand-500/10",
          open
            ? "border-brand-400 ring-2 ring-brand-100 dark:border-brand-500 dark:ring-brand-500/10"
            : "border-gray-200 dark:border-gray-700"
        )}
      >
        <MapPin size={13} className="shrink-0 text-gray-400" />
        <span className={cn("flex-1 truncate text-left", displayLabel ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
          {isLoading ? "Loading zones…" : (displayLabel ?? placeholder)}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown
            size={13}
            className={cn("text-gray-400 transition-transform duration-200", open && "rotate-180")}
          />
        </span>
      </button>

      {/* Dropdown — stays mounted during exit transition */}
      {isMounted && (
        <div
          ref={menuRef}
          onTransitionEnd={handleTransitionEnd}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? "translateY(0) scale(1)"
              : placement === "top"
                ? "translateY(10px) scale(0.95)"
                : "translateY(-10px) scale(0.95)",
            transition: isVisible
              ? `opacity 240ms ${SPRING}, transform 300ms ${SPRING}`
              : `opacity 160ms ${EASE_IN}, transform 160ms ${EASE_IN}`,
            transformOrigin: placement === "top" ? "bottom center" : "top center",
            pointerEvents: isVisible ? "auto" : "none",
            willChange: "opacity, transform",
          }}
          className={cn(
            "absolute left-0 z-50 overflow-hidden rounded-xl",
            // Width: independent of parent, responsive
            "w-[calc(100vw-2rem)] min-w-[280px] sm:w-max sm:min-w-[320px] sm:max-w-[420px]",
            // Frosted glass style
            "border border-white/70 bg-white/95 shadow-xl backdrop-blur-xl",
            "dark:border-gray-800 dark:bg-gray-950/95 dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {/* Search */}
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-900">
              <Search size={12} className="shrink-0 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or area…"
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Area list */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <p className="py-6 text-center text-xs text-gray-400">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No zones found</p>
            ) : (
              filtered.map((city) => {
                const isExpanded = search ? true : activeCity === city.city_name;
                return (
                  <div key={city.city_name}>
                    {/* City header */}
                    <button
                      type="button"
                      onClick={() => setActiveCity((p) => (p === city.city_name ? null : city.city_name))}
                      className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                    >
                      {city.city_name}
                      <ChevronRight
                        size={12}
                        className={cn("transition-transform duration-200", isExpanded && "rotate-90")}
                      />
                    </button>

                    {/* Areas */}
                    {isExpanded &&
                      city.areas.map((area) => {
                        const isSelected = value?.location_mapping_id === area.id;
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => handleSelect(city.city_name, area)}
                            className={cn(
                              "flex w-full items-center gap-2 px-5 py-2 text-sm transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10",
                              isSelected
                                ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                            {area.area_name}
                          </button>
                        );
                      })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
