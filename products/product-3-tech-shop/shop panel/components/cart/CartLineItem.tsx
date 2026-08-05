"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CartLineEditDialog } from "@/components/cart/CartLineEditDialog";
import { CartQuantityStepper } from "@/components/cart/CartQuantityStepper";
import { CartRemoveConfirmDialog } from "@/components/cart/CartRemoveConfirmDialog";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/store/cart/types";
import { cn } from "@/lib/utils";

type CartLineItemProps = Readonly<{
  item: CartItem;
  /** Compact layout for the drawer; roomier for the cart page. */
  variant?: "drawer" | "page";
  /**
   * Full edit dialog (color / variant / qty).
   * Disabled in the cart drawer — edit lives on the cart page.
   */
  allowEdit?: boolean;
}>;

/**
 * Cart line — quantity stepper + optional full edit + mandatory remove confirm.
 */
export function CartLineItem({
  item,
  variant = "drawer",
  allowEdit = variant === "page",
}: CartLineItemProps): ReactElement {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity, productVariationId, color } = item;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isPage = variant === "page";
  const lineTotal = product.price * quantity;

  return (
    <>
      <div
        className={cn(
          "flex gap-3 rounded-sm border border-border bg-card transition-colors hover:border-border/80",
          isPage ? "p-3 sm:p-4" : "p-3",
        )}
      >
        <Link
          href={`/product/${product.slug}`}
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt=""
            className={cn(
              "object-cover rounded-sm border border-border bg-secondary/30",
              isPage ? "h-20 w-20" : "h-16 w-16",
            )}
          />
        </Link>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/product/${product.slug}`}
                className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors"
              >
                {product.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {product.brand ? <span>{product.brand}</span> : null}
                {color ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-border">·</span>
                    Color: {color}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              {allowEdit ? (
                <button
                  type="button"
                  aria-label={`Edit ${product.title}`}
                  className="rounded-sm p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${product.title}`}
                className="rounded-sm p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <CartQuantityStepper
              quantity={quantity}
              size={isPage ? "md" : "sm"}
              onChange={(next) =>
                updateQuantity(product.id, next, productVariationId)
              }
            />

            <div className="text-right">
              <p className="text-sm font-bold font-heading text-primary tabular-nums">
                ৳{lineTotal.toLocaleString()}
              </p>
              {quantity > 1 ? (
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  ৳{product.price.toLocaleString()} each
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {allowEdit ? (
        <CartLineEditDialog
          item={item}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}

      <CartRemoveConfirmDialog
        open={confirmOpen}
        productTitle={product.title}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          removeFromCart(product.id, productVariationId);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
