"use client";

import { getProductById } from "@/lib/api/products";
import { useAppDispatch } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import type { BulkOffer, DealProductSummary } from "@/types";
import { ShoppingBag, Tag, Truck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BulkOfferCardProps {
  offer: BulkOffer;
}

const getProductHref = (slug: string) => `/product/${encodeURIComponent(slug)}`;

export function BulkOfferCard({ offer }: BulkOfferCardProps) {
  const dispatch = useAppDispatch();
  const legacyProduct = getProductById(offer.productId);
  const product: DealProductSummary | null = offer.product ?? (
    legacyProduct
      ? {
          id: legacyProduct.id,
          name: legacyProduct.name,
          slug: legacyProduct.slug,
          image: legacyProduct.image,
          size: legacyProduct.sizes[0] || "One Size",
          color: legacyProduct.colors[0]?.name || "",
          stock: offer.stockAvailable,
          price: offer.pricePerUnit,
          originalPrice: offer.originalPricePerUnit,
        }
      : null
  );

  if (!product) return null;

  const totalPrice = offer.pricePerUnit * offer.minQuantity;
  const totalOriginal = offer.originalPricePerUnit * offer.minQuantity;
  const totalSavings = totalOriginal - totalPrice;
  const hasStock = offer.stockAvailable >= offer.minQuantity;

  const handleAdd = () => {
    if (!hasStock) return;
    dispatch(
      addItem({
        productId: String(product.id),
        productVariationId: offer.productVariationId ?? product.productVariationId,
        title: product.name,
        price: offer.pricePerUnit,
        originalPrice: offer.originalPricePerUnit,
        size: product.size,
        color: product.color,
        image: product.image,
        quantity: offer.minQuantity,
        stock: offer.stockAvailable,
        slug: product.slug,
        freeDelivery: offer.freeDelivery,
      })
    );
    toast.success(`Added ${offer.minQuantity} × ${product.name} to cart`);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
      <Link href={getProductHref(product.slug)} className="block">
        <div className="aspect-[4/5] overflow-hidden relative bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      {/* Badges */}
      <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] tracking-wider uppercase px-2 py-1 rounded font-bold">
          <Tag size={10} /> {offer.discountLabel ?? `$${offer.discount} OFF`}
        </span>
        {offer.freeDelivery ? (
          <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase text-accent font-medium border border-accent/30 px-2 py-1 rounded">
            <Truck size={10} /> Free Delivery
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase text-destructive font-medium border border-destructive/30 px-2 py-1 rounded">
            Paid Delivery
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {product.color} / {product.size}
        </p>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-bold text-foreground">${offer.pricePerUnit}</span>
          <span className="text-xs text-muted-foreground line-through">
            ${offer.originalPricePerUnit}
          </span>
          <span className="text-xs text-muted-foreground">/ unit</span>
        </div>

        <div className="mt-3 pt-3 border-t border-dashed border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              For <span className="font-semibold text-foreground">{offer.minQuantity}</span> units
            </span>
            <span className="text-sm font-bold text-foreground">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-accent">
              Save ${totalSavings.toLocaleString()}
            </span>
          </div>
        </div>

        {!hasStock && (
          <p className="text-xs text-destructive mt-2">
            Only {offer.stockAvailable} in stock, need {offer.minQuantity} for this offer.
          </p>
        )}

        <button
          onClick={handleAdd}
          disabled={!hasStock}
          className={`mt-4 w-full py-3 text-xs tracking-wider uppercase font-semibold rounded transition-colors flex items-center justify-center gap-2 ${
            hasStock
              ? "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {hasStock ? (
            <>
              <ShoppingBag size={14} /> Add {offer.minQuantity} Items
            </>
          ) : (
            "Insufficient Stock"
          )}
        </button>
      </div>
    </div>
  );
}
