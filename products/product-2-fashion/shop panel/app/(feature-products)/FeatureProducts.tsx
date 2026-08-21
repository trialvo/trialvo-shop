"use client";

import HomeProductCarousel from "@/components/home/HomeProductCarousel";
import MensOutfitIdeas from "@/components/home/MensOutfitIdeas";
import { useCategory } from "@/hooks/useCategory";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import type { SubCategory } from "@/lib/api/category/service";
import * as React from "react";

function matchSubCategory(
  subs: SubCategory[],
  kind: "men" | "kids",
): SubCategory | undefined {
  const list = Array.isArray(subs) ? subs : [];
  return list.find((sub) => {
    const name = `${sub.name ?? ""} ${sub.name_bd ?? ""}`.toLowerCase();
    if (kind === "men") {
      return (/\bmen\b/.test(name) || name.includes("পুরুষ")) && !/\bwom[ae]n/.test(name);
    }
    return /\bkids?\b/.test(name) || name.includes("children") || name.includes("শিশু");
  });
}

const FeatureProducts: React.FC = () => {
  const { t } = useTranslation();
  const { subCategories } = useCategory();

  const menSub = React.useMemo(
    () => matchSubCategory(subCategories, "men"),
    [subCategories],
  );
  const kidsSub = React.useMemo(
    () => matchSubCategory(subCategories, "kids"),
    [subCategories],
  );

  const bestSellers = useProduct({
    limit: 12,
    offset: 0,
    sort_by: "sell_count",
    sort_order: "DESC",
  });
  const mens = useProduct(
    { limit: 12, offset: 0, sub_category_id: menSub?.id },
    { enabled: Boolean(menSub?.id) },
  );
  const kids = useProduct(
    { limit: 12, offset: 0, sub_category_id: kidsSub?.id },
    { enabled: Boolean(kidsSub?.id) },
  );
  const featured = useProduct({ limit: 12, offset: 0, featured: true });

  const menHref = menSub
    ? `/category/${encodeURIComponent(menSub.name)}?subId=${menSub.id}`
    : "/category/all";
  const kidsHref = kidsSub
    ? `/category/${encodeURIComponent(kidsSub.name)}?subId=${kidsSub.id}`
    : "/category/all";

  return (
    <div className="mb-15.5 space-y-14 pt-14 min-[768px]:space-y-20 min-[768px]:pt-20">
      <HomeProductCarousel
        eyebrow={t("home.productRails.bestSellers.eyebrow")}
        title={t("home.productRails.bestSellers.title")}
        shopAllHref="/category/all-products"
        products={bestSellers.products}
        isLoading={bestSellers.productsLoading}
      />
      <MensOutfitIdeas />
      <HomeProductCarousel
        eyebrow={t("home.productRails.mens.eyebrow")}
        title={t("home.productRails.mens.title")}
        shopAllHref={menHref}
        products={mens.products}
        isLoading={Boolean(menSub?.id) && mens.productsLoading}
      />
      <HomeProductCarousel
        eyebrow={t("home.productRails.kids.eyebrow")}
        title={t("home.productRails.kids.title")}
        shopAllHref={kidsHref}
        products={kids.products}
        isLoading={Boolean(kidsSub?.id) && kids.productsLoading}
      />
      <HomeProductCarousel
        eyebrow={t("home.productRails.featured.eyebrow")}
        title={t("home.productRails.featured.title")}
        shopAllHref="/category/feature-products"
        products={featured.products}
        isLoading={featured.productsLoading}
      />
    </div>
  );
};

export default FeatureProducts;
