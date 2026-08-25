"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-areas"],
    queryFn: () => deliveryService.getAreas(),
    staleTime: 5 * 60 * 1000,
  });

  const cities: DeliveryCity[] = data?.data ?? [];

  // Filter cities/areas by search term
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return cities;
    return cities
      .map((c) => ({
        ...c,
        areas: c.areas.filter(
          (a) =>
            a.area_name.toLowerCase().includes(q) ||
            c.city_name.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.areas.length > 0);
  }, [cities, search]);

  // Auto-open the city that matches the search
  const activeCity = useMemo(() => {
    if (search) return filtered[0]?.city_name ?? null;
    return selectedCity;
  }, [search, filtered, selectedCity]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(
    (city: DeliveryCity, area: DeliveryArea) => {
      onChange({ location_mapping_id: area.id, city_name: city.city_name, area_name: area.area_name });
      setSelectedCity(city.city_name);
      setSearch("");
      setOpen(false);
    },
    [onChange]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch("");
    setSelectedCity(null);
  };

  const displayText = value
    ? `${value.city_name} — ${value.area_name}`
    : null;

  return (
    <div ref={panelRef} className="relative w-full">
      {/* Trigger */}
      <button
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
        <span className={["flex-1 truncate text-left", displayText ? "text-foreground" : "text-muted-foreground"].join(" ")}>
          {displayText ?? placeholder}
        </span>
        {value ? (
          <X size={14} className="shrink-0 text-gray-400 hover:text-gray-600" onClick={handleClear} />
        ) : (
          <ChevronDown size={14} className={["shrink-0 text-gray-400 transition-transform", open ? "rotate-180" : ""].join(" ")} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-[4px] border border-border bg-background shadow-lg">
          {/* Search */}
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

          {/* City → Area list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <p className="py-6 text-center text-xs text-gray-400">Loading areas…</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No areas found</p>
            ) : (
              filtered.map((city) => (
                <div key={city.city_name}>
                  {/* City header — clickable to expand */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCity((p) => (p === city.city_name ? null : city.city_name))
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                  >
                    {city.city_name}
                    <ChevronDown
                      size={12}
                      className={["transition-transform", (search ? true : activeCity === city.city_name) ? "rotate-180" : ""].join(" ")}
                    />
                  </button>

                  {/* Areas — all expand when searching, accordion when not */}
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
        </div>
      )}

      {required && !value && (
        <p className="mt-1 text-xs text-red-500">
          {error ?? "Please select a delivery area"}
        </p>
      )}
    </div>
  );
};

export default DeliveryAreaSelector;
