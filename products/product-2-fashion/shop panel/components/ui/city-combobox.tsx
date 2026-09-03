"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BANGLADESH_CITY_GROUPS, ALL_CITIES } from "@/data/bangladesh-cities";

interface CityComboboxProps {
 value?: string;
 onValueChange?: (value: string) => void;
 onBlur?: () => void;
 placeholder?: string;
 className?: string;
 name?: string;
}

export function CityCombobox({
 value = "",
 onValueChange,
 onBlur,
 placeholder = "Select city",
 className,
 name,
}: CityComboboxProps) {
 const [open, setOpen] = React.useState(false);
 const [search, setSearch] = React.useState("");
 const containerRef = React.useRef<HTMLDivElement>(null);
 const inputRef = React.useRef<HTMLInputElement>(null);

 // Find the label for the currently selected key
 const selectedCity = React.useMemo(
  () => ALL_CITIES.find((c) => c.key === value),
  [value]
 );

 // Filter groups — if search matches division name, show all cities in that division
 const filteredGroups = React.useMemo(() => {
  if (!search) return BANGLADESH_CITY_GROUPS;
  const q = search.toLowerCase();

  return BANGLADESH_CITY_GROUPS.map((group) => {
   // If division name matches, show all cities under it
   if (group.division.toLowerCase().includes(q)) {
    return group;
   }
   // Otherwise filter individual cities
   const matchedCities = group.cities.filter((city) =>
    city.label.toLowerCase().includes(q)
   );
   if (matchedCities.length === 0) return null;
   return { ...group, cities: matchedCities };
  }).filter(Boolean) as typeof BANGLADESH_CITY_GROUPS;
 }, [search]);

 // Close on outside click
 React.useEffect(() => {
  const handler = (e: MouseEvent) => {
   if (
    containerRef.current &&
    !containerRef.current.contains(e.target as Node)
   ) {
    setOpen(false);
    onBlur?.();
   }
  };
  if (open) {
   document.addEventListener("mousedown", handler);
  }
  return () => document.removeEventListener("mousedown", handler);
 }, [open, onBlur]);

 // Close on Escape
 React.useEffect(() => {
  const handler = (e: KeyboardEvent) => {
   if (e.key === "Escape" && open) {
    setOpen(false);
    onBlur?.();
   }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
 }, [open, onBlur]);

 const handleSelect = (key: string) => {
  onValueChange?.(key);
  setSearch("");
  setOpen(false);
  onBlur?.();
 };

 return (
  <div ref={containerRef} className={cn("relative", className)}>
   {/* Hidden input for form name registration */}
   <input type="hidden" name={name} value={value} />

   {/* Trigger button */}
   <button
    type="button"
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    onClick={() => {
     setOpen(!open);
     if (!open) {
      setTimeout(() => inputRef.current?.focus(), 50);
     }
    }}
    className={cn(
     "flex h-11 w-full items-center justify-between gap-2 rounded-[4px] border border-border bg-background px-3 text-[14px] shadow-none",
     "transition-[color,border-color,box-shadow] outline-none",
     "hover:border-foreground/40",
     "focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground/20",
     "disabled:cursor-not-allowed disabled:opacity-50",
     !value && "text-muted-foreground",
     open && "border-foreground ring-1 ring-foreground/20",
    )}
   >
    <span className="truncate">
     {selectedCity ? selectedCity.label : placeholder}
    </span>
    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
   </button>

   {/* Dropdown */}
   {open && (
    <div
     className={cn(
      "absolute left-0 right-0 top-full z-20 mt-1",
      "overflow-hidden rounded-[4px] border border-border bg-background shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)]",
      "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
     )}
    >
     {/* Search input */}
     <div className="flex items-center gap-2 border-b px-3 py-2">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
       ref={inputRef}
       type="text"
       placeholder="Search city or division..."
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
     </div>

     {/* City list grouped by division */}
     <div
      role="listbox"
      className="overflow-y-auto overflow-x-hidden pb-1"
      style={{ maxHeight: "400px" }}
     >
      {filteredGroups.length === 0 ? (
       <div className="px-3 py-6 text-center text-sm text-muted-foreground">
        No city found.
       </div>
      ) : (
       filteredGroups.map((group) => (
        <div key={group.division}>
         {/* Division header */}
         <div className="sticky top-0 z-10 bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-gray-100">
          {group.division} Division
         </div>

         {/* Cities in this division */}
         {group.cities.map((city) => (
          <button
           key={city.key}
           type="button"
           role="option"
           aria-selected={value === city.key}
           onClick={() => handleSelect(city.key)}
           className={cn(
            "relative flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm outline-none select-none",
            "hover:bg-accent hover:text-accent-foreground",
            value === city.key &&
            "bg-accent/50 font-medium text-accent-foreground"
           )}
          >
           <span>{city.label}</span>
           <Check
            className={cn(
             "h-4 w-4 shrink-0",
             value === city.key ? "opacity-100" : "opacity-0"
            )}
           />
          </button>
         ))}
        </div>
       ))
      )}
     </div>
    </div>
   )}
  </div>
 );
}
