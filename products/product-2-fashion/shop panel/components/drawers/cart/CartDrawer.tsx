"use client";

import CartItem from "@/components/cart/CartItem";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import DrawerShell from "@/components/drawers/DrawerShell";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGuestId } from "@/hooks/useGuestId";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBuyNowId,
  selectCartCounts,
  selectCartItems,
  selectCartTotals,
} from "@/redux/selectors/cartSelectors";
import type { CartItem as CartItemType } from "@/redux/slices/cartSlice";
import { clearCart, decreaseQuantity, increaseQuantity, removeItem, setBuyNowId, setIsCartOpen } from "@/redux/slices/cartSlice";
import { openModal } from "@/redux/slices/modalManagerSlice";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FiX } from "react-icons/fi";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
};

const CartDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop = true,
  zIndex = 1000,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const items = useAppSelector(selectCartItems);
  const buyNowId = useAppSelector(selectBuyNowId);
  const subTotal = useAppSelector(selectCartTotals);
  const counts = useAppSelector(selectCartCounts);

  // Use hasMixedDelivery from selector — accounts for per-SKU AND rule-based free delivery
  const isMixedDelivery = subTotal.hasMixedDelivery ?? false;

  const { id: guestId, loading: guestIdLoading, refresh: refreshGuestId } = useGuestId({ auto: false });
  const { createGuestOrder, isLoading: isCreatingGuestOrder } = useGuestOrder();
  const { trackRemoveFromCart, trackViewCart } = useAnalytics();

  /* ── Track view_cart when drawer opens ── */
  React.useEffect(() => {
    if (!open || !items?.length) return;
    const total = items.reduce((sum, it) => sum + (it.price ?? 0) * (it.quantity ?? 1), 0);
    trackViewCart({
      value: total,
      content_ids: items.map((it) => String(it.productId)),
      num_items: items.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClearCart = () => {
    openConfirmDelete(
      dispatch,
      () => { dispatch(clearCart()); },
      {
        title: "Clear Cart",
        description: "Remove all items from your cart?",
        cancelText: t("product.notNow"),
        confirmText: "Clear All",
      },
    );
  };

  const handleDelete = (item: CartItemType) => {
    openConfirmDelete(
      dispatch,
      () => {
        // Track before removing so we still have item data
        trackRemoveFromCart({
          content_ids: [String(item.productId)],
          content_name: item.title ?? "",
          value: (item.price ?? 0) * (item.quantity ?? 1),
          quantity: item.quantity ?? 1,
        });
        dispatch(removeItem({ id: item.id }));
      },
      {
        title: t("product.deleteCartTitle"),
        description: t("product.deleteCartDesc"),
        cancelText: t("product.notNow"),
        confirmText: t("product.yesDelete"),
      },
    );
  };

  const handleEdit = (item: CartItemType) => {
    if (!item) return;
    onOpenChange(false);
    globalThis.setTimeout(() => {
      dispatch(
        openModal({
          key: "quickEdit",
          payload: {
            cartItemId: item.id,
            productId: parseInt(item.productId),
            initialData: {
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              productVariationId: item.productVariationId,
            },
          },
        }),
      );
    }, 0);
  };

  const handleCheckout = async () => {
    dispatch(setBuyNowId(null));
    dispatch(setIsCartOpen(false));
    onOpenChange(false);

    router.push("/checkout");

    const resolvedGuestId = guestId ?? (await refreshGuestId());
    if (!resolvedGuestId) return;

    const cartItemsPayload = items.map(item => ({
      product_sku_id: Number(item.productVariationId),
      quantity: item.quantity,
    }));

    const guestOrderPayload: CreateGuestOrderPayload = {
      id: resolvedGuestId,
      items: cartItemsPayload,
    };

    await createGuestOrder(guestOrderPayload);
  };

  const cartTotal = subTotal?.subtotal - subTotal?.discount;
  const isCheckoutDisabled = items?.length === 0 || guestIdLoading || isCreatingGuestOrder;

  return (
    <DrawerShell
      open={open}
      onOpenChange={() => {
        dispatch(setIsCartOpen(false));
        onOpenChange(false);
      }}
      a11yTitle={t("cart.title")}
      isTop={isTop}
      zIndex={zIndex}
      side="right"
      contentClassName={cn(
        "w-[520px] max-[500px]:w-[100dvw] max-[500px]:max-w-[100dvw] max-[500px]:border-x-0",
        "h-[100dvh] max-h-[100dvh]",
      )}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 py-4.75 shadow-sm sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-black">{t("cart.title")}</h2>
            <span className="py-[3.5px] text-xs font-normal text-black">
              {counts.itemsCount} {t("cart.items")}
            </span>
            {items?.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="h-7 border border-[#E3B7B7] bg-[#FFF5F5] px-2.5 text-xs font-semibold text-[#C63A3A] transition hover:bg-[#FFEDED]"
              >
                Clear All
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              dispatch(setIsCartOpen(false));
              onOpenChange(false);
            }}
            aria-label={t("common.close")}
            className={cn(
              "grid h-8 w-8 place-items-center cursor-pointer transition-colors",
              "text-black hover:bg-black/5",
            )}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {/* Mixed delivery warning */}
          {isMixedDelivery && (
            <div className="mx-2 sm:mx-6 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 text-base leading-none">⚠️</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800">Mixed Delivery Cart</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Delivery fee &amp; weight surcharge apply <strong>only to paid-delivery items</strong>.
                    Your free-delivery items ship at no extra cost.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="px-2 sm:px-6 sm:py-4">
              {items?.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/60 flex flex-col items-center justify-center">
                  <div className="relative h-22 w-22 shrink-0 overflow-hidden">
                    <ImageWithFallback
                      src={"/empty-cart.svg"}
                      alt={"empty cart"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-4 text-center text-sm font-semibold text-black">
                    {t("cart.empty")}
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      router.push("/");
                      onOpenChange(false);
                    }}
                    className="mt-8 h-10 rounded-none bg-black px-14 text-sm font-semibold text-white hover:bg-black/90"
                  >
                    {t("cart.startShopping")}
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onIncrease={() => dispatch(increaseQuantity({ id: item.id }))}
                    onDecrease={() => dispatch(decreaseQuantity({ id: item.id }))}
                    onRemove={() => handleDelete(item)}
                    onEdit={() => handleEdit(item)}
                    isActive={item?.productVariationId === buyNowId}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 bg-white px-6 py-5 sticky bottom-0 shadow-[0px_-2px_18px_rgba(0,0,0,0.06)]">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-black/80">{t("cart.subtotal")}</span>
              <span className="font-medium">
                {t("common.currency")} {subTotal?.subtotal?.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-black/80">{t("cart.discount")}</span>
              <span className="font-medium text-[#FF383C]">
                - {t("common.currency")} {subTotal?.discount?.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold">{t("cart.total")}</span>
              <span className="text-sm font-semibold">
                {t("common.currency")} {cartTotal?.toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            className="mt-5 h-12 w-full rounded-none bg-black text-base font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed"
            type="button"
            disabled={isCheckoutDisabled}
            onClick={handleCheckout}
          >
            {guestIdLoading
              ? t("common.loading")
              : isCreatingGuestOrder
                ? t("common.processing")
                : t("cart.checkout")}
          </Button>
        </div>
      </div>
    </DrawerShell>
  );
};

export default CartDrawer;
