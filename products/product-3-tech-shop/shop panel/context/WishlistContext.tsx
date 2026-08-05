"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { favoriteService } from "@/lib/api/favorite/service";
import { productService } from "@/lib/api/product/service";
import { productKeys } from "@/hooks/useProducts";

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  /** True after local/server wishlist has been loaded once */
  isReady: boolean;
  isSyncing: boolean;
}

const WISHLIST_STORAGE_KEY = "tech_shop_wishlist";
const WISHLIST_QUERY_KEY = ["wishlist", "ids"] as const;

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

/** Only accept positive integer product ids as strings */
function sanitizeProductId(raw: unknown): string | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const id = String(raw).trim();
  if (!/^\d+$/.test(id)) return null;
  const n = Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return id;
}

function loadGuestWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Set<string>();
    for (const item of parsed) {
      const id = sanitizeProductId(item);
      if (id) unique.add(id);
    }
    return Array.from(unique);
  } catch {
    return [];
  }
}

function saveGuestWishlist(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode — ignore */
  }
}

async function fetchFavoriteIds(): Promise<string[]> {
  const res = await productService.getProducts({
    is_favourite: true,
    limit: 50,
    status: true,
  });
  const products = Array.isArray(res?.products) ? res.products : [];
  return products
    .map((p) => sanitizeProductId(p.id))
    .filter((id): id is string => id !== null);
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const guestLoaded = useRef(false);
  const lastAuth = useRef<boolean | null>(null);

  // Hydrate guest wishlist once on mount
  useEffect(() => {
    if (guestLoaded.current) return;
    guestLoaded.current = true;
    setWishlist(loadGuestWishlist());
    setIsReady(true);
  }, []);

  // Persist guest wishlist; skip while authenticated (server is source of truth)
  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    saveGuestWishlist(wishlist);
  }, [wishlist, isReady, isAuthenticated]);

  // Sync server favorites on login; restore guest store on logout
  useEffect(() => {
    if (!isReady) return;

    const prevAuth = lastAuth.current;
    lastAuth.current = isAuthenticated;

    if (!isAuthenticated) {
      if (prevAuth === true) {
        setWishlist(loadGuestWishlist());
      }
      return;
    }

    // Already authenticated in this session — avoid overwriting optimistic toggles
    if (prevAuth === true) return;

    let cancelled = false;

    const syncFromServer = async () => {
      setIsSyncing(true);
      try {
        const ids = await fetchFavoriteIds();
        if (!cancelled) {
          setWishlist(ids);
          queryClient.setQueryData(WISHLIST_QUERY_KEY, ids);
        }
      } catch {
        // Keep current state if sync fails
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    void syncFromServer();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only on auth transitions
  }, [isAuthenticated, isReady]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const id = sanitizeProductId(productId);
      if (!id) return;

      const wasIn = wishlist.includes(id);

      // Optimistic update
      setWishlist((prev) =>
        wasIn ? prev.filter((x) => x !== id) : [...prev, id],
      );

      if (!isAuthenticated) return;

      setIsSyncing(true);
      try {
        await favoriteService.toggleFavorite(Number(id));
        queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: productKeys.all });
      } catch {
        // Rollback on API failure
        setWishlist((prev) =>
          wasIn ? [...prev, id] : prev.filter((x) => x !== id),
        );
      } finally {
        setIsSyncing(false);
      }
    },
    [wishlist, isAuthenticated, queryClient],
  );

  const isInWishlist = useCallback(
    (productId: string) => {
      // Keep SSR + first client paint identical until storage hydrate finishes
      if (!isReady) return false;
      const id = sanitizeProductId(productId);
      return id ? wishlist.includes(id) : false;
    },
    [wishlist, isReady],
  );

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, isInWishlist, isReady, isSyncing }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
