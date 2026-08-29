import ProductCard from "@/components/cards/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Surface } from "@/components/section";
import type { ProductGridProps } from "@/types/marketplace";

type Props = ProductGridProps & {
  columns?: "catalog" | "featured";
};

/**
 * Product grid sized for the richer reference-style cards (2–3 columns).
 */
export function ProductGrid({
  products,
  isLoading = false,
  emptyMessage,
  columns = "featured",
}: Readonly<Props>) {
  const gridClass =
    columns === "catalog"
      ? "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
      : "grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3";

  if (isLoading) {
    return (
      <div className={gridClass} aria-busy="true">
        {Array.from({ length: columns === "catalog" ? 6 : 3 }).map((_, i) => (
          <Surface
            key={`grid-skel-${i}`}
            sheen
            className="overflow-hidden rounded-[1.35rem]"
          >
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          </Surface>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center shadow-card">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
          <PackageOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? "No products found"}
        </p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          className="h-full"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.3 }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}

export default ProductGrid;
