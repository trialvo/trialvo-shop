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

type ChildCategoryItem = {
  id: number;
  name: string;
  name_bd?: string | null;
  img_path?: string | null;
  total_stock?: number;
};

type SubCategoryItem = {
  id: number;
  name: string;
  name_bd?: string | null;
  img_path?: string | null;
  child_categories?: ChildCategoryItem[];
};

type MegaLinkItem = {
  id: string;
  label: string;
  href: string;
};

type MegaColumn = {
  id: string;
  heading: string;
  headingHref?: string;
  links: MegaLinkItem[];
};

type MegaFeature = {
  id: string;
  title: string;
  href: string;
  imageSrc?: string | null;
};

function chunkItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const columns: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    columns.push(items.slice(i, i + size));
  }
  return columns;
}

function MegaLink({
  label,
  onClick,
  emphasized,
}: Readonly<{
  label: string;
  onClick: () => void;
  emphasized?: boolean;
}>): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full py-[3px] text-left text-[12px] leading-[22px] tracking-[0.01em] transition-colors cursor-pointer",
        emphasized ? "font-bold text-black" : "font-normal text-[#191919]",
        "hover:underline hover:underline-offset-2",
      )}
    >
      {label}
    </button>
  );
}

function FeaturedCard({
  title,
  imageSrc,
  onClick,
}: Readonly<{
  title: string;
  imageSrc?: string | null;
  onClick: () => void;
}>): React.ReactElement {
  const src =
    typeof imageSrc === "string" && imageSrc.trim().length > 0
      ? toPublicUrl(imageSrc)
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-[200px] shrink-0 cursor-pointer text-left"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f4f4f4]">
        {src ? (
          <ImageWithFallback
            src={src}
            alt={title}
            fill
            sizes="200px"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            preload={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-7 w-7 text-black/25" />
          </div>
        )}
      </div>
      <span className="mt-2.5 block text-[12px] font-medium leading-5 text-black group-hover:underline group-hover:underline-offset-2">
        {title}
      </span>
    </button>
  );
}

function CategoryImageCard({
  title,
  imageSrc,
  onClick,
}: Readonly<{
  title: string;
  imageSrc?: string | null;
  onClick: () => void;
}>): React.ReactElement {
  const src =
    typeof imageSrc === "string" && imageSrc.trim().length > 0
      ? toPublicUrl(imageSrc)
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer flex-col text-left"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#f6f6f6]">
        {src ? (
          <ImageWithFallback
            src={src}
            alt={title}
            fill
            sizes="140px"
            className="object-cover object-center transition-transform duration-400 ease-out group-hover:scale-[1.05]"
            preload={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-6 w-6 text-black/25" />
          </div>
        )}
      </div>
      <span className="mt-2 block text-[12px] font-medium leading-4 text-black line-clamp-2 group-hover:underline group-hover:underline-offset-2">
        {title}
      </span>
    </button>
  );
}

function EmptyState({
  title,
  subtitle,
}: Readonly<{
  title: string;
  subtitle?: string;
}>): React.ReactElement {
  return (
    <div className="flex min-h-40 w-full flex-col justify-center px-10 py-10">
      <p className="text-[12px] font-bold text-black">{title}</p>
      {subtitle ? <p className="mt-1 text-[12px] font-normal text-black/45">{subtitle}</p> : null}
    </div>
  );
}

