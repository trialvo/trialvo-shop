"use client";

import { useDebouncedSort } from "@/app/(public)/category/[slug]/CategoryClient";
import FavoritesHeader from "@/components/account/favorites/FavoritesHeader";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { SortValue } from "@/components/catalog/types";
import type { QuickAddProduct } from "@/components/modals/quick-add/quickAdd.types";
import ProductCard from "@/components/product/ProductCard";
import { useFavorite } from "@/hooks/useFavorite";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductDetail, ProductListParams } from "@/lib/api/product/service";
import { getLocalName } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import AccountLayout from "../AccountLayout";
import AccountSidebar from "../AccountSidebar";
import FavoritesClientSkeleton from "./FavoritesClientSkeleton";

const FavoritesClient: React.FC = () => {
  const [sort, setSort] = React.useState<SortValue>("date_desc");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, language } = useTranslation();

  const debouncedSort = useDebouncedSort(sort, 300);

  const queryParams: ProductListParams = React.useMemo(() => {
    return {
      sort_by: debouncedSort.sort_by,
      sort_order: debouncedSort.sort_order,
      featured: debouncedSort.featured,
      status: true,
    };
  }, [debouncedSort]);

  const { products, productsLoading } = useProduct(queryParams);
  const { toggleFavorite, isAuthenticated } = useFavorite();

  const favoriteProducts = React.useMemo(() => {
    const list = (products ?? []).filter((p) => p?.is_favourite === true);
    return list;
  }, [products]);

  const handleOpenQuickAdd = (p: (typeof products)[number]) => {
    const firstVar = p?.variations?.[0];
    const productPayload: QuickAddProduct = {
      id: String(p.id),
      title: p?.name ?? "",
      price: firstVar?.selling_price ?? 0,
      oldPrice: firstVar?.buying_price ?? 0,
      images: p?.images ?? [],
      stock: firstVar?.stock ?? 0,
      sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const,
      colors: ["Red", "White", "Blue", "Yellow", "Green", "Black"] as const,
    };
    dispatch(
      openModal({
        key: "quickAdd",
        payload: {
          product: productPayload,
          viewDetailsHref: `/products/${p?.slug}/${p?.id}`,
          shopNowHref: "/checkout",
        },
      }),
    );
  };

  const handleFavoriteClick = React.useCallback(
    (p: ProductDetail) => {
      if (!isAuthenticated) {
        router.push("/sign-in/");
        return;
      }
      const productId = Number(p.id);
      if (!Number.isFinite(productId) || productId <= 0) return;
      if (p?.is_favourite === true) {
        toggleFavorite.mutate(productId);
      }
    },
    [isAuthenticated, router, toggleFavorite],
  );

  return (
    <section className="container mx-auto px-3 pb-10 pt-11 min-[768px]:px-0 min-[768px]:pb-14 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.favorites.title") },
        ]}
      />

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="favorite-list" />}>
          {productsLoading ? (
            <FavoritesClientSkeleton />
          ) : (
            <div className="space-y-4">
              <FavoritesHeader
                value={sort}
                onChange={setSort}
                count={favoriteProducts.length}
              />

              {favoriteProducts.length === 0 ? (
                <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white">
                  <div className="flex flex-col items-center px-6 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black/[0.03]">
                      <Heart className="h-6 w-6 text-black/25" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-black">
                      {t("account.favorites.noFavorites")}
                    </p>
                    <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-black/50">
                      Save items you love and find them here later.
                    </p>
                    <Link
                      href="/"
                      className="mt-5 inline-flex items-center rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-black/85"
                    >
                      Start Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white p-3 min-[768px]:p-4">
                  <div className="grid grid-cols-2 gap-3 gap-y-4 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
                    {favoriteProducts.map((product) => {
                      const firstImage =
                        product?.thumbnail ?? product?.images?.[0]?.path;
                      const discountArray = product?.variations?.filter(
                        (p) => p?.has_discount,
                      );
                      const defaultVariations = product?.variations[0];
                      const hasDiscount = discountArray?.length > 0;
                      const finalPrice = hasDiscount
                        ? discountArray[0]?.final_price
                        : defaultVariations?.final_price;
                      const sellingPrice = hasDiscount
                        ? discountArray[0]?.selling_price
                        : defaultVariations?.selling_price;

                      return (
                        <ProductCard
                          key={product?.id}
                          href={`/products/${product?.slug}/${product?.id}/`}
                          title={getLocalName(
                            product?.name ?? "",
                            product?.name_bd,
                            language,
                          )}
                          isFavorite={product?.is_favourite}
                          price={finalPrice ?? 0}
                          oldPrice={sellingPrice ?? 0}
                          imageSrc={firstImage}
                          onQuickAdd={() => handleOpenQuickAdd(product)}
                          onWishlist={() =>
                            handleFavoriteClick(
                              product as unknown as ProductDetail,
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </AccountLayout>
      </div>
    </section>
  );
};

export default FavoritesClient;
