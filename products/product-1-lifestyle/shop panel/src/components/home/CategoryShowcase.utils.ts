import { IMAGE_URL } from "@/config/env";
import type { Category, ChildCategory, SubCategory } from "@/hooks/useCategory";

export type CategoryShowcaseSize = "large" | "small" | "wide";

export interface CategoryShowcaseSlot {
  readonly image: string;
  readonly title: string;
  readonly subtitle: string;
  readonly desktopSpan: string;
  readonly size: CategoryShowcaseSize;
  readonly href: string;
  readonly matchNames: ReadonlyArray<string>;
}

export interface CategoryShowcaseItem {
  readonly image: string;
  readonly title: string;
  readonly subtitle: string;
  readonly desktopSpan: string;
  readonly size: CategoryShowcaseSize;
  readonly href: string;
}

type CategoryCandidateKind = "category" | "subCategory";

interface CategoryCandidate {
  readonly key: string;
  readonly kind: CategoryCandidateKind;
  readonly name: string;
  readonly subtitle: string;
  readonly href: string;
  readonly image?: string;
  readonly normalizedNames: ReadonlyArray<string>;
  readonly featured: boolean;
  readonly priority: number;
}

export const CATEGORY_SHOWCASE_SLOTS = [
  {
    image: "/images/categories/cat-grid-men.jpg",
    title: "Men's Fashion",
    subtitle: "Suits, casuals & more",
    desktopSpan: "md:col-span-2 md:row-span-2",
    size: "large",
    href: "/shop?category=Men",
    matchNames: ["Men", "Men's Fashion", "Mens Fashion"],
  },
  {
    image: "/images/categories/cat-grid-women.jpg",
    title: "Women's Fashion",
    subtitle: "Dresses, abayas & tops",
    desktopSpan: "md:col-span-1 md:row-span-1",
    size: "small",
    href: "/shop?category=Women",
    matchNames: ["Women", "Women's Fashion", "Womens Fashion"],
  },
  {
    image: "/images/categories/cat-grid-accessories.jpg",
    title: "Accessories",
    subtitle: "Watches, bags & wallets",
    desktopSpan: "md:col-span-1 md:row-span-1",
    size: "small",
    href: "/shop?category=Accessories",
    matchNames: ["Accessories"],
  },
  {
    image: "/images/categories/cat-grid-kids.jpg",
    title: "Kids' Collection",
    subtitle: "Fun styles for little ones",
    desktopSpan: "md:col-span-2 md:row-span-1",
    size: "wide",
    href: "/shop?category=Kids",
    matchNames: ["Kids", "Kid", "Kids Collection", "Kids' Collection"],
  },
] as const satisfies ReadonlyArray<CategoryShowcaseSlot>;

export function buildCategoryShowcaseItems(
  categories: ReadonlyArray<Category>
): CategoryShowcaseItem[] {
  const candidates = buildCategoryCandidates(categories);
  const usedCandidateKeys = new Set<string>();

  return CATEGORY_SHOWCASE_SLOTS.map((slot) => {
    const candidate =
      findMatchingCandidate(slot, candidates, usedCandidateKeys) ??
      findNextCandidate(candidates, usedCandidateKeys);

    if (!candidate) return buildFallbackItem(slot);

    usedCandidateKeys.add(candidate.key);
    return buildCandidateItem(slot, candidate);
  });
}

function buildCategoryCandidates(categories: ReadonlyArray<Category>): CategoryCandidate[] {
  return categories
    .filter((category) => category.status)
    .flatMap((category) => [
      buildMainCategoryCandidate(category),
      ...getVisibleSubCategories(category).map((subCategory) =>
        buildSubCategoryCandidate(category, subCategory)
      ),
    ])
    .sort(compareCategoryCandidates);
}

function buildMainCategoryCandidate(category: Category): CategoryCandidate {
  return {
    key: `category-${category.id}`,
    kind: "category",
    name: category.name,
    subtitle: getMainCategorySubtitle(category),
    href: getMainCategoryHref(category),
    image: getCategoryImageUrl(category.image ?? category.img_path),
    normalizedNames: [normalizeCategoryName(category.name)],
    featured: Boolean(category.featured),
    priority: category.priority ?? Number.MAX_SAFE_INTEGER,
  };
}

function buildSubCategoryCandidate(
  parentCategory: Category,
  subCategory: SubCategory
): CategoryCandidate {
  return {
    key: `sub-category-${subCategory.id}`,
    kind: "subCategory",
    name: subCategory.name,
    subtitle: getSubCategorySubtitle(subCategory, parentCategory.name),
    href: getSubCategoryHref(subCategory),
    image: getCategoryImageUrl(subCategory.image ?? subCategory.img_path),
    normalizedNames: [normalizeCategoryName(subCategory.name)],
    featured: Boolean(subCategory.featured),
    priority: subCategory.priority ?? Number.MAX_SAFE_INTEGER,
  };
}

