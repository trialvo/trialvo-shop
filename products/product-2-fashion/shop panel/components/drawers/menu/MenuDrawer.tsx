"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { CiImageOff } from "react-icons/ci";
import { FiGitCommit, FiHeart, FiLayers, FiLogIn, FiLogOut, FiTag, FiUser, FiUserPlus } from "react-icons/fi";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategory } from "@/hooks/useCategory";
import { useStorefrontVisibility } from "@/hooks/useStorefrontVisibility";
import { useTranslation } from "@/hooks/useTranslation";
import { cn, getLocalName, getUserAvatarSrc, getUserDisplayName, toPublicUrl } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import type { ChildCategory, SubCategory } from "@/lib/api/category/service";
import DrawerShell from "../DrawerShell";
import MenuList, { MenuRow } from "./MenuList";
import MenuTopBar from "./MenuTopBar";

import { useLogout } from "@/hooks/useLogout";
import { isProductDetailsRoute, shouldHideBottomNav } from "@/lib/routeMatchers";
import LangToggleButton from "@/components/header/LangToggleButton";
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
    <div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-5" />
        </div>
      ))}
    </div>
  );
}

function ChildThumb({ src, alt }: { src: string | null; alt: string }): React.ReactElement {
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-[#E5E5E5] bg-[#F8F8F8]">
      {!src ? (
        <div className="flex h-full w-full items-center justify-center">
          <CiImageOff className="h-4 w-4 text-black/30" />
        </div>
      ) : (
        <ImageWithFallback src={src} alt={alt} fill sizes="40px" className="object-contain object-center" />
      )}
    </div>
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <SubListSkeleton />
          ) : activeLevel.kind === "children" ? (
            <>
              {activeSub ? (
                <MenuRow
                  label={t("common.viewAll")}
                  onClick={() => navigateTo(toSubHref(activeSub))}
                  showChevron
                />
              ) : null}

              {(activeSub?.child_categories ?? []).length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-black">{t("menu.noChildCategories")}</p>
                  <p className="mt-1 text-xs text-black/50">{t("menu.noChildCategoriesSub")}</p>
                </div>
              ) : (
                (activeSub?.child_categories ?? []).map((child) => {
                  const src =
                    typeof child.img_path === "string" && child.img_path.trim().length > 0
                      ? toPublicUrl(child.img_path)
                      : null;
                  return (
                    <MenuRow
                      key={child.id}
                      label={getLocalName(child.name, child.name_bd, language)}
                      onClick={() => navigateTo(toChildHref(child))}
                      leading={<ChildThumb src={src} alt={child.name} />}
                      showChevron
                    />
                  );
                })
              )}
            </>
          ) : (
            <>
              <MenuList nodes={activeLevel.nodes} onNodeClick={handleNodeClick} />

              {activeLevel.kind === "root" ? (
                <div className="border-t-4 border-[#F4F4F4]">
                  <MenuRow
                    icon={FiGitCommit}
                    label={t("header.addon.compare")}
                    active={isCompareActive}
                    onClick={() => navigateTo("/compare")}
                    showChevron
                  />
                  <MenuRow
                    icon={FiLayers}
                    label={t("header.addon.offers")}
                    active={isOffersActive}
                    onClick={() => navigateTo("/offers")}
                    showChevron
                  />
                  {showMegaSale ? (
                    <MenuRow
                      icon={FiTag}
                      label={t("header.addon.megaSale")}
                      active={isMegaSaleActive}
                      onClick={() => navigateTo("/megasale")}
                      showChevron
                    />
                  ) : null}
                  {visibilityLoading ? (
                    <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div
          className={cn(
            "shrink-0 bg-white",
            !(hidden && !onProductDetails) && "max-[500px]:mb-15.25",
          )}
        >
          <MenuRow
            staticRow
            label={t("menu.language")}
            trailing={<LangToggleButton />}
            className="border-t-4 border-t-[#F4F4F4]"
          />

          {isAuthenticated ? (
            <>
              <MenuRow
                label={userName}
                onClick={() => navigateTo("/account")}
                showChevron
                leading={
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#E5E5E5] bg-[#F8F8F8]">
                    {avatarSrc ? (
                      <ImageWithFallback
                        src={avatarSrc}
                        alt={userName}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FiUser className="h-4 w-4 text-black/50" />
                      </div>
                    )}
                  </div>
                }
              />
              <MenuRow
                icon={FiHeart}
                label={t("menu.favorite")}
                onClick={() => navigateTo("/account/favorites")}
                showChevron
              />
              <MenuRow
                icon={FiLogOut}
                label={t("menu.logout")}
                danger
                onClick={() => {
                  logout();
                  onOpenChange(false);
                  router?.push("/sign-in");
                }}
              />
            </>
          ) : (
            <>
              <MenuRow
                icon={FiLogIn}
                label={t("menu.signIn")}
                onClick={() => navigateTo("/sign-in")}
                showChevron
              />
              <MenuRow
                icon={FiUserPlus}
                label={t("menu.createAccount")}
                onClick={() => navigateTo("/sign-up")}
                showChevron
              />
            </>
          )}
        </div>
      </div>
    </DrawerShell>
  );
};

export default MenuDrawer;
