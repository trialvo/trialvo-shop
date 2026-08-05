import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, UserCheck, X, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";

type AdminOption = {
  id: number;
  name: string;
  email: string;
  profileImg: string | null;
};

type Props = {
  value: number | null;
  onChange: (id: number | null) => void;
};

export default function AdminFilterCombobox({ value, onChange }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Panel position state (fixed, calculated from trigger rect)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Lightweight endpoint — no admin.manage permission required
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ["admins-for-filter"],
    queryFn: async () => {
      const res = await api.get<{
        data: Array<{
          id: number;
          first_name: string | null;
          last_name: string | null;
          email: string;
          profile_img_path: string | null;
        }>;
      }>("admin/admins/filter-list");
      return res.data;
    },
    staleTime: 5 * 60_000,
    retry: 2,
  });

  const admins: AdminOption[] = useMemo(() => {
    return (data?.data ?? []).map((a) => ({
      id: a.id,
      name: [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email,
      email: a.email,
      profileImg: a.profile_img_path ? (toPublicUrl(a.profile_img_path) ?? null) : null,
    }));
  }, [data]);

  const selected = useMemo(
    () => (value !== null ? admins.find((a) => a.id === value) ?? null : null),
    [admins, value],
  );

  // Fuzzy filter: matches id prefix, name, or email substring
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        String(a.id).startsWith(q) ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [admins, query]);

  // Calculate dropdown position from trigger button
  const recalculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 288; // w-72 = 18rem = 288px
    const viewportWidth = window.innerWidth;

    let left = rect.left;
    // If dropdown would overflow right side, right-align it
    if (left + dropdownWidth > viewportWidth - 8) {
      left = rect.right - dropdownWidth;
    }
    // Ensure it doesn't go off the left
    if (left < 8) left = 8;

    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left,
      width: dropdownWidth,
      zIndex: 99999,
    });
  };

  // Open → recalculate position and focus search input
  useEffect(() => {
    if (open) {
      recalculatePosition();
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => recalculatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click-outside → close
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && triggerRef.current.contains(target)
      ) return; // let the trigger toggle handle it
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      setOpen(false);
    };
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler);
    };
  }, [open]);

  const select = (admin: AdminOption) => {
    onChange(admin.id);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const isActive = value !== null;

  const dropdown = (
    <div
      ref={dropdownRef}
      role="listbox"
      style={panelStyle}
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-xl",
        "dark:border-gray-700 dark:bg-gray-900",
      )}
    >
      {/* Search input */}
      <div className="border-b border-gray-100 p-2 dark:border-gray-800">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or ID…"
            className={cn(
              "h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-[12px] text-gray-700 outline-none transition",
              "placeholder:text-gray-400",
              "focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10",
              "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500",
            )}
          />
        </div>
      </div>

      {/* List area */}
      <div className="max-h-60 overflow-y-auto py-1">
        {/* "All Admins" clear option */}
        <button
          type="button"
          role="option"
          aria-selected={value === null}
          onClick={() => { onChange(null); setOpen(false); }}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 text-[12px] transition-colors",
            value === null
              ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <UserCheck size={13} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-semibold">All Admins</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">No admin filter applied</p>
          </div>
        </button>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center gap-1.5 py-4 px-3">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-center text-[11px] text-red-500 dark:text-red-400">
              Could not load admin list
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[11px] text-violet-600 underline dark:text-violet-400"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {isFetching && !isError && admins.length === 0 && (
          <div className="flex items-center justify-center gap-1.5 py-4">
            <Loader2 size={13} className="animate-spin text-gray-400" />
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Loading admins…</p>
          </div>
        )}

        {/* No match message */}
        {!isError && !isFetching && filtered.length === 0 && admins.length > 0 && (
          <p className="py-5 text-center text-[12px] text-gray-400 dark:text-gray-500">
            No admins match &quot;{query}&quot;
          </p>
        )}

        {/* Admin entries */}
        {!isError && filtered.map((admin) => {
          const isSelected = value === admin.id;
          const fallback = imageFallbackSvgDataUri(admin.name);
          return (
            <button
              key={admin.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => select(admin)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-[12px] transition-colors",
                isSelected
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
              )}
            >
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
                <img
                  src={admin.profileImg ?? fallback}
                  alt={admin.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.src = fallback; }}
                />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate font-semibold leading-tight">{admin.name}</p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                  #{admin.id} · {admin.email}
                </p>
              </div>
              {isSelected && (
                <div className="ml-auto h-4 w-4 shrink-0 rounded-full bg-violet-500 text-white flex items-center justify-center">
                  <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-1.5 dark:border-gray-800">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {isError
            ? "Failed to load"
            : isFetching
            ? "Loading…"
            : `${filtered.length} admin${filtered.length !== 1 ? "s" : ""}${query ? ` matching "${query}"` : ""}`}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* ── Trigger button ── */}
      <button
        ref={triggerRef}
        type="button"
        id="admin-filter-combobox-trigger"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-all duration-150 whitespace-nowrap",
          isActive
            ? "border-violet-400 bg-violet-500 text-white shadow-sm dark:border-violet-500 dark:bg-violet-600"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <img
              src={selected.profileImg ?? imageFallbackSvgDataUri(selected.name)}
              alt={selected.name}
              className="h-5 w-5 rounded-full object-cover"
              onError={(e) => { e.currentTarget.src = imageFallbackSvgDataUri(selected.name); }}
            />
            <span className="max-w-[100px] truncate">{selected.name}</span>
            <span
              role="button"
              aria-label="Clear admin filter"
              onClick={clear}
              className="ml-0.5 rounded-full p-0.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </span>
          </>
        ) : (
          <>
            <UserCheck size={14} />
            <span>Assigned Admin</span>
            <ChevronDown size={12} className="opacity-60" />
          </>
        )}
      </button>

      {/* ── Dropdown panel (portal → renders outside overflow-hidden parent) ── */}
      {open && createPortal(dropdown, document.body)}
    </div>
  );
}
