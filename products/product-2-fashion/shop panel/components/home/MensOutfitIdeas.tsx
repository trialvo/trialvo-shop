"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useCategory } from "@/hooks/useCategory";
import { useTranslation } from "@/hooks/useTranslation";
import type { ChildCategory, SubCategory } from "@/lib/api/category/service";
import { getLocalName, toPublicUrl } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";

function findMenSub(subs: SubCategory[]): SubCategory | undefined {
  return (Array.isArray(subs) ? subs : []).find((sub) => {
    const name = `${sub.name ?? ""} ${sub.name_bd ?? ""}`.toLowerCase();
    return (/\bmen\b/.test(name) || name.includes("পুরুষ")) && !/\bwom[ae]n/.test(name);
  });
}

function ideaLabel(name: string, t: (key: string) => string): string {
  const n = name.toLowerCase();
  if (/shirt|polo|tee|t-shirt|টপ|শার্ট/.test(n)) return t("home.mensOutfit.ideas.shirts");
  if (/pant|trouser|chino|jogger|cargo|প্যান্ট/.test(n)) return t("home.mensOutfit.ideas.trousers");
  if (/shoe|sneaker|loafer|boot|sandal|জুত/.test(n)) return t("home.mensOutfit.ideas.shoes");
  if (/jacket|blazer|coat|hoodie|sweater|জ্যাকেট/.test(n)) return t("home.mensOutfit.ideas.layers");
  if (/bag|watch|belt|access|টোট/.test(n)) return t("home.mensOutfit.ideas.finishing");
  if (/dress|formal|suit|ক্যাজুয়াল|ফর্মাল/.test(n)) return t("home.mensOutfit.ideas.formal");
  return name;
}

function pickTiles(children: ChildCategory[]): ChildCategory[] {
  const list = Array.isArray(children) ? children.filter((c) => c && c.id) : [];
  if (list.length <= 4) return list;

  const buckets: Array<(c: ChildCategory) => boolean> = [
    (c) => /shirt|polo|tee|t-shirt|শার্ট/.test(c.name.toLowerCase()),
    (c) => /pant|trouser|chino|jogger|প্যান্ট/.test(c.name.toLowerCase()),
    (c) => /shoe|sneaker|loafer|জুত/.test(c.name.toLowerCase()),
    (c) => /jacket|blazer|coat|hoodie|জ্যাকেট/.test(c.name.toLowerCase()),
  ];

  const picked: ChildCategory[] = [];
  const used = new Set<number>();

  for (const match of buckets) {
    const found = list.find((c) => !used.has(c.id) && match(c));
    if (found) {
      picked.push(found);
      used.add(found.id);
    }
  }

  for (const child of list) {
    if (picked.length >= 4) break;
    if (!used.has(child.id)) {
      picked.push(child);
      used.add(child.id);
    }
  }

  return picked.slice(0, 4);
}

export default function MensOutfitIdeas() {
  const { t, language } = useTranslation();
  const { subCategories, childCategories, subCategoriesLoading, childCategoriesLoading } =
    useCategory();

  const menSub = React.useMemo(() => findMenSub(subCategories), [subCategories]);

  const tiles = React.useMemo(() => {
    const fromSub = Array.isArray(menSub?.child_categories) ? menSub.child_categories : [];
    const fromList = (Array.isArray(childCategories) ? childCategories : []).filter(
      (c) => menSub?.id != null && c.sub_category_id === menSub.id,
    );
    const merged = fromSub.length > 0 ? fromSub : fromList;
    return pickTiles(merged);
  }, [childCategories, menSub]);

  const isLoading = subCategoriesLoading || childCategoriesLoading;

  if (!isLoading && tiles.length < 2) return null;

  return (
    <section className="w-full bg-[#1c2838] px-4 py-12 min-[768px]:px-8 min-[768px]:py-16 min-[1200px]:px-10 min-[1200px]:py-20">
      <div className="container mx-auto">
        <h2 className="text-center text-[28px] font-bold tracking-[-0.02em] text-[#f3efe4] min-[576px]:text-[34px] min-[768px]:text-[40px]">
          {t("home.mensOutfit.title")}
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-2 min-[768px]:mt-10 min-[768px]:grid-cols-4 min-[768px]:gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={`sk-${i}`}>
                  <div className="aspect-[4/5] w-full animate-pulse bg-[#2a384c]" />
                  <div className="mx-auto mt-3 h-3 w-28 animate-pulse bg-[#2a384c]" />
                </div>
              ))
            : tiles.map((item) => {
                const displayName = getLocalName(item.name, item.name_bd, language);
                const label = ideaLabel(displayName, t);
                const src =
                  typeof item.img_path === "string" && item.img_path.trim().length > 0
                    ? toPublicUrl(item.img_path)
                    : undefined;
                const href = `/category/${encodeURIComponent(item.name)}?childId=${item.id}`;

                return (
                  <Link key={item.id} href={href} className="group block">
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2a384c]">
                      {src ? (
                        <ImageWithFallback
                          src={src}
                          alt={label}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                          preload={false}
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 text-center text-[13px] font-semibold tracking-[0.02em] text-[#f3efe4] min-[768px]:text-[15px]">
                      {label}
                    </p>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
