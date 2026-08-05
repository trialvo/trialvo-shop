import React from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";

import ProductSelectionPanel from "@/components/sales/ProductSelectionPanel";
import BillingPanel from "@/components/sales/BillingPanel";
import type { CartItem } from "@/components/sales/types";

const NewSalePage: React.FC = () => {
  const { t } = useTranslation();
  const [cart, setCart] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    const onClear = () => setCart([]);
    window.addEventListener("new-sale-clear-cart", onClear as any);
    return () =>
      window.removeEventListener("new-sale-clear-cart", onClear as any);
  }, []);

  const addToCart = React.useCallback((item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((x) => x.key === item.key);
      if (!found) return item.qty > 0 ? [...prev, item] : prev;
      const newQty = found.qty + item.qty;
      if (newQty <= 0) return prev.filter((x) => x.key !== item.key);
      return prev.map((x) =>
        x.key === item.key ? { ...x, qty: newQty } : x,
      );
    });
  }, []);

  const updateQty = React.useCallback((key: string, qty: number) => {
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)));
  }, []);

  const removeItem = React.useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            {t("sidebar.newSale")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("sales.pageSubtitle")}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-600 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <ShoppingCart className="size-3.5" />
          </span>
          <span className="font-medium tabular-nums text-gray-900 dark:text-white">
            {cartCount}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {t("sales.itemsInCart")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-5 xl:h-[calc(100dvh-168px)] xl:min-h-[580px]">
        <div className="col-span-12 h-full min-h-0 xl:col-span-7">
          <ProductSelectionPanel cart={cart} onAddToCart={addToCart} />
        </div>

        <div className="col-span-12 h-full min-h-0 xl:col-span-5">
          <BillingPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemove={removeItem}
          />
        </div>
      </div>
    </div>
  );
};

export default NewSalePage;
