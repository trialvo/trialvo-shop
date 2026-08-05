"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCategory } from "@/hooks/useCategory";
import { cn, getLocalName, toPublicUrl } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CiImageOff } from "react-icons/ci";
import { FaFolderOpen } from "react-icons/fa";

import { NavigationListItem } from "./navigation-list-item";

type MegaItem = {
  title: string;
  href: string;
  total_stock?: number;
  description?: string;
  imageSrc?: string | null;
  name_bd?: string | null;
};

function EmptyState({
  title,
  subtitle,
}: Readonly<{
  title: string;
  subtitle?: string;
}>): React.ReactElement {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#E7E7E7] bg-white p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FaFolderOpen className="h-9 w-9 text-[#555]" />
      </div>

      <div className="min-w-0 text-center">
        <p className="text-sm font-semibold text-black">{title}</p>
        {subtitle ? <p className="text-xs text-[#6B6B6B]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function MegaGrid({
  heading,
  items,
  onNavigate,
}: Readonly<{
  heading: string;
  items: MegaItem[];
  onNavigate: (href: string) => void;
}>): React.ReactElement {
  return (
    <div className="w-full">
      <h3 className="mb-1.5 text-lg font-semibold text-black">{heading}</h3>

      <div className="max-h-124 overflow-auto pr-2">
        <ul
          className={cn(
            "p-0!",
            "grid gap-3",
            "grid-cols-2",
            "sm:grid-cols-3",
            "md:grid-cols-4",
            "lg:grid-cols-8",
          )}
        >
          {items?.map((item) => {
            const src =
              typeof item.imageSrc === "string" && item.imageSrc.trim().length > 0
                ? toPublicUrl(item.imageSrc)
                : null;

            return (
              <NavigationListItem key={item?.title} href={item?.total_stock !== 0 ? item.href : ""} title={item.title} imageSrc={src ?? undefined} total_stock={item?.total_stock} onNavigate={onNavigate} />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function CategoryTile({
  title,
  href,
  imgPath,
  onNavigate,
  total_stock,
}: Readonly<{
  title: string;
  href: string;
  imgPath?: string | null;
  onNavigate: (href: string) => void;
  total_stock?: number;
}>): React.ReactElement {
  const src = typeof imgPath === "string" && imgPath.trim().length > 0 ? toPublicUrl(imgPath) : null;
  const stockOut = total_stock === 0;

  const handleClick = (e: React.MouseEvent) => {
    if (stockOut) {
      e.preventDefault();
      return;
    }
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
        "group block p-0! text-left",
        "outline-none focus-visible:ring-2 focus-visible:ring-black/30",
        stockOut ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      )}
      aria-disabled={stockOut}
      tabIndex={stockOut ? -1 : 0}
    >
      <div className={cn(
        "relative h-25.5 w-25.5 overflow-hidden border border-[#EDEDED] bg-[#F6F6F6]",
        !stockOut && "hover:border-[#636363] transition-colors"
      )}>
        {!src ? (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-6 w-6 text-foreground/50" />
          </div>
        ) : (
          <ImageWithFallback
            src={src}
            alt={title}
            fill
            sizes="110px"
            className={cn(
              "object-contain object-center",
              "transition-transform duration-200",
              !stockOut && "group-hover:scale-[1.03]"
            )}
            preload={false}
          />
        )}
      </div>

      <div className={cn(
        "text-left text-xs font-medium text-black line-clamp-1 leading-4"
      )}>
        {title}
      </div>
    </button>
  );
}

function SubCategoryPanel({
  title,
  childrenItems,
  onNavigate,
  language,
}: Readonly<{
  title: string;
  childrenItems: Array<{ id: number; name: string; name_bd?: string | null; img_path?: string | null, total_stock: number }>;
  onNavigate: (href: string) => void;
  language: string | null;
}>): React.ReactElement {
  const hasChildren = childrenItems?.length > 0;

  if (!hasChildren) {
    return <EmptyState title="No child categories found" subtitle="We'll add items here soon." />;
  }

  const items: MegaItem[] = childrenItems.map((c) => ({
    title: getLocalName(c?.name, c?.name_bd, language),
    href: `/category/${encodeURIComponent(c?.name)}?childId=${c?.id}`,
    imageSrc: c?.img_path,
    total_stock: c?.total_stock
  }));

  return <MegaGrid heading={title} items={items} onNavigate={onNavigate} />;
}

function AllCategoriesPanel({
  title,
  subCategories,
  onNavigate,
  language,
}: Readonly<{
  title: string;
  subCategories: Array<{
    id: number;
    name: string;
    name_bd?: string | null;
    img_path?: string | null;
    child_categories?: Array<{ id: number; name: string; name_bd?: string | null; img_path?: string | null, total_stock: number }>;
  }>;
  onNavigate: (href: string) => void;
  language: string | null;
}>): React.ReactElement {
  const [activeSubId, setActiveSubId] = React.useState<number>(() => subCategories[0]?.id ?? 0);

  React.useEffect(() => {
    if (subCategories?.length === 0) return;
    setActiveSubId((prev) => prev || subCategories[0].id);
  }, [subCategories]);

  const activeSub = React.useMemo(() => {
    return subCategories.find((s) => s.id === activeSubId) ?? subCategories[0] ?? null;
  }, [activeSubId, subCategories]);

  const activeChildren = activeSub?.child_categories ?? [];
  const hasChildren = activeChildren.length > 0;

  const leftContent = hasChildren ? (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {activeChildren.slice(0, 18).map((c) => (
        <CategoryTile
          key={c.id}
          title={getLocalName(c.name, c.name_bd, language)}
          href={`/category/${encodeURIComponent(c.name)}?childId=${c.id}`}
          imgPath={c.img_path}
          onNavigate={onNavigate}
          total_stock={c?.total_stock}
        />
      ))}
    </div>
  ) : (
    <EmptyState title="No items in this category" subtitle="Try another category from the right side." />
  );

  return (
    <div className="w-full">
      <h3 className="mb-3 text-lg font-semibold text-black">{title}</h3>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="min-h-124 max-h-124 overflow-auto pr-4">{leftContent}</div>
        </div>

        <div className="w-60 shrink-0">
          <div className="min-h-124 max-h-124 overflow-auto border-l border-[#F1F1F1] pl-3">
            <ul>
              {subCategories.map((s) => {
                const isActive = s.id === activeSubId;

                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSubId(s.id)}
                      className={cn(
                        "w-full cursor-pointer rounded-none border-b border-[#f1f1f1] hover:bg-accent p-2 text-left text-base transition-colors duration-200",
                        isActive ? "bg-transparent font-semibold text-black" : "text-black",
                      )}
                    >
                      {getLocalName(s.name, s.name_bd, language)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NavigationMenuMain(): React.JSX.Element {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const { subCategories, mainCategoriesLoading, subCategoriesLoading } = useCategory();
  const isLoading = mainCategoriesLoading || subCategoriesLoading;

  const [value, setValue] = React.useState<string>("");

  const closeMenu = React.useCallback(() => {
    setValue("");
  }, []);

  const navigate = React.useCallback(
    (href: string) => {
      closeMenu();
      queueMicrotask(() => router.push(href));
    },
    [closeMenu, router],
  );

  // Show only 4 sub-categories in the nav bar — the rest are reachable via "All Categories"
  const topSubCategories = React.useMemo(() => subCategories.slice(0, 4), [subCategories]);
  const allCategoriesTitle = t("header.allCategories");

  if (isLoading) {
    return (
      <NavigationMenu viewport={!isMobile}>
        <NavigationMenuList className="flex w-full flex-nowrap overflow-hidden gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <NavigationMenuItem key={i}>
              <NavigationMenuTrigger>
                <Skeleton className="h-5 w-28" />
              </NavigationMenuTrigger>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  return (
    <NavigationMenu viewport={!isMobile} value={value} onValueChange={setValue}>
      <NavigationMenuList className="flex w-full flex-nowrap overflow-hidden items-center gap-0.5">
        {topSubCategories.map((sub) => {
          const hasChildren = Array.isArray(sub?.child_categories) && sub.child_categories.length > 0;
          const menuValue = `sub-${sub.id}`;
          const triggerHref = `/category/${encodeURIComponent(sub.name)}?subId=${sub.id}`;

          if (hasChildren) {
            const isOpen = value === menuValue;

            return (
              <NavigationMenuItem key={sub.id} value={menuValue}>
                <NavigationMenuTrigger
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isOpen) {
                      navigate(triggerHref);
                      return;
                    }

                    navigate(triggerHref);
                  }}
                >
                  {getLocalName(sub.name, sub.name_bd, language)}
                </NavigationMenuTrigger>

                <NavigationMenuContent className="min-h-124">
                  <SubCategoryPanel
                    title={getLocalName(sub.name, sub.name_bd, language)}
                    childrenItems={(sub.child_categories ?? []) as unknown as Array<{
                      id: number;
                      name: string;
                      name_bd?: string | null;
                      img_path?: string | null;
                      total_stock: number;
                    }>}
                    onNavigate={navigate}
                    language={language}
                  />
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={sub.id}>
              <button
                type="button"
                onClick={() => navigate(triggerHref)}
                className={cn(
                  "group cursor-pointer inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-normal transition-colors text-black",
                  "hover:text-accent-foreground focus:bg-none! focus:text-accent-foreground focus:outline-none",
                )}
              >
                {getLocalName(sub.name, sub.name_bd, language)}
              </button>
            </NavigationMenuItem>
          );
        })}

        {subCategories.length > 0 ? (
          <NavigationMenuItem className="ml-auto shrink-0" value="all">
            <NavigationMenuTrigger
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/category/all`);
              }}
            >
              {allCategoriesTitle}
            </NavigationMenuTrigger>

            <NavigationMenuContent className="min-h-124">
              <div className="p-3">
                <AllCategoriesPanel
                  title={allCategoriesTitle}
                  subCategories={subCategories as unknown as Array<{
                    id: number;
                    name: string;
                    name_bd?: string | null;
                    img_path?: string | null;
                    child_categories?: Array<{ id: number; name: string; name_bd?: string | null; img_path?: string | null, total_stock: number }>;
                  }>}
                  onNavigate={navigate}
                  language={language}
                />
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ) : null}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
