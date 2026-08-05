import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  resolveSkuId,
  sameCartLine,
} from "@/store/cart/cartLine";
import type {
  AddToCartPayload,
  CartLineKeyPayload,
  CartState,
  ReplaceCartItemPayload,
  UpdateCartItemPayload,
  UpdateQuantityPayload,
} from "@/store/cart/types";
import type { CartItem } from "@/store/cart/types";
import { CART_QTY_MAX, CART_QTY_MIN } from "@/store/cart/types";

const initialState: CartState = {
  items: [],
  isCartOpen: false,
  isHydrated: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.isHydrated = true;
    },
    addToCart(state, action: PayloadAction<AddToCartPayload>) {
      const {
        product,
        quantity = 1,
        color,
        productVariationId,
        openDrawer = true,
      } = action.payload;

      const skuId = resolveSkuId(product, productVariationId);
      const qty =
        Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

      const existing = state.items.find((item) =>
        sameCartLine(item, product.id, skuId),
      );

      // Already in cart — do not add again; user must remove or edit the line.
      if (existing) {
        if (openDrawer) {
          state.isCartOpen = true;
        }
        return;
      }

      state.items.push({
        product,
        quantity: qty,
        color,
        productVariationId: skuId,
      });

      if (openDrawer) {
        state.isCartOpen = true;
      }
    },
    removeFromCart(state, action: PayloadAction<CartLineKeyPayload>) {
      const { productId, productVariationId } = action.payload;
      state.items = state.items.filter(
        (item) => !sameCartLine(item, productId, productVariationId),
      );
    },
    updateQuantity(state, action: PayloadAction<UpdateQuantityPayload>) {
      const { productId, productVariationId, quantity } = action.payload;

      if (quantity < CART_QTY_MIN) {
        state.items = state.items.filter(
          (item) => !sameCartLine(item, productId, productVariationId),
        );
        return;
      }

      const line = state.items.find((item) =>
        sameCartLine(item, productId, productVariationId),
      );
      if (line) {
        line.quantity = Math.min(CART_QTY_MAX, Math.floor(quantity));
      }
    },
    /** Update quantity / color on an existing cart line. */
    updateCartItem(state, action: PayloadAction<UpdateCartItemPayload>) {
      const { productId, productVariationId, quantity, color } = action.payload;
      const line = state.items.find((item) =>
        sameCartLine(item, productId, productVariationId),
      );
      if (!line) return;

      if (quantity < CART_QTY_MIN) {
        state.items = state.items.filter(
          (item) => !sameCartLine(item, productId, productVariationId),
        );
        return;
      }

      line.quantity = Math.min(CART_QTY_MAX, Math.floor(quantity));
      if (color !== undefined) {
        line.color = color;
      }
    },
    /**
     * Full line replace after edit dialog — supports SKU / price / option changes.
     */
    replaceCartItem(state, action: PayloadAction<ReplaceCartItemPayload>) {
      const {
        previousProductId,
        previousVariationId,
        product,
        quantity,
        color,
        productVariationId,
      } = action.payload;

      const qty = Math.min(
        CART_QTY_MAX,
        Math.max(CART_QTY_MIN, Math.floor(quantity)),
      );
      const nextSku = resolveSkuId(product, productVariationId);
      const sameLine =
        previousProductId === product.id &&
        (previousVariationId ?? undefined) === (nextSku ?? undefined);

      if (sameLine) {
        const line = state.items.find((item) =>
          sameCartLine(item, previousProductId, previousVariationId),
        );
        if (!line) return;
        line.product = product;
        line.quantity = qty;
        line.color = color;
        line.productVariationId = nextSku;
        return;
      }

      // Drop the line being edited
      state.items = state.items.filter(
        (item) => !sameCartLine(item, previousProductId, previousVariationId),
      );

      const target = state.items.find((item) =>
        sameCartLine(item, product.id, nextSku),
      );
      if (target) {
        // Target SKU already in cart — update that line instead of duplicating
        target.product = product;
        target.quantity = qty;
        target.color = color;
        target.productVariationId = nextSku;
        return;
      }

      state.items.push({
        product,
        quantity: qty,
        color,
        productVariationId: nextSku,
      });
    },
    clearCart(state) {
      state.items = [];
    },
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.isCartOpen = action.payload;
    },
  },
});

export const {
  hydrateCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  updateCartItem,
  replaceCartItem,
  clearCart,
  setCartOpen,
} = cartSlice.actions;

export const cartReducer = cartSlice.reducer;