function findMatchingCandidate(
  slot: CategoryShowcaseSlot,
  candidates: ReadonlyArray<CategoryCandidate>,
  usedCandidateKeys: ReadonlySet<string>
): CategoryCandidate | undefined {
  const slotNames = new Set(slot.matchNames.map(normalizeCategoryName));

  const hasMatchingName = (candidate: CategoryCandidate): boolean =>
    candidate.normalizedNames.some((name) => slotNames.has(name));

  return (
    candidates.find(
      (candidate) =>
        candidate.kind === "category" &&
        !usedCandidateKeys.has(candidate.key) &&
        hasMatchingName(candidate)
    ) ??
    candidates.find(
      (candidate) =>
        candidate.kind === "subCategory" &&
        !usedCandidateKeys.has(candidate.key) &&
        hasMatchingName(candidate)
    )
  );
}

function findNextCandidate(
  candidates: ReadonlyArray<CategoryCandidate>,
  usedCandidateKeys: ReadonlySet<string>
): CategoryCandidate | undefined {
  return candidates.find((candidate) => !usedCandidateKeys.has(candidate.key));
}

function buildCandidateItem(
  slot: CategoryShowcaseSlot,
  candidate: CategoryCandidate
): CategoryShowcaseItem {
  return {
    image: candidate.image ?? slot.image,
    title: candidate.name,
    subtitle: candidate.subtitle || slot.subtitle,
    desktopSpan: slot.desktopSpan,
    size: slot.size,
    href: candidate.href,
  };
}

function buildFallbackItem(slot: CategoryShowcaseSlot): CategoryShowcaseItem {
  return {
    image: slot.image,
    title: slot.title,
    subtitle: slot.subtitle,
    desktopSpan: slot.desktopSpan,
    size: slot.size,
    href: slot.href,
  };
}

function compareCategoryCandidates(
  left: CategoryCandidate,
  right: CategoryCandidate
): number {
  if (left.featured !== right.featured) return left.featured ? -1 : 1;
  if (left.priority !== right.priority) return left.priority - right.priority;
  if (left.kind !== right.kind) return left.kind === "category" ? -1 : 1;
  return left.name.localeCompare(right.name);
}

function getMainCategorySubtitle(category: Category): string {
  const subCategoryNames = getVisibleSubCategories(category)
    .slice(0, 2)
    .map((subCategory) => subCategory.name);

  if (subCategoryNames.length === 0) return "";
  if (subCategoryNames.length === 1) return subCategoryNames[0];

  const hasMoreSubCategories = getVisibleSubCategories(category).length > subCategoryNames.length;
  return `${subCategoryNames.join(", ")}${hasMoreSubCategories ? " & more" : ""}`;
}

function getSubCategorySubtitle(subCategory: SubCategory, parentCategoryName: string): string {
  const childCategoryNames = getVisibleChildCategories(subCategory)
    .slice(0, 2)
    .map((childCategory) => childCategory.name);

  if (childCategoryNames.length === 0) return parentCategoryName;
  if (childCategoryNames.length === 1) return childCategoryNames[0];

  const hasMoreChildCategories =
    getVisibleChildCategories(subCategory).length > childCategoryNames.length;
  return `${childCategoryNames.join(", ")}${hasMoreChildCategories ? " & more" : ""}`;
}

function getVisibleSubCategories(category: Category): SubCategory[] {
  return (category.children ?? category.sub_categories ?? []).filter(
    (subCategory) => subCategory.status
  );
}

function getVisibleChildCategories(subCategory: SubCategory): ChildCategory[] {
  return (subCategory.children ?? subCategory.child_categories ?? []).filter(
    (childCategory) => childCategory.status
  );
}

function getMainCategoryHref(category: Pick<Category, "name">): string {
  return `/shop?category=${encodeURIComponent(category.name)}`;
}

function getSubCategoryHref(subCategory: Pick<SubCategory, "id">): string {
  return `/shop?sub_category=${subCategory.id}`;
}

function getCategoryImageUrl(imagePath: string | null | undefined): string | undefined {
  if (!hasImagePath(imagePath)) return undefined;
  const normalizedImagePath = imagePath.trim();

  if (/^(https?:|data:)/i.test(normalizedImagePath)) return normalizedImagePath;

  return `${IMAGE_URL}${normalizedImagePath.startsWith("/") ? "" : "/"}${normalizedImagePath}`;
}

function hasImagePath(imagePath: string | null | undefined): imagePath is string {
  return typeof imagePath === "string" && imagePath.trim().length > 0;
}

function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll('&', "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
