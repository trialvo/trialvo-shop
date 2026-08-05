"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { CiImageOff } from "react-icons/ci";
import { FiGitCommit, FiHeart, FiLayers, FiTag, FiUser } from "react-icons/fi";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategory } from "@/hooks/useCategory";
import { useStorefrontVisibility } from "@/hooks/useStorefrontVisibility";
import { useTranslation } from "@/hooks/useTranslation";
import { cn, getLocalName, getUserAvatarSrc, getUserDisplayName, toPublicUrl } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import type { ChildCategory, SubCategory } from "@/lib/api/category/service";
import DrawerShell from "../DrawerShell";
import MenuList from "./MenuList";
import MenuTopBar from "./MenuTopBar";

import { useLogout } from "@/hooks/useLogout";
import { isProductDetailsRoute, shouldHideBottomNav } from "@/lib/routeMatchers";
import LangToggleButton from "@/components/header/LangToggleButton";
import { LogOut } from "lucide-react";
import type { MenuLevel, MenuNode } from "./menu.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop: boolean;
  zIndex?: number;
  className?: string;
};

type DrawerLevel = MenuLevel & {
  kind?: "root" | "children";
  subId?: number;
};

const INTERNAL_OPEN_SUB_PREFIX = "__open_sub__:";

function encodeCategorySlug(name: string): string {
  return encodeURIComponent(name);
}

function toSubHref(sub: SubCategory): string {
  return `/category/${encodeCategorySlug(sub.name)}?subId=${sub.id}`;
}

function toChildHref(child: ChildCategory): string {
  return `/category/${encodeCategorySlug(child.name)}?childId=${child.id}`;
}

function parseOpenSubId(href: string): number | null {
  if (!href.startsWith(INTERNAL_OPEN_SUB_PREFIX)) return null;
  const raw = href.slice(INTERNAL_OPEN_SUB_PREFIX.length);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function SubListSkeleton(): React.ReactElement {
  return (
    <div className="divide-y">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      ))}
    </div>
  );
}

function ChildGridSkeleton(): React.ReactElement {
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-20 w-full rounded-none" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChildCategoryTile({
  child,
  onNavigate,
  language,
}: Readonly<{
  child: ChildCategory;
  onNavigate: (href: string) => void;
  language: string | null;
}>): React.ReactElement {
  const src =
    typeof child.img_path === "string" && child.img_path.trim().length > 0
      ? toPublicUrl(child.img_path)
      : null;

  const href = toChildHref(child);
  const stockOut = typeof child.total_stock === "number" && child.total_stock === 0;

  const handleClick = (e: React.MouseEvent) => {
    if (stockOut) { e.preventDefault(); return; }
    onNavigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (stockOut && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group w-full text-left",
        "outline-none focus-visible:ring-2 focus-visible:ring-black/30",
        stockOut ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      )}
      aria-disabled={stockOut}
      tabIndex={stockOut ? -1 : 0}
    >
      <div
        className={cn(
          "relative overflow-hidden border border-[#EDEDED] bg-[#F6F6F6]",
          !stockOut && "hover:border-[#636363] transition-colors",
          "h-20 w-20"
        )}
      >
        {!src ? (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-6 w-6 text-foreground/50" />
          </div>
        ) : (
          <ImageWithFallback
            src={src}
            alt={child.name}
            fill
            sizes="80px"
            className={cn(
              "object-contain object-center",
              "transition-transform duration-200",
              !stockOut && "group-hover:scale-[1.03]"
            )}
          />
        )}
      </div>

      <div className={cn("mt-1 text-xs font-medium text-black line-clamp-1 leading-4")}>
        {getLocalName(child.name, child.name_bd, language)}
      </div>
    </button>
  );
}

const MenuDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop,
  zIndex,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { t, language } = useTranslation();
  const hidden = shouldHideBottomNav(pathname);
  const onProductDetails = isProductDetailsRoute(pathname);
  const { subCategories, mainCategoriesLoading, subCategoriesLoading } = useCategory();
  const { showMegaSale, visibilityLoading } = useStorefrontVisibility();
  const { user, isAuthenticated } = useAuth();
  const userName = React.useMemo(() => getUserDisplayName(user), [user]);
  const avatarSrc = React.useMemo(() => getUserAvatarSrc(user), [user]);

  const isLoading = mainCategoriesLoading || subCategoriesLoading;

  const subs: SubCategory[] = React.useMemo(() => {
    if (!Array.isArray(subCategories)) return [];
    return subCategories
      .map((s) => ({
        ...s,
        id: Number(s.id),
        name: String(s.name ?? ""),
        child_categories: Array.isArray(s.child_categories) ? s.child_categories : [],
      }))
      .filter((s) => Number.isFinite(s.id) && s.id > 0 && s.name.trim().length > 0);
  }, [subCategories]);

  const subsById = React.useMemo(() => {
    const m = new Map<number, SubCategory>();
    for (const s of subs) m.set(s.id, s);
    return m;
  }, [subs]);

  const rootNodes: MenuNode[] = React.useMemo(() => {
    return subs.map((sub) => {
      const hasKids = (sub.child_categories ?? []).length > 0;
      const displayLabel = getLocalName(sub.name, sub.name_bd, language);
      if (hasKids) {
        return { label: displayLabel, href: `${INTERNAL_OPEN_SUB_PREFIX}${sub.id}` };
      }
      return { label: displayLabel, href: toSubHref(sub) };
    });
  }, [subs, language]);

  const menuTitle = t("menu.title");

  const [levels, setLevels] = React.useState<DrawerLevel[]>([
    { title: menuTitle, nodes: rootNodes, kind: "root" },
  ]);

  React.useEffect(() => {
    if (!open) return;
    setLevels([{ title: menuTitle, nodes: rootNodes, kind: "root" }]);
  }, [open, rootNodes, menuTitle]);

  const activeLevel = levels[levels.length - 1];

  const handleClose = () => {
    onOpenChange(false);
    setLevels([{ title: menuTitle, nodes: rootNodes, kind: "root" }]);
  };

  const navigateTo = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleNodeClick = (node: MenuNode) => {
    if (!node.href) return;
    const subId = parseOpenSubId(node.href);
    if (subId) {
      const sub = subsById.get(subId);
      setLevels((prev) => [
        ...prev,
        {
          title: sub ? getLocalName(sub.name, sub.name_bd, language) : t("menu.title"),
          nodes: [],
          kind: "children",
          subId,
        },
      ]);
      return;
    }
    navigateTo(node.href);
  };

  const handleBack = () => {
    setLevels((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const activeSub = React.useMemo(() => {
    if (activeLevel.kind !== "children" || !activeLevel.subId) return null;
    return subsById.get(activeLevel.subId) ?? null;
  }, [activeLevel.kind, activeLevel.subId, subsById]);

  const isCompareActive = pathname === "/compare" || pathname?.startsWith("/compare/");
  const isOffersActive = pathname === "/offers" || pathname?.startsWith("/offers/");
  const isMegaSaleActive = pathname === "/megasale" || pathname?.startsWith("/megasale/");

  return (
    <DrawerShell
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else onOpenChange(v);
      }}
      a11yTitle={activeLevel?.title || menuTitle}
      isTop={isTop}
      zIndex={zIndex}
      side="left"
      contentClassName={cn("w-[84vw] max-w-[380px]", className)}
    >
      <div className="flex h-full flex-col">
        <MenuTopBar
          title={activeLevel.title}
          canGoBack={levels.length > 1}
          onBack={handleBack}
          onClose={handleClose}
        />

        <div className="flex-1 min-h-0 overflow-y-auto pb-13">
          {isLoading ? (
            activeLevel.kind === "children" ? (
              <ChildGridSkeleton />
            ) : (
              <SubListSkeleton />
            )
          ) : activeLevel.kind === "children" ? (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {(activeSub?.child_categories ?? []).map((child) => (
                  <ChildCategoryTile key={child.id} child={child} onNavigate={navigateTo} language={language} />
                ))}
              </div>

              {(activeSub?.child_categories ?? []).length === 0 ? (
                <div className="mt-6 rounded-md border border-dashed border-[#E7E7E7] bg-white p-4 text-center">
                  <p className="text-sm font-semibold text-black">{t("menu.noChildCategories")}</p>
                  <p className="text-xs text-[#6B6B6B]">{t("menu.noChildCategoriesSub")}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* ── Quick links: Compare, Offers, and optional Mega Sale (root level only) ── */}
              {activeLevel.kind === "root" && (
                <div
                  className={cn(
                    "grid gap-2 border-b px-4 py-3",
                    showMegaSale || visibilityLoading ? "grid-cols-3" : "grid-cols-2",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => navigateTo("/compare")}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-1.5 rounded-none border px-3 text-[13px] font-semibold tracking-[0.01em] transition-colors",
                      isCompareActive
                        ? "border-black bg-black text-white"
                        : "border-[#D9D9D9] bg-[#F8F8F8] text-[#222222] hover:border-[#C6C6C6] hover:bg-[#EEEEEE]",
                    )}
                  >
                    <FiGitCommit className="h-3.5 w-3.5" />
                    <span>Compare</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/offers")}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-1.5 rounded-none border px-3 text-[13px] font-semibold tracking-[0.01em] transition-colors",
                      isOffersActive
                        ? "border-black bg-black text-white"
                        : "border-[#D9D9D9] bg-[#F8F8F8] text-[#222222] hover:border-[#C6C6C6] hover:bg-[#EEEEEE]",
                    )}
                  >
                    <FiLayers className="h-3.5 w-3.5" />
                    <span>Offers</span>
                  </button>
                  {showMegaSale ? (
                    <button
                      type="button"
                      onClick={() => navigateTo("/megasale")}
                      className={cn(
                        "inline-flex h-10 items-center justify-center gap-1.5 rounded-none border px-3 text-[13px] font-semibold tracking-[0.01em] transition-colors",
                        isMegaSaleActive
                          ? "border-black bg-black text-white"
                          : "border-[#D9D9D9] bg-[#F8F8F8] text-[#222222] hover:border-[#C6C6C6] hover:bg-[#EEEEEE]",
                      )}
                    >
                      <FiTag className="h-3.5 w-3.5" />
                      <span>Mega Sale</span>
                    </button>
                  ) : null}
                  {visibilityLoading ? (
                    <Skeleton className="h-10 rounded-none" />
                  ) : null}
                </div>
              )}
              <MenuList nodes={activeLevel.nodes} onNodeClick={handleNodeClick} />
            </>
          )}
        </div>

        <div
          className={cn(
            "sticky z-50 bg-white divide-y",
            hidden && !onProductDetails ? "bottom-0" : "bottom-15.25",
            "shadow-[0_-2px_10px_rgba(0,0,0,0.1)]",
          )}
        >
          {/* Language toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-black/70">{t("menu.language")}</span>
            <LangToggleButton />
          </div>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => navigateTo("/account")}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-3.5 text-left hover:bg-black/2"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-black/5">
                  {avatarSrc ? (
                    <ImageWithFallback
                      src={avatarSrc}
                      alt={userName}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FiUser className="h-5 w-5 text-black" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-black line-clamp-1">{userName}</div>
                  <div className="text-xs text-black/60 line-clamp-1">{t("menu.viewAccount")}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo("/account/favorites")}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-3.75 text-left hover:bg-black/2"
              >
                <FiHeart className="h-5 w-5 text-black" />
                <span className="text-sm font-normal text-black">{t("menu.favorite")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onOpenChange(false);
                  router?.push("/sign-in");
                }}
                className="flex w-full items-center gap-3 cursor-pointer px-4 py-3 text-sm font-semibold text-red-600 hover:bg-black/2"
              >
                <LogOut className="h-5 w-5 text-red-600" />
                {t("menu.logout")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigateTo("/sign-in")}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-3.75 text-left hover:bg-black/2"
              >
                <FiUser className="h-5 w-5 text-black" />
                <span className="text-sm font-normal text-black">{t("menu.signIn")}</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo("/sign-up")}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-3.75 text-left hover:bg-black/2"
              >
                <FiUser className="h-5 w-5 text-black" />
                <span className="text-sm font-normal text-black">{t("menu.createAccount")}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </DrawerShell>
  );
};

export default MenuDrawer;
