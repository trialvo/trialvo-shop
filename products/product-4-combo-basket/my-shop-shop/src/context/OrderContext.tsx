"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { OrderMode } from "@/config/shopConfig";

export interface ComboSubItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
  image?: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  qty: number;
  itemType?: 'product' | 'combo';
  combo_items?: ComboSubItem[];
}

interface OrderContextValue {
  orderMode: OrderMode;
  items: OrderItem[];          // active mode's items (read-only view)
  singleItems: OrderItem[];   // always the single cart
  comboItems: OrderItem[];    // always the combo cart
  setOrderMode: (mode: OrderMode) => void;
  addItem: (item: Omit<OrderItem, "qty">, mode?: OrderMode) => void;
  removeItem: (productId: number, mode?: OrderMode) => void;
  updateQty: (productId: number, delta: number, mode?: OrderMode) => void;
  clearCart: (mode?: OrderMode) => void;
  itemCount: number;
  subtotal: number;
  singleItemCount: number;
  comboItemCount: number;
}

const OrderContext = createContext<OrderContextValue | null>(null);

/* ─────────────────────────────────────────────────────────
   localStorage persistence — 24-hour TTL
   Key stores NON-SENSITIVE product info only (public data).
   No auth tokens, payment data, or PII stored here.
───────────────────────────────────────────────────────── */
const STORAGE_KEY = "cb_cart_v2";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PersistedCart {
  singleItems: OrderItem[];
  comboItems: OrderItem[];
  orderMode: OrderMode;
  expiresAt: number; // Unix ms
}

function loadCart(): Pick<PersistedCart, "singleItems" | "comboItems" | "orderMode"> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedCart = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      singleItems: parsed.singleItems ?? [],
      comboItems: parsed.comboItems ?? [],
      orderMode: parsed.orderMode ?? "single",
    };
  } catch {
    return null;
  }
}

function saveCart(data: Omit<PersistedCart, "expiresAt">) {
  try {
    const payload: PersistedCart = {
      ...data,
      expiresAt: Date.now() + TTL_MS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — silently fail
  }
}

/* ─── list helpers ─── */
function addToList(prev: OrderItem[], item: Omit<OrderItem, "qty">): OrderItem[] {
  const existing = prev.find((i) => i.productId === item.productId);
  if (existing) return prev.map((i) => i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i);
  return [...prev, { ...item, qty: 1 }];
}
function removeFromList(prev: OrderItem[], productId: number) {
  return prev.filter((i) => i.productId !== productId);
}
function updateInList(prev: OrderItem[], productId: number, delta: number) {
  return prev
    .map((i) => i.productId === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
    .filter((i) => i.qty > 0);
}
const sum = (list: OrderItem[]) => list.reduce((s, i) => s + i.qty, 0);

/* ─────────────────────────────────────────────────────────
   Provider
───────────────────────────────────────────────────────── */
export function OrderProvider({ children }: { children: ReactNode }) {
  // Initialise from localStorage on first render (client-side only)
  const [hydrated, setHydrated] = useState(false);
  const [orderMode, setOrderModeState] = useState<OrderMode>("single");
  const [singleItems, setSingleItems] = useState<OrderItem[]>([]);
  const [comboItems, setComboItems] = useState<OrderItem[]>([]);

  // ── Hydrate from localStorage once on mount ──
  useEffect(() => {
    const saved = loadCart();
    if (saved) {
      setSingleItems(saved.singleItems);
      setComboItems(saved.comboItems);
      setOrderModeState(saved.orderMode);
    }
    setHydrated(true);
  }, []);

  // ── Persist to localStorage whenever cart changes (after hydration) ──
  useEffect(() => {
    if (!hydrated) return;
    saveCart({ singleItems, comboItems, orderMode });
  }, [singleItems, comboItems, orderMode, hydrated]);

  // ── Active cart view ──
  const items = orderMode === "combo" ? comboItems : singleItems;
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const itemCount = useMemo(() => sum(items), [items]);
  const singleItemCount = useMemo(() => sum(singleItems), [singleItems]);
  const comboItemCount = useMemo(() => sum(comboItems), [comboItems]);

  const setOrderMode = useCallback((mode: OrderMode) => {
    setOrderModeState(mode);
  }, []);

  const addItem = useCallback((item: Omit<OrderItem, "qty">, mode?: OrderMode) => {
    const target = mode ?? orderMode;
    if (target === "combo") setComboItems((prev) => addToList(prev, item));
    else setSingleItems((prev) => addToList(prev, item));
  }, [orderMode]);

  const removeItem = useCallback((productId: number, mode?: OrderMode) => {
    const target = mode ?? orderMode;
    if (target === "combo") setComboItems((prev) => removeFromList(prev, productId));
    else setSingleItems((prev) => removeFromList(prev, productId));
  }, [orderMode]);

  const updateQty = useCallback((productId: number, delta: number, mode?: OrderMode) => {
    const target = mode ?? orderMode;
    if (target === "combo") setComboItems((prev) => updateInList(prev, productId, delta));
    else setSingleItems((prev) => updateInList(prev, productId, delta));
  }, [orderMode]);

  const clearCart = useCallback((mode?: OrderMode) => {
    const target = mode ?? orderMode;
    if (target === "combo") setComboItems([]);
    else setSingleItems([]);
  }, [orderMode]);

  return (
    <OrderContext.Provider
      value={{
        orderMode, setOrderMode,
        items, singleItems, comboItems, subtotal, itemCount,
        addItem, removeItem, updateQty, clearCart,
        singleItemCount, comboItemCount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used inside OrderProvider");
  return ctx;
}
