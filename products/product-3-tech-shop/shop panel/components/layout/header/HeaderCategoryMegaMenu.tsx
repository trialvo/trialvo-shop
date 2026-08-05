"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ChevronDown,
  Flame,
  LayoutGrid,
  Menu,
  Package,
  Sparkles,
  Star,
} from "lucide-react";
import type { CategoryFlyoutModel } from "@/lib/adapters/navCategory";
import {
  mainToRailRows,
  subToRailRows,
} from "@/lib/adapters/navCategory";
import {
  CategoryFlyoutSkeleton,
  CategoryRailList,
  ChildCategoryGrid,
} from "@/components/layout/header/CategoryMenuParts";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";
import { DESKTOP_PRIMARY_LINKS } from "@/lib/nav/siteNav";
import { HEADER_CHROME } from "@/lib/layout/breakpoints";
import { cn } from "@/lib/utils";

type HeaderCategoryMegaMenuProps = Readonly<{
  flyout: CategoryFlyoutModel;
  isLoading?: boolean;
}>;

/** Short grace when pointer leaves the trigger+panel zone. */
const CLOSE_DELAY_MS = 200;

const QUICK_LINKS = [
  {
    href: "/shop?badge=sale",
    title: "Hot Deals",
    desc: "Limited offers",
    icon: Flame,
    tone: "bg-accent/15 text-accent",
  },
  {
    href: "/shop?badge=new",
    title: "New Arrivals",
    desc: "Just landed",
    icon: Sparkles,
    tone: "bg-primary/10 text-primary",
  },
  {
    href: "/shop?badge=bestseller",
    title: "Best Sellers",
    desc: "Top picks",
    icon: Star,
    tone: "bg-warning/15 text-warning",
  },
  {
    href: "/shop",
    title: "All Products",
    desc: "Full catalog",
    icon: Package,
    tone: "bg-secondary text-secondary-foreground",
  },
] as const;

type CategoryMegaFlyoutProps = Readonly<{
  flyout: CategoryFlyoutModel;
  isLoading: boolean;
  isNavigating: boolean;
  activeMainId: string | null;
  activeSubId: string | null;
  onActiveMainId: (id: string) => void;
  onActiveSubId: (id: string) => void;
  onNavigate: (href: string) => void;
}>;

/**
 * Mega-menu panel body (always mounted only while open by parent).
 */
