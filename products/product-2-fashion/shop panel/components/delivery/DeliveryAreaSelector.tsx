"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { deliveryService, DeliveryArea, DeliveryCity } from "@/lib/api/delivery/service";
import { ChevronDown, MapPin, Search, X } from "lucide-react";

export type AreaSelection = {
  location_mapping_id: number;
  city_name: string;
  area_name: string;
};

type Props = {
  value?: AreaSelection | null;
  onChange: (selection: AreaSelection | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
};

const GAP = 4;
const VIEWPORT_PADDING = 8;
const MENU_MAX_HEIGHT = 256;
const FALLBACK_MENU_HEIGHT = 240;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export const DeliveryAreaSelector: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Select delivery area",
  required,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(value?.city_name ?? null);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-areas"],
    queryFn: () => deliveryService.getAreas(),
    staleTime: 5 * 60 * 1000,
  });

  const cities: DeliveryCity[] = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return cities;
    return cities
      .map((c) => ({
        ...c,
        areas: c.areas.filter(
          (a) =>
            a.area_name.toLowerCase().includes(q) ||
            c.city_name.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.areas.length > 0);
  }, [cities, search]);

  const activeCity = useMemo(() => {
    if (search) return filtered[0]?.city_name ?? null;
    return selectedCity;
  }, [search, filtered, selectedCity]);

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuEl = menuRef.current;
    const measuredH =
      menuEl?.getBoundingClientRect().height ?? FALLBACK_MENU_HEIGHT;
    const expectedH = Math.min(measuredH, MENU_MAX_HEIGHT);

    const availableBottom = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const availableTop = rect.top - VIEWPORT_PADDING;

    let placement: "top" | "bottom" = "bottom";
    if (availableBottom < expectedH && availableTop > availableBottom) {
      placement = "top";
    }

    const width = clamp(
      rect.width,
      rect.width,
      window.innerWidth - VIEWPORT_PADDING * 2,
    );

    let left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - VIEWPORT_PADDING - width;
    }
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;

    let top =
      placement === "bottom"
        ? rect.bottom + GAP
        : rect.top - GAP - expectedH;
    top = clamp(
      top,
      VIEWPORT_PADDING,
      window.innerHeight - VIEWPORT_PADDING - 40,
    );

    setPos({ top, left, width, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const raf = window.requestAnimationFrame(computePosition);
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePosition, filtered.length, isLoading]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    (city: DeliveryCity, area: DeliveryArea) => {
      onChange({
        location_mapping_id: area.id,
        city_name: city.city_name,
        area_name: area.area_name,
      });
      setSelectedCity(city.city_name);
      setSearch("");
      setOpen(false);
    },
    [onChange],
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch("");
    setSelectedCity(null);
  };

  const displayText = value ? `${value.city_name} — ${value.area_name}` : null;

  const dropdown =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width:
                pos?.width ??
                triggerRef.current?.getBoundingClientRect().width ??
                undefined,
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-[4px] border border-border bg-background shadow-lg"
          >
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-[4px] bg-muted px-3 py-2">
                <Search size={13} className="text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city or area…"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Loading areas…
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  No areas found
                </p>
              ) : (
                filtered.map((city) => (
                  <div key={city.city_name}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCity((p) =>
                          p === city.city_name ? null : city.city_name,
                        )
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                    >
                      {city.city_name}
                      <ChevronDown
                        size={12}
                        className={[
                          "transition-transform",
                          (search ? true : activeCity === city.city_name)
                            ? "rotate-180"
                            : "",
                        ].join(" ")}
                      />
                    </button>

                    {(search ? true : activeCity === city.city_name) &&
                      city.areas.map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => handleSelect(city, area)}
                          className={[
                            "flex w-full items-center gap-2 px-5 py-2 text-sm transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10",
                            value?.location_mapping_id === area.id
                              ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                              : "text-gray-700 dark:text-gray-300",
                          ].join(" ")}
                        >
                          {area.area_name}
                        </button>
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((p) => !p);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={[
          "flex h-11 w-full items-center gap-2 rounded-[4px] border px-3 text-[14px] transition-[border-color,box-shadow]",
          "bg-background shadow-none",
          error
            ? "border-destructive"
            : "border-border hover:border-foreground/40",
          "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20",
        ].join(" ")}
      >
        <MapPin size={15} className="shrink-0 text-muted-foreground" />
        <span
          className={[
            "flex-1 truncate text-left",
            displayText ? "text-foreground" : "text-muted-foreground",
          ].join(" ")}
        >
          {displayText ?? placeholder}
        </span>
        {value ? (
          <X
            size={14}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown
            size={14}
            className={[
              "shrink-0 text-gray-400 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        )}
      </button>

      {dropdown}

      {required && !value && (
        <p className="mt-1 text-xs text-red-500">
          {error ?? "Please select a delivery area"}
        </p>
      )}
    </div>
  );
};

export default DeliveryAreaSelector;