function MegaLayout({
  columns,
  features,
  onNavigate,
}: Readonly<{
  columns: MegaColumn[];
  features: MegaFeature[];
  onNavigate: (href: string) => void;
}>): React.ReactElement {
  const textColumns = [...columns].slice(0, 4);
  while (textColumns.length < 4) {
    textColumns.push({ id: `empty-${textColumns.length}`, heading: "", links: [] });
  }
  const featureCards = [...features].slice(0, 2);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] items-start px-4 py-6 min-[768px]:px-6 min-[768px]:py-8 min-[992px]:px-8 min-[992px]:py-9 min-[1200px]:px-10 min-[1200px]:py-10">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 min-[768px]:grid-cols-3 min-[768px]:gap-x-6 min-[992px]:grid-cols-4 min-[992px]:gap-x-8 min-[1200px]:gap-x-10">
        {textColumns.map((column) => (
          <div key={column.id} className="min-w-0">
            {column.heading ? (
              column.headingHref ? (
                <MegaLink
                  label={column.heading}
                  emphasized
                  onClick={() => onNavigate(column.headingHref!)}
                />
              ) : (
                <p className="py-[3px] text-[12px] font-bold leading-[22px] text-black">
                  {column.heading}
                </p>
              )
            ) : (
              <p className="select-none py-[3px] text-[12px] font-bold leading-[22px] text-transparent">.</p>
            )}
            <div className={column.headingHref ? "mt-1" : ""}>
              {column.links.map((link) => (
                <MegaLink
                  key={link.id}
                  label={link.label}
                  onClick={() => onNavigate(link.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {featureCards.length > 0 ? (
        <div className="ml-6 hidden shrink-0 gap-4 min-[992px]:ml-10 min-[992px]:flex min-[1200px]:ml-12 min-[1200px]:gap-5">
          {featureCards.map((item) => (
            <FeaturedCard
              key={item.id}
              title={item.title}
              imageSrc={item.imageSrc}
              onClick={() => onNavigate(item.href)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SubCategoryPanel({
  title,
  shopAllHref,
  childrenItems,
  onNavigate,
  language,
}: Readonly<{
  title: string;
  shopAllHref: string;
  childrenItems: ChildCategoryItem[];
  onNavigate: (href: string) => void;
  language: string | null;
}>): React.ReactElement {
  if (!childrenItems.length) {
    return <EmptyState title="No child categories found" subtitle="We'll add items here soon." />;
  }

  const childColumns = chunkItems(childrenItems, 7).slice(0, 3);
  const columns: MegaColumn[] = [
    {
      id: "shop-all",
      heading: "Shop All",
      links: [{ id: "shop-all-link", label: `Shop All ${title}`, href: shopAllHref }],
    },
    ...childColumns.map((column, index) => ({
      id: `children-${column[0]?.id ?? index}`,
      heading: index === 0 ? title : "",
      links: column.map((child) => ({
        id: String(child.id),
        label: getLocalName(child.name, child.name_bd, language),
        href: `/category/${encodeURIComponent(child.name)}?childId=${child.id}`,
      })),
    })),
  ];

  const features: MegaFeature[] = childrenItems.slice(0, 2).map((child) => ({
    id: `feat-${child.id}`,
    title: getLocalName(child.name, child.name_bd, language),
    href: `/category/${encodeURIComponent(child.name)}?childId=${child.id}`,
    imageSrc: child.img_path,
  }));

  return <MegaLayout columns={columns} features={features} onNavigate={onNavigate} />;
}

function AllCategoriesPanel({
  title,
  shopAllHref,
  subCategories,
  onNavigate,
  language,
}: Readonly<{
  title: string;
  shopAllHref: string;
  subCategories: SubCategoryItem[];
  onNavigate: (href: string) => void;
  language: string | null;
}>): React.ReactElement {
  if (!subCategories.length) {
    return <EmptyState title="No categories found" subtitle="We'll add categories here soon." />;
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-10 py-10">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div>
          <p className="text-[12px] font-bold tracking-[0.01em] text-black">{title}</p>
          <p className="mt-1 text-[12px] text-black/45">Browse every category</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(shopAllHref)}
          className="cursor-pointer text-[12px] font-medium text-black underline-offset-2 hover:underline"
        >
          Shop all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {subCategories.map((sub) => (
          <CategoryImageCard
            key={sub.id}
            title={getLocalName(sub.name, sub.name_bd, language)}
            imageSrc={sub.img_path}
            onClick={() =>
              onNavigate(`/category/${encodeURIComponent(sub.name)}?subId=${sub.id}`)
            }
          />
        ))}
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

  const topSubCategories = React.useMemo(() => subCategories.slice(0, 4), [subCategories]);
  const allCategoriesTitle = t("header.allCategories");

  if (isLoading) {
    return (
      <NavigationMenu viewport={!isMobile}>
        <NavigationMenuList className="flex w-full flex-nowrap items-center gap-0.5 overflow-hidden">
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
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeMenu}
        className={cn(
          "fixed inset-x-0 bottom-0 top-[var(--shop-header-offset,9.25rem)] z-40 cursor-default bg-black/25 transition-opacity duration-300",
          value ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <NavigationMenu
        delayDuration={60}
        skipDelayDuration={60}
        viewport={!isMobile}
        value={value}
        onValueChange={setValue}
      >
        <NavigationMenuList className="flex w-full flex-nowrap items-center gap-0.5 overflow-hidden">
          {topSubCategories.map((sub) => {
            const hasChildren =
              Array.isArray(sub?.child_categories) && sub.child_categories.length > 0;
            const menuValue = `sub-${sub.id}`;
            const triggerHref = `/category/${encodeURIComponent(sub.name)}?subId=${sub.id}`;

            if (hasChildren) {
              const isOpen = value === menuValue;

              return (
                <NavigationMenuItem key={sub.id} value={menuValue}>
                  <NavigationMenuTrigger
                    onClick={(e) => {
                      if (!isOpen) return;
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(triggerHref);
                    }}
                  >
                    {getLocalName(sub.name, sub.name_bd, language)}
                  </NavigationMenuTrigger>

                  <NavigationMenuContent>
                    <SubCategoryPanel
                      title={getLocalName(sub.name, sub.name_bd, language)}
                      shopAllHref={triggerHref}
                      childrenItems={(sub.child_categories ?? []) as ChildCategoryItem[]}
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
                    "group inline-flex h-9 w-max cursor-pointer items-center justify-center rounded-none bg-transparent px-2.5 py-2 text-[12px] font-normal tracking-[0.01em] text-black transition-colors",
                    "hover:underline hover:underline-offset-[6px] focus:outline-none",
                  )}
                >
                  {getLocalName(sub.name, sub.name_bd, language)}
                </button>
              </NavigationMenuItem>
            );
          })}

          {subCategories.length > 0 ? (
            <NavigationMenuItem className="shrink-0" value="all">
              <NavigationMenuTrigger
                onClick={(e) => {
                  if (value !== "all") return;
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/category/all`);
                }}
              >
                {allCategoriesTitle}
              </NavigationMenuTrigger>

              <NavigationMenuContent>
                <AllCategoriesPanel
                  title={allCategoriesTitle}
                  shopAllHref="/category/all"
                  subCategories={subCategories as SubCategoryItem[]}
                  onNavigate={navigate}
                  language={language}
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : null}
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}
