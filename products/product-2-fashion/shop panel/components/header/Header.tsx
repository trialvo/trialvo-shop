"use client";

import HeaderAction from "@/components/header/HeaderAction";
import HeaderLogo from "@/components/header/HeaderLogo";
import NavigationMenuMain from "@/components/navigation/navigation-menu";
import * as React from "react";

import type { ProductSearchSuggestion } from "@/components/header-search/SearchField";
import { useAuth } from "@/hooks/useAuth";
import { useCategory } from "@/hooks/useCategory";
import { useLogout } from "@/hooks/useLogout";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import { toPublicUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCartCounts } from "@/redux/selectors/cartSelectors";
import { setIsCartOpen } from "@/redux/slices/cartSlice";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { setSearchOpen, toggleSearchOpen } from "@/redux/slices/uiSlice";
import { useRouter } from "next/navigation";
import { Product } from "./header.types";
import SearchPopup from "./SearchPopup";

type SubCategory = {
  id: number;
  name: string;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function toNumberOrZero(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractPriceInfo(product: Product): {
  price: number;
} {
  const priceDirect =
    toNumberOrZero(product?.price_range?.min);

  if (priceDirect > 0) {
    return { price: priceDirect };
  }

  return { price: 0 };
}

function parseSubCategoryId(value: string): number | undefined {
  if (!value || value === "all") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const counts = useAppSelector(selectCartCounts);
  const router = useRouter();

  const { isAuthenticated, user, isLoading } = useAuth();
  const [localAuthed, setLocalAuthed] = React.useState<boolean>(isAuthenticated);

  const logout = useLogout();
  const { t } = useTranslation();

  React.useEffect(() => {
    setLocalAuthed(isAuthenticated);
  }, [isAuthenticated]);

  const searchOpen = useAppSelector((state) => state.ui.searchOpen);

  const [category, setCategory] = React.useState<string>("all");
  const [query, setQuery] = React.useState<string>("");

  const debouncedQuery = useDebouncedValue(query, 250);

  const selectedSubCategoryId = React.useMemo(() => parseSubCategoryId(category), [category]);

  const { subCategories, subCategoriesLoading } = useCategory() as {
    subCategories: SubCategory[];
    subCategoriesLoading: boolean;
  };

  const apiCategories = React.useMemo(() => {
    const base = [{ value: "all", label: "Choose Categories" }];

    const list = Array.isArray(subCategories)
      ? subCategories
        .map((c) => ({
          value: String(c.id),
          label: c.name,
        }))
        .filter((c) => c.value && c.label)
      : [];

    return [...base, ...list];
  }, [subCategories]);

  const { products, productsLoading } = useProduct(
    {
      limit: 6,
      offset: 0,
      search: debouncedQuery.trim(),
      sub_category_id: selectedSubCategoryId,
    },
    { enabled: searchOpen },
  ) as {
    products: Product[];
    productsLoading: boolean;
  };

  const suggestions: ProductSearchSuggestion[] = React.useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products
      .map((p) => {
        const id = p.id != null ? String(p.id) : "";
        const name = String(p.name ?? p.title ?? "").trim();
        if (!id || !name) return null;

        const { price } = extractPriceInfo(p);

        const rawImg =
          (Array.isArray(p?.images) &&
            p.images.length > 0 &&
            typeof p.images[0]?.path === "string" &&
            p.images[0].path.trim().length > 0
            ? p.images[0].path
            : null) ??
          (typeof p.thumbnail === "string" && p.thumbnail.trim().length > 0 ? p.thumbnail : null) ??
          (typeof p.img_path === "string" && p.img_path.trim().length > 0 ? p.img_path : null) ??
          (typeof p.image === "string" && p.image.trim().length > 0 ? p.image : null);

        const img = rawImg ? toPublicUrl(rawImg) : undefined;

        const slug = typeof p.slug === "string" && p.slug.trim().length > 0 ? p.slug : "product";
        const href = `/products/${encodeURIComponent(slug)}/${encodeURIComponent(id)}/`;

        const mapped: ProductSearchSuggestion = {
          id,
          name,
          image: img,
          price: isFiniteNumber(price) ? price : 0,
          href,
        };

        return mapped;
      })
      .filter((x): x is ProductSearchSuggestion => x !== null);
  }, [products]);

  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!searchOpen) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-search-panel]") || target.closest("[data-search-toggle]")) return;
      dispatch(setSearchOpen(false));
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [dispatch, searchOpen]);

  return (
    <>
      <header className="bg-background h-17.5 shadow-[0px_0px_20px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto flex justify-between h-full">
          <div className="flex h-17.5 items-center">
            <div className="overflow-hidden mr-8.25">
              <HeaderLogo
                src="/logo-default.svg"
                alt="Guide Ease"
                width={140}
                height={36}
                className="h-11.25! w-36.25!"
              />
            </div>

          <NavigationMenuMain />
          </div>

          <HeaderAction
            key={localAuthed ? "authed" : "guest"}
            userName={`${user?.first_name}  ${user?.last_name}`}
            firstName={user?.first_name}
            avatarSrc={toPublicUrl(user?.img_path) ?? ""}
            isAuthLoading={isLoading}
            isAuthenticated={localAuthed}
            searchOpen={searchOpen}
            cartCount={counts.itemsCount}
            onCartClick={() => {
              dispatch(setSearchOpen(false));
              dispatch(openDrawer({ key: "cart" }));
              dispatch(setIsCartOpen(true));
            }}
            onSearchClick={() => dispatch(toggleSearchOpen())}
            onLogout={() => {
              setLocalAuthed(false);
              logout();

              requestAnimationFrame(() => {
                router.push("/sign-in");
              });
            }}
          />
        </div>
      </header>

      <SearchPopup
        open={searchOpen}
        onClose={() => dispatch(setSearchOpen(false))}
        categories={subCategoriesLoading ? [{ value: "all", label: "Choose Categories" }] : apiCategories}
        suggestions={suggestions}
        isLoading={productsLoading}
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />
    </>
  );
};

export default Header;