function CategoryMegaFlyout({
  flyout,
  isLoading,
  isNavigating,
  activeMainId,
  activeSubId,
  onActiveMainId,
  onActiveSubId,
  onNavigate,
}: CategoryMegaFlyoutProps): ReactElement {
  const mains = flyout.mains;
  const isMulti = flyout.layout === "multi-main";

  const activeMain =
    mains.find((m) => m.id === activeMainId) ?? mains[0] ?? null;
  const activeSub =
    activeMain?.subs.find((s) => s.id === activeSubId) ??
    activeMain?.subs[0] ??
    null;

  const mainRows = useMemo(() => mainToRailRows(mains), [mains]);
  const subRows = useMemo(
    () => subToRailRows(activeMain?.subs ?? []),
    [activeMain],
  );

  const handleMainHover = (id: string): void => {
    onActiveMainId(id);
    const main = mains.find((m) => m.id === id);
    onActiveSubId(main?.subs[0]?.id ?? "");
  };

  if (isLoading) {
    return <CategoryFlyoutSkeleton />;
  }

  return (
    <div
      className={cn(
        "flex max-h-[min(76vh,540px)] min-h-[400px] overflow-hidden rounded-sm border border-border bg-card shadow-product-hover transition-opacity duration-150",
        isNavigating ? "opacity-70" : "opacity-100",
      )}
    >
      <aside className="flex w-[210px] shrink-0 flex-col border-r border-border bg-secondary/60">
        <div className="border-b border-border bg-card/70 px-3.5 py-3">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
              Main categories
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {isMulti ? `${mains.length} departments` : flyout.railHeading}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <CategoryRailList
            items={mainRows}
            activeId={activeMain?.id ?? null}
            onHover={handleMainHover}
            onNavigate={onNavigate}
            emptyLabel="No main categories"
          />
        </div>
        <button
          type="button"
          onClick={() => onNavigate("/shop")}
          className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-card px-4 py-3 text-left text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <span>View all products</span>
          <RightArrowIcon className="h-3.5 w-3.5" />
        </button>
      </aside>

      <aside className="flex w-[210px] shrink-0 flex-col border-r border-border bg-secondary/35">
        <div className="border-b border-border bg-card/50 px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Sub categories
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {activeMain?.name ?? "Select a main category"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <CategoryRailList
            items={subRows}
            activeId={activeSub?.id ?? null}
            onHover={onActiveSubId}
            onNavigate={onNavigate}
            emptyLabel={
              activeMain
                ? `No subcategories in ${activeMain.name}`
                : "Select a main category"
            }
            skeletonCount={5}
          />
        </div>
        {activeMain ? (
          <button
            type="button"
            onClick={() => onNavigate(activeMain.href)}
            className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-card/80 px-4 py-3 text-left text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <span>Shop all {activeMain.name}</span>
            <RightArrowIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </aside>

      <div className="flex min-w-0 w-[min(48vw,420px)] flex-col bg-card xl:w-[460px]">
        <ChildCategoryGrid
          items={activeSub?.children ?? []}
          title={activeSub?.name ?? "Categories"}
          viewAllHref={activeSub?.href ?? activeMain?.href ?? "/shop"}
          onNavigate={onNavigate}
        />
      </div>

      <aside className="hidden w-[180px] shrink-0 flex-col border-l border-border bg-secondary/40 xl:flex">
        <div className="border-b border-border px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Quick links
          </p>
        </div>
        <div className="flex-1 space-y-1 p-2">
          {QUICK_LINKS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onNavigate(item.href)}
              className="group flex w-full items-center gap-2.5 rounded-sm border border-transparent p-2 text-left transition-all hover:border-border hover:bg-card"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
                  item.tone,
                )}
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {item.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

const HeaderCategoryMegaMenu = ({
  flyout,
  isLoading = false,
}: HeaderCategoryMegaMenuProps): ReactElement => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverZoneRef = useRef<HTMLDivElement | null>(null);

  const mains = flyout.mains;

  const clearCloseTimer = useCallback((): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeMenu = useCallback((): void => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback((): void => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      if (!isNavigating) setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer, isNavigating]);

  const openMenuNow = useCallback((): void => {
    clearCloseTimer();
    setOpen(true);
    setActiveMainId((prev) => prev ?? mains[0]?.id ?? null);
  }, [clearCloseTimer, mains]);

  /**
   * Only schedule close when the pointer truly leaves the hover zone
   * (not when moving between the button and the panel).
   */
  const handleZoneMouseLeave = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>): void => {
      const next = event.relatedTarget;
      if (
        next instanceof Node &&
        hoverZoneRef.current?.contains(next)
      ) {
        return;
      }
      scheduleClose();
    },
    [scheduleClose],
  );

  useEffect(() => {
    if (!mains.length) return;
    if (!mains.some((m) => m.id === activeMainId)) {
      setActiveMainId(mains[0].id);
    }
  }, [mains, activeMainId]);

  useEffect(() => {
    const activeMain =
      mains.find((m) => m.id === activeMainId) ?? mains[0] ?? null;
    if (!activeMain) {
      setActiveSubId(null);
      return;
    }
    if (!activeMain.subs.some((s) => s.id === activeSubId)) {
      setActiveSubId(activeMain.subs[0]?.id ?? null);
    }
  }, [mains, activeMainId, activeSubId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer],
  );

  const navigateTo = useCallback(
    (href: string): void => {
      if (!href) return;
      setIsNavigating(true);
      clearCloseTimer();

      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }

      startTransition(() => {
        router.push(href);
        window.setTimeout(() => {
          setOpen(false);
          setIsNavigating(false);
        }, 120);
      });
    },
    [router, clearCloseTimer],
  );

  const handleActiveSubId = useCallback((id: string): void => {
    setActiveSubId(id || null);
  }, []);

  return (
    <nav className={cn("relative", HEADER_CHROME.megaMenu)}>
      <div className="container relative z-[2] flex items-center py-0">
        <div
          ref={hoverZoneRef}
          className="relative shrink-0"
          onMouseEnter={openMenuNow}
          onMouseLeave={handleZoneMouseLeave}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            className={cn(
              "relative z-[1] flex items-center gap-1.5 rounded-sm px-4 py-2.5 text-sm font-semibold transition-all",
              open
                ? "bg-primary text-primary-foreground shadow-sm"
                : "gradient-primary text-primary-foreground hover:opacity-95",
            )}
            onClick={() => (open ? closeMenu() : openMenuNow())}
          >
            <Menu className="h-4 w-4" aria-hidden />
            All Categories
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {open ? (
            <div
              className="absolute left-0 top-full pt-1"
              // Hover bridge: keeps pointer inside the zone while moving down
            >
              <CategoryMegaFlyout
                flyout={flyout}
                isLoading={isLoading}
                isNavigating={isNavigating}
                activeMainId={activeMainId}
                activeSubId={activeSubId}
                onActiveMainId={setActiveMainId}
                onActiveSubId={handleActiveSubId}
                onNavigate={navigateTo}
              />
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-0.5">
            {DESKTOP_PRIMARY_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                prefetch
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors hover:text-primary",
                  link.accent && "text-accent hover:text-accent/80",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HeaderCategoryMegaMenu;
