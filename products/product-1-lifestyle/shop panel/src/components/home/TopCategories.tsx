"use client";

import SafeImage from "@/components/ui/SafeImage";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IMAGE_URL } from "@/config/env";
import {
  useCategory,
  type Category,
  type ChildCategory,
  type SubCategory,
} from "@/hooks/useCategory";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, type FC, type RefObject } from "react";

type ScrollDirection = -1 | 1;

interface TopSubCategory {
  id: SubCategory["id"];
  name: SubCategory["name"];
  subtitle: string;
  href: string;
  imageUrl?: string;
}

type SortableTopSubCategory = TopSubCategory & {
  featured: boolean;
  priority: number;
};

interface TopCategoriesHeaderProps {
  onScroll: (direction: ScrollDirection) => void;
}

interface SubCategoryRailProps {
  isLoading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  subCategories: ReadonlyArray<TopSubCategory>;
}

interface SubCategoryCardProps {
  subCategory: TopSubCategory;
}

const SCROLL_DISTANCE_PX = 220;
const SKELETON_CARD_COUNT = 8;

const TopCategories: FC = () => {
  const { categories, categoriesLoading } = useCategory();
  const scrollRef = useRef<HTMLDivElement>(null);

  const subCategories = useMemo<ReadonlyArray<TopSubCategory>>(
    () => buildTopSubCategories(categories),
    [categories]
  );

  const handleScroll = (direction: ScrollDirection): void => {
    scrollRef.current?.scrollBy({
      left: direction * SCROLL_DISTANCE_PX,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-background py-6 sm:py-8 lg:py-10">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        <TopCategoriesHeader onScroll={handleScroll} />

        <SubCategoryRail
          isLoading={categoriesLoading}
          scrollRef={scrollRef}
          subCategories={subCategories}
        />
      </div>
    </section>
  );
};

const TopCategoriesHeader: FC<TopCategoriesHeaderProps> = ({ onScroll }) => {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <div>
        <h2 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-wide text-foreground">
          Popular Categories
        </h2>
        <p className="text-muted-foreground text-[11px] sm:text-xs tracking-wide mt-0.5">
          Explore by department
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/shop"
          className="hidden sm:flex items-center gap-1 text-[11px] tracking-[0.15em] uppercase text-accent hover:text-accent/80 font-semibold transition-colors border border-accent/30 hover:border-accent/60 px-3 py-1.5 rounded-full hover:bg-accent/5"
        >
          All <ArrowRight size={10} />
        </Link>
        <button
          type="button"
          onClick={() => onScroll(-1)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-all cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft size={13} className="text-foreground/70" />
        </button>
        <button
          type="button"
          onClick={() => onScroll(1)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-all cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight size={13} className="text-foreground/70" />
        </button>
      </div>
    </div>
  );
};

const SubCategoryRail: FC<SubCategoryRailProps> = ({
  isLoading,
  scrollRef,
  subCategories,
}) => {
  if (isLoading) {
    return (
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        <TopCategorySkeletonList />
      </div>
    );
  }

  if (subCategories.length === 0) {
    return <EmptySubCategoryState />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {subCategories.map((subCategory) => (
          <SubCategoryCard key={subCategory.id} subCategory={subCategory} />
        ))}
      </div>
    </TooltipProvider>
  );
};

const TopCategorySkeletonList: FC = () => {
  return Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
    <div key={index} className="flex flex-col items-center gap-2 sm:gap-3 shrink-0">
      <Skeleton className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] lg:w-[104px] lg:h-[104px] rounded-full" />
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="hidden sm:block h-2.5 w-20" />
      </div>
    </div>
  ));
};

const SubCategoryCard: FC<SubCategoryCardProps> = ({ subCategory }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={subCategory.href}
          className="flex flex-col items-center gap-2 sm:gap-3 shrink-0 group cursor-pointer"
        >
          <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] lg:w-[104px] lg:h-[104px] rounded-full overflow-hidden border-2 border-border group-hover:border-accent transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:shadow-accent/10">
            <SafeImage
              src={subCategory.imageUrl}
              alt={subCategory.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400"
            />
          </div>
          <div className="text-center w-[72px] sm:w-[88px] lg:w-[104px]">
            <p className="text-[11px] sm:text-[12px] lg:text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors tracking-wide leading-tight truncate">
              {subCategory.name}
            </p>
            <p className="hidden sm:block text-[10px] text-muted-foreground tracking-wide mt-0.5 leading-tight truncate">
              {subCategory.subtitle}
            </p>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={8}
        className="max-w-[220px] rounded-lg border border-border/70 bg-popover/95 px-3 py-2 text-center text-xs font-medium leading-snug text-popover-foreground shadow-xl shadow-foreground/10 backdrop-blur-sm"
      >
        {subCategory.name}
      </TooltipContent>
    </Tooltip>
  );
};

const EmptySubCategoryState: FC = () => {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">No subcategories available</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Add active subcategories to show them here.
      </p>
    </div>
  );
};

function buildTopSubCategories(categories: ReadonlyArray<Category>): TopSubCategory[] {
  return categories
    .flatMap((category) =>
      getVisibleSubCategories(category).map<SortableTopSubCategory>((subCategory) => ({
        id: subCategory.id,
        name: subCategory.name,
        subtitle: getSubCategorySubtitle(subCategory, category.name),
        href: getSubCategoryHref(subCategory),
        imageUrl: getCategoryImageUrl(subCategory.image ?? subCategory.img_path),
        featured: Boolean(subCategory.featured),
        priority: subCategory.priority ?? Number.MAX_SAFE_INTEGER,
      }))
    )
    .sort((left, right) => {
      if (left.featured !== right.featured) return left.featured ? -1 : 1;
      if (left.priority !== right.priority) return left.priority - right.priority;
      return left.name.localeCompare(right.name);
    })
    .map(({ featured, priority, ...subCategory }) => subCategory);
}

function getVisibleSubCategories(category: Category): SubCategory[] {
  return (category.children ?? category.sub_categories ?? []).filter(
    (subCategory) => subCategory.status
  );
}

function getSubCategorySubtitle(subCategory: SubCategory, parentCategoryName: string): string {
  const visibleChildCategories = getVisibleChildCategories(subCategory);
  const childNames = visibleChildCategories
    .slice(0, 2)
    .map((childCategory) => childCategory.name);

  if (childNames.length === 0) return parentCategoryName;
  if (childNames.length === 1) return childNames[0];

  const hasMoreChildren = visibleChildCategories.length > childNames.length;
  return `${childNames.join(", ")}${hasMoreChildren ? " & more" : ""}`;
}

function getVisibleChildCategories(subCategory: SubCategory): ChildCategory[] {
  return (subCategory.children ?? subCategory.child_categories ?? []).filter(
    (childCategory) => childCategory.status
  );
}

function getSubCategoryHref(subCategory: Pick<SubCategory, "id">): string {
  return `/shop?sub_category=${subCategory.id}`;
}

function getCategoryImageUrl(imagePath: string | null | undefined): string | undefined {
  if (!hasImagePath(imagePath)) return undefined;
  const normalizedImagePath = imagePath.trim();

  if (/^https?:\/\//i.test(normalizedImagePath)) return normalizedImagePath;

  return `${IMAGE_URL}${normalizedImagePath.startsWith("/") ? "" : "/"}${normalizedImagePath}`;
}

function hasImagePath(imagePath: string | null | undefined): imagePath is string {
  return typeof imagePath === "string" && imagePath.trim().length > 0;
}

export default TopCategories;
