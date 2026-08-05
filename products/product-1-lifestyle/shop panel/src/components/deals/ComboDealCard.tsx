"use client";

import { getProductById } from "@/lib/api/products";
import { useAppDispatch } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import type { ComboDeal, DealProductSummary } from "@/types";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface ComboDealCardProps {
  deal: ComboDeal;
}

const getLegacyProductSummary = (
  productId: number,
  size: string,
  color: string,
): DealProductSummary | null => {
  const product = getProductById(productId);
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image,
    size: size || product.sizes[0] || "One Size",
    color: color || product.colors[0]?.name || "",
    stock: 10,
    price: product.price,
    originalPrice: product.oldPrice ?? product.price,
  };
};

export function ComboDealCard({ deal }: ComboDealCardProps) {
  const dispatch = useAppDispatch();

  const handleAddAll = () => {
    if (!deal.inStock) return;
    deal.items.forEach((item) => {
      const product =
        item.product ?? getLegacyProductSummary(item.productId, item.size, item.color);
      if (product) {
        dispatch(
          addItem({
            productId: String(product.id),
            productVariationId: item.productVariationId ?? product.productVariationId,
            title: product.name,
            price:
              item.dealPricePerUnit ??
              Math.round((deal.dealPrice / deal.totalItems) * 100) / 100,
            originalPrice: item.originalPricePerUnit ?? product.price ?? 0,
            size: item.size || product.size,
            color: item.color || product.color,
            image: product.image,
            quantity: item.quantity,
            stock: item.stockAvailable ?? product.stock,
            slug: product.slug,
            freeDelivery: deal.freeDelivery,
          })
        );
      }
    });
    toast.success(`Added ${deal.totalItems} items from "${deal.title}" to cart`);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Combo Deal
          </span>
          <div className="flex items-center gap-2">
            {deal.freeDelivery ? (
              <span className="text-[10px] tracking-wider uppercase text-accent font-medium border border-accent/30 px-2 py-0.5 rounded">
                Free Delivery
              </span>
            ) : (
              <span className="text-[10px] tracking-wider uppercase text-destructive font-medium border border-destructive/30 px-2 py-0.5 rounded">
                Paid Delivery
              </span>
            )}
            {deal.inStock ? (
              <span className="bg-primary text-primary-foreground text-[10px] tracking-wider uppercase px-2 py-0.5 rounded font-bold">
                {deal.discountPercent}% OFF
              </span>
            ) : (
              <span className="bg-destructive/10 text-destructive text-[10px] tracking-wider uppercase px-2 py-0.5 rounded font-bold">
                Stock Issue
              </span>
            )}
          </div>
        </div>
        <h3 className="text-base font-bold text-foreground mt-2">{deal.title}</h3>
      </div>

      {/* Items list */}
      <div className="px-4 py-3 space-y-3 flex-1">
        {deal.items.map((item, idx) => {
          const product =
            item.product ?? getLegacyProductSummary(item.productId, item.size, item.color);
          if (!product) return null;
          const itemTotal = (item.originalPricePerUnit ?? product.price ?? 0) * item.quantity;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.color && `${item.color} / `}{item.size} ×{item.quantity}
                </p>
              </div>
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                ${itemTotal.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pricing + CTA */}
      <div className="px-4 pb-4 pt-2 border-t border-dashed border-border space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total ({deal.totalItems} items)</span>
          <span className="line-through">${deal.originalTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-accent font-medium">You save</span>
          <span className="text-accent font-bold">${deal.savings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-foreground">Deal Price</span>
          <span className="text-lg font-bold text-foreground">${deal.dealPrice.toLocaleString()}</span>
        </div>

        {!deal.inStock && deal.stockWarning && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertTriangle size={12} /> {deal.stockWarning}
          </p>
        )}

        <button
          onClick={handleAddAll}
          disabled={!deal.inStock}
          className={`w-full py-3 text-xs tracking-wider uppercase font-semibold rounded transition-colors flex items-center justify-center gap-2 mt-2 ${
            deal.inStock
              ? "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {deal.inStock ? (
            <>
              <ShoppingBag size={14} /> Add All {deal.totalItems} Items
            </>
          ) : (
            "Unavailable"
          )}
        </button>
      </div>
    </div>
  );
}
