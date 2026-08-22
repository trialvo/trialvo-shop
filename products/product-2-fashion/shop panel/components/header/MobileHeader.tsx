"use client";

import HeaderAction from "@/components/header/HeaderAction";
import { useAuth } from "@/hooks/useAuth";
import { useCategory } from "@/hooks/useCategory";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import AuthCookies from "@/lib/auth/cookies";
import { cn, toPublicUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCartCounts } from "@/redux/selectors/cartSelectors";
import { setError } from "@/redux/slices/authSlice";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { setSearchOpen, toggleSearchOpen } from "@/redux/slices/uiSlice";
import { useRouter } from "next/navigation";
import React from "react";
import { HiOutlineMenu } from "react-icons/hi";
import HeaderLogo from "./HeaderLogo";
import SearchPopup from "./SearchPopup";

import type { ProductSearchSuggestion } from "@/components/header-search/SearchField";
import { setIsCartOpen } from "@/redux/slices/cartSlice";
import type { Product } from "./header.types";

type Props = {
  className?: string;
};

type SubCategory = {
  id: number;
  name: string;
  img_path?: string | null;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function toNumberOrZero(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractPriceInfo(product: Product): { price: number } {
  const priceDirect = toNumberOrZero(product?.price_range?.min);
  if (priceDirect > 0) return { price: priceDirect };
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

const MobileHeader: React.FC<Props> = ({ className }) => {
  const dispatch = useAppDispatch();
  const counts = useAppSelector(selectCartCounts);
  const router = useRouter();

  const { isAuthenticated, user, isLoading } = useAuth();
  const [localAuthed, setLocalAuthed] = React.useState<boolean>(isAuthenticated);
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
          image: c.img_path ? toPublicUrl(c.img_path) : null,
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
          isFavourite: p.is_favourite === true,
        };

        return mapped;
      })
      .filter((x): x is ProductSearchSuggestion => x !== null);
  }, [products]);


  const logout = () => {
    AuthCookies.clearAll();

    if (typeof window !== "undefined") {
      localStorage.removeItem("registrationEmail");
      localStorage.removeItem("otp_resend_until");
      localStorage.removeItem("Email");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("phone_number");
    }

    router?.refresh();
    dispatch(setError("You have been logged out successfully!"));
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full bg-background shadow-[0px_0px_20px_rgba(0,0,0,0.06)]",
          "h-11 min-[576px]:h-12",
          className,
        )}
      >
        <div className="relative mx-auto flex h-full items-center justify-between px-3 min-[576px]:px-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => {
              dispatch(setSearchOpen(false));
              dispatch(openDrawer({ key: "menu" }));
            }}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors duration-200 hover:bg-black/[0.06] min-[576px]:h-10 min-[576px]:w-10"
          >
            <HiOutlineMenu className="h-6 w-6 text-black min-[576px]:h-7 min-[576px]:w-7" />
          </button>

          {/* Logo — absolutely centered so it's always in the middle
              regardless of the widths of the left/right elements */}
          <div className="absolute left-1/2 -translate-x-1/2 overflow-hidden">
            <HeaderLogo
              src="/logo-small.svg"
              alt="Guide Ease"
              width={110}
              height={30}
              className="h-6 w-auto min-[576px]:h-7.5 min-[576px]:w-27.5"
            />
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

      {/* Spacer so content clears the fixed mobile header */}
      <div className="h-11 min-[576px]:h-12" aria-hidden />

      <SearchPopup
        viewport="mobile"
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

export default MobileHeader;
