import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recently-viewed-products";
const MAX_ITEMS = 8;

interface RecentlyViewedProduct {
  id: string;
  slug: string;
  name: { bn: string; en: string };
  thumbnail: string;
  priceBDT: number;
  priceUSD: number;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Add a product to recently viewed
  const addToRecentlyViewed = useCallback(
    (product: {
      id: string;
      slug: string;
      name: { bn: string; en: string };
      thumbnail: string;
      priceBDT: number;
      priceUSD: number;
    }) => {
      setItems((prev) => {
        const filtered = prev.filter((p) => p.id !== product.id);
        const updated = [
          { ...product, viewedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          /* ignore */
        }

        return updated;
      });
    },
    [],
  );

  return { recentlyViewed: items, addToRecentlyViewed };
};
