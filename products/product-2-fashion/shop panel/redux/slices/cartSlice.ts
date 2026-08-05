import { clearCartStorage } from "@/redux/storage/cartStorage";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  id: string;
  productId: string;
  productVariationId?: number;
  title: string;
  image: string;
  price: number;
  discount?: number;
  originalPrice: number;
  size: string;
  color: string;
  quantity: number;
  stock: number;
  weight_kg?: number;
  freeDelivery?: boolean;
};

export type GuestIdType = {
  id: string | null;
  timestamp: number;
  generatedAt: string;
} | null;

type CartState = {
  items: CartItem[];
  discount: number;
  deliveryCharge: number;
  weightFreeKg: number;
  weightExtraPerKg: number;
  hydrated: boolean;
  appliedCoupon: {
    coupon: string | null;
    discount: number;
  } | null;
  guestId: GuestIdType;
  buyNowId: number | null;
  isCartOpen: boolean;
};

const initialState: CartState = {
  items: [],
  discount: 0,
  deliveryCharge: 0,
  weightFreeKg: 0,
  weightExtraPerKg: 0,
  hydrated: false,
  appliedCoupon: {
    coupon: null,
    discount: 0
  },
  guestId: null,
  buyNowId: null,
  isCartOpen: false
};

type AddItemPayload = Omit<CartItem, "id"> & { id?: string; overrideQuantity?: boolean };
type SetQtyPayload = { id: string; quantity: number };
type IncDecPayload = { id: string };
type EditItemPayload = {
  id: string;
  updates: Partial<Omit<CartItem, "id" | "productId">>;
};

const makeLineId = (p: { productId: string; size: string; color: string }) =>
  `${p.productId}|${p.size}|${p.color}`;

function toNonNegativeNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Max quantity is the actual available stock — no arbitrary cap.
function getMaxQty(stock: number): number {
  return Math.max(1, stock);
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(
      state,
      action: PayloadAction<{
        items: CartItem[];
        discount: number;
        deliveryCharge?: number;
        appliedCoupon?: { coupon: string | null; discount: number } | null;
        guestId?: GuestIdType;
        buyNowId?: number | null;
        isCartOpen?: boolean;
      } | null>,
    ) {
      if (!action.payload) {
        state.hydrated = true;
        return;
      }

      state.items = Array.isArray(action.payload.items) ? action.payload.items : [];
      state.discount = typeof action.payload.discount === "number" ? action.payload.discount : 0;
      state.deliveryCharge = toNonNegativeNumber(action.payload.deliveryCharge);
      if (action.payload.appliedCoupon) {
        state.appliedCoupon = {
          coupon: typeof action.payload.appliedCoupon.coupon === "string" ? action.payload.appliedCoupon.coupon : null,
          discount: toNonNegativeNumber(action.payload.appliedCoupon.discount),
        };
      } else {
        state.appliedCoupon = null;
      }
      state.guestId = action.payload.guestId || null;
      state.buyNowId = action.payload.buyNowId || null;
      state.isCartOpen = action.payload.isCartOpen || false;
      state.hydrated = true;
    },

    setGuestId(state, action: PayloadAction<GuestIdType>) {
      state.guestId = action.payload;
    },

    setBuyNowId(state, action: PayloadAction<number | null>) {
      state.buyNowId = action.payload;
    },

    setIsCartOpen(state, action: PayloadAction<boolean>) {
      state.isCartOpen = action.payload;
    },
    setAppliedCoupon(state, action: PayloadAction<{ coupon: string | null; discount: number } | null>) {
      if (!action.payload) {
        state.appliedCoupon = null;
        return;
      }
      state.appliedCoupon = {
        coupon: typeof action.payload.coupon === "string" ? action.payload.coupon : null,
        discount: toNonNegativeNumber(action.payload.discount),
      };
    },

    setDiscount(state, action: PayloadAction<number>) {
      state.discount = Math.max(0, action.payload);
    },

    setDeliveryCharge(state, action: PayloadAction<number>) {
      state.deliveryCharge = toNonNegativeNumber(action.payload);
    },

    setWeightSettings(state, action: PayloadAction<{ weightFreeKg: number; weightExtraPerKg: number }>) {
      state.weightFreeKg = toNonNegativeNumber(action.payload.weightFreeKg);
      state.weightExtraPerKg = toNonNegativeNumber(action.payload.weightExtraPerKg);
    },

    addItem(state, action: PayloadAction<AddItemPayload>) {
      const payload = action.payload;

      const lineId =
        payload.id ??
        makeLineId({
          productId: payload.productId,
          size: payload.size,
          color: payload.color,
        });

      const existing = state.items.find((i) => i.id === lineId);

      if (existing) {
        const maxQty = getMaxQty(
          typeof payload.stock === "number" ? payload.stock : existing.stock,
        );
        existing.quantity = Math.min(maxQty, existing.quantity + Math.max(1, payload.quantity));
        existing.price = payload.price;
        existing.originalPrice = payload.originalPrice;
        existing.image = payload.image;
        existing.title = payload.title;
        if (typeof payload.stock === "number") existing.stock = payload.stock;
        return;
      }

      state.items.push({
        id: lineId,
        productId: payload.productId,
        productVariationId: payload.productVariationId,

        title: payload.title,
        image: payload.image,

        price: payload.price,
        discount: (typeof payload.originalPrice === "number" && payload.originalPrice > payload.price) ? payload.originalPrice - payload.price : 0,
        originalPrice: payload.originalPrice,

        size: payload.size,
        color: payload.color,
        quantity: Math.min(getMaxQty(payload.stock), Math.max(1, payload.quantity)),
        stock: payload.stock,
        weight_kg: typeof payload.weight_kg === "number" && Number.isFinite(payload.weight_kg) ? payload.weight_kg : 0,
        freeDelivery: payload.freeDelivery === true,
      });
    },

    editItem(state, action: PayloadAction<EditItemPayload>) {
      const { id, updates } = action.payload;
      const itemIndex = state.items.findIndex((i) => i.id === id);

      if (itemIndex === -1) return;

      const currentItem = state.items[itemIndex];

      const sizeChanged = updates.size && updates.size !== currentItem.size;
      const colorChanged = updates.color && updates.color !== currentItem.color;

      if (sizeChanged || colorChanged) {
        const newLineId = makeLineId({
          productId: currentItem.productId,
          size: updates.size || currentItem.size,
          color: updates.color || currentItem.color,
        });

        const existingItemIndex = state.items.findIndex((i) => i.id === newLineId);

        const nextSize = updates.size || currentItem.size;
        const nextColor = updates.color || currentItem.color;

        if (existingItemIndex !== -1 && existingItemIndex !== itemIndex) {
          const existingItem = state.items[existingItemIndex];
          const mergedStock =
            typeof updates.stock === "number"
              ? updates.stock
              : existingItem.stock ?? currentItem.stock;
          const maxQty = getMaxQty(mergedStock);

          const mergedItem: CartItem = {
            ...existingItem,
            ...currentItem,
            ...updates,
            id: newLineId,
            size: nextSize,
            color: nextColor,
            price: updates.price || currentItem.price,
            originalPrice: updates.originalPrice ?? currentItem.originalPrice,
            quantity: Math.min(
              maxQty,
              existingItem.quantity + (updates.quantity || currentItem.quantity),
            ),
            stock: mergedStock,
          };

          const indices = [existingItemIndex, itemIndex].sort((a, b) => b - a);
          for (const idx of indices) {
            state.items.splice(idx, 1);
          }
          state.items.splice(itemIndex, 0, mergedItem);
        } else {
          const maxQty = getMaxQty(
            typeof updates.stock === "number" ? updates.stock : currentItem.stock,
          );
          state.items[itemIndex] = {
            ...currentItem,
            ...updates,
            id: newLineId,
            size: nextSize,
            color: nextColor,
            quantity: Math.min(maxQty, updates.quantity || currentItem.quantity),
          };
        }
      } else {
        state.items[itemIndex] = {
          ...currentItem,
          ...updates,
          quantity: Math.min(
            getMaxQty(typeof updates.stock === "number" ? updates.stock : currentItem.stock),
            updates.quantity || currentItem.quantity,
          ),
        };
      }
    },

    setQuantity(state, action: PayloadAction<SetQtyPayload>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      item.quantity = Math.min(
        getMaxQty(item.stock),
        Math.max(1, action.payload.quantity),
      );
    },

    increaseQuantity(state, action: PayloadAction<IncDecPayload>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      item.quantity = Math.min(getMaxQty(item.stock), item.quantity + 1);
    },

    decreaseQuantity(state, action: PayloadAction<IncDecPayload>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      item.quantity = Math.max(1, item.quantity - 1);
    },

    removeItem(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((i) => i.id !== action.payload.id);
    },

    clearCart(state) {
      state.items = [];
      state.discount = 0;
      state.deliveryCharge = 0;
      state.appliedCoupon = null;
      clearCartStorage();
    },

    syncCartItems(state, action: PayloadAction<{ id: string; price: number; originalPrice: number; discount: number; stock: number; weight_kg?: number }[]>) {
      const updatesMap = new Map();
      action.payload.forEach(u => updatesMap.set(String(u.id), u));
      
      state.items.forEach(item => {
        const update = updatesMap.get(String(item.productVariationId));
        if (update) {
          item.price = update.price;
          item.originalPrice = update.originalPrice;
          item.discount = update.discount;
          item.stock = update.stock;
          if (typeof update.weight_kg === "number" && Number.isFinite(update.weight_kg)) {
            item.weight_kg = update.weight_kg;
          }
          if (typeof update.free_delivery === "boolean") {
            item.freeDelivery = update.free_delivery;
          }
          item.quantity = Math.min(getMaxQty(item.stock), Math.max(1, item.quantity));
        }
      });
    },
  },
});

export const {
  hydrateCart,
  setGuestId,
  setBuyNowId,
  setIsCartOpen,
  setDiscount,
  setDeliveryCharge,
  setWeightSettings,
  addItem,
  editItem,
  setQuantity,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  setAppliedCoupon,
  clearCart,
  syncCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;
