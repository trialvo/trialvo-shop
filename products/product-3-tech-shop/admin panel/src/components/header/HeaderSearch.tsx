import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import {
  ADMIN_SEARCH_ROUTES,
  type AdminSearchRoute,
} from "@/config/adminSearchRoutes";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";

export type HeaderSearchResult = AdminSearchRoute & {
  label: string;
  groupLabel: string;
};

type HeaderSearchProps = {
  className?: string;
};

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Header page/command search — navigates to existing admin routes.
 */
export default function HeaderSearch({ className }: Readonly<HeaderSearchProps>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const isSuperAdmin = hasAnyRole(["SUPER_ADMIN"]);

  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const catalog = useMemo<HeaderSearchResult[]>(() => {
    return ADMIN_SEARCH_ROUTES.filter(
      (route) => !route.superAdminOnly || isSuperAdmin,
    ).map((route) => ({
      ...route,
      label: t(`sidebar.${route.nameKey}`),
      groupLabel: t(`sidebar.${route.groupKey}`),
    }));
  }, [isSuperAdmin, t]);

  const results = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return catalog.slice(0, 8);

    return catalog
      .filter((item) => {
        const haystack =
          `${item.label} ${item.groupLabel} ${item.path}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 10);
  }, [catalog, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  useEffect(() => {
    const onGlobalKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onGlobalKey);
    return () => document.removeEventListener("keydown", onGlobalKey);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const goTo = useCallback(
    (path: string) => {
      navigate(path);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [navigate],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const target = results[activeIndex] ?? results[0];
    if (target) goTo(target.path);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) =>
        results.length === 0 ? 0 : (prev + 1) % results.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        results.length === 0
          ? 0
          : (prev - 1 + results.length) % results.length,
      );
    }
  };

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full max-w-[520px]", className)}
    >
      <form onSubmit={onSubmit} role="search">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Search className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </span>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t("header.searchPlaceholder")}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-activedescendant={
              open && results[activeIndex]
                ? `${listboxId}-option-${activeIndex}`
                : undefined
            }
            className={cn(
              "h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-[4.5rem] text-sm text-gray-800 shadow-theme-xs",
              "placeholder:text-gray-400 transition-colors",
              "focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10",
              "dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800",
            )}
          />

          <span
            className={cn(
              "pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5",
              "rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-[11px] font-medium tracking-tight text-gray-500",
              "dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-400",
            )}
            aria-hidden
          >
            <span>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </span>
        </div>
      </form>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-[100] mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg",
            "dark:border-gray-700 dark:bg-gray-900",
          )}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
              {t("header.searchEmpty")}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <li key={item.path} role="presentation">
                    <button
                      type="button"
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item.path)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/12 dark:text-brand-300"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]",
                      )}
                    >
                      <span className="min-w-0 truncate font-medium">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {item.groupLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
            {t("header.searchHint")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
