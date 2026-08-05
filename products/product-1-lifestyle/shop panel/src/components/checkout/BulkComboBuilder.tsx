"use client";

import { useMemo, useState } from "react";
import { Search, Layers, Package } from "lucide-react";
import { IMAGE_URL } from "@/config/env";
import { useProduct } from "@/hooks/useProducts";
import type {
  ProductListItem,
  ProductVariationListItem,
} from "@/lib/api/product/service";
import type { BulkOffer, CartItem, ComboDeal, ComboDealItem } from "@/types";
import { BulkProgress } from "@/components/checkout/BulkProgress";
import { BulkSelectedItem } from "@/components/checkout/BulkSelectedItem";
import { BulkProductCard } from "@/components/checkout/BulkProductCard";
import type { BulkBuilderProduct } from "@/components/checkout/bulk-builder.types";

interface BulkComboBuilderProps {
  mode: "bulk" | "combo";
  selectedItems: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  bulkOffers?: BulkOffer[];
  comboDeals?: ComboDeal[];
}

const BulkComboBuilder = ({
  mode,
  selectedItems,
  onItemsChange,
  bulkOffers,
  comboDeals,
}: BulkComboBuilderProps) => {
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { products: apiProducts } = useProduct({ limit: 40, in_stock: true });
  const usesAdminBulkOffers = mode === "bulk" && bulkOffers !== undefined;
  const usesAdminComboDeals = mode === "combo" && comboDeals !== undefined;

  const products = useMemo(
    () => {
      if (usesAdminBulkOffers) {
        return bulkOffers.map(toBulkOfferBuilderProduct).filter(isBulkBuilderProduct);
      }

      return apiProducts.map(toBulkBuilderProduct).filter(isBulkBuilderProduct);
    },
    [apiProducts, bulkOffers, usesAdminBulkOffers],
  );

  const availableComboDeals = useMemo(
    () => (comboDeals ?? []).filter(isUsableComboDeal),
    [comboDeals],
  );

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const minRequired = mode === "bulk" ? 10 : usesAdminComboDeals ? 1 : 3;
  const description = mode === "bulk"
    ? usesAdminBulkOffers
      ? "Select active bulk offers configured by admin. Deal pricing applied automatically."
      : `Select products in bulk (min 5 per item, ${minRequired} total).`
    : usesAdminComboDeals
      ? "Pick an active combo bundle configured by admin. Deal pricing applied automatically."
      : `Pick ${minRequired}+ different products to bundle.`;

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.inStock;
  });

  const addProduct = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const lineId = `custom-${mode}-${product.productVariationId}`;
    const existing = selectedItems.find((i) => i.id === lineId);
    const quantityStep = product.quantityStep ?? (mode === "bulk" ? 5 : 1);
    const initialQuantity = product.minQuantity ?? (mode === "bulk" ? 5 : 1);
    if (existing) {
      onItemsChange(selectedItems.map((i) => i.id === lineId ? { ...i, quantity: i.quantity + quantityStep } : i));
    } else {
      onItemsChange([...selectedItems, {
        id: lineId,
        productId: String(product.productId),
        title: product.name,
        name: product.name,
        price: product.price,
        originalPrice: product.oldPrice ?? product.price,
        productVariationId: product.productVariationId,
        quantity: initialQuantity,
        size: product.sizes[0] || "One Size",
        color: product.colors[0]?.name || "Default",
        image: product.image,
        slug: product.slug,
        stock: product.stock,
        freeDelivery: product.freeDelivery,
      }]);
    }
  };

  const addComboDeal = (deal: ComboDeal) => {
    const comboItems = deal.items
      .map((item, index) => toComboCartItem(deal, item, index))
      .filter(isCartItem);

    if (comboItems.length === 0) return;

    const nextItems = new Map(selectedItems.map((item) => [item.id, item]));
    for (const item of comboItems) {
      const existing = nextItems.get(item.id);
      nextItems.set(
        item.id,
        existing ? { ...existing, quantity: existing.quantity + item.quantity } : item,
      );
    }

    onItemsChange(Array.from(nextItems.values()));
  };

  const updateItemQuantity = (id: string, delta: number) => {
    onItemsChange(
      selectedItems
        .map((i) => {
          if (i.id !== id) return i;
          const product = products.find((p) => p.productVariationId === i.productVariationId);
          const minQty = product?.minQuantity ?? (mode === "bulk" ? 5 : 1);
          const quantity = Math.max(0, i.quantity + delta);
          return quantity >= minQty ? { ...i, quantity } : null;
        })
        .filter(isCartItem)
    );
  };

  const totalItems = selectedItems.reduce((acc, i) => acc + i.quantity, 0);
  const progressCurrent = mode === "bulk"
    ? totalItems
    : usesAdminComboDeals
      ? (selectedItems.length > 0 ? 1 : 0)
      : selectedItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {mode === "bulk" ? <Layers size={22} className="text-accent" /> : <Package size={22} className="text-accent" />}
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground tracking-wide">
            {mode === "bulk" ? "Build Your Bulk Order" : "Create Your Combo"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {/* Progress */}
      <BulkProgress mode={mode} current={progressCurrent} required={minRequired} />

      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Your Selection ({selectedItems.length})
          </h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {selectedItems.map((item) => {
              const product = products.find((p) => p.productVariationId === item.productVariationId);
              return (
                <BulkSelectedItem
                  key={item.id}
                  item={item}
                  product={product}
                  mode={mode}
                  onQuantityChange={(delta) => updateItemQuantity(item.id, delta)}
                  onSizeChange={(size) => onItemsChange(selectedItems.map((i) => i.id === item.id ? { ...i, size } : i))}
                  onColorChange={(color) => onItemsChange(selectedItems.map((i) => i.id === item.id ? { ...i, color } : i))}
                  onRemove={() => onItemsChange(selectedItems.filter((i) => i.id !== item.id))}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Product browser */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">Browse Products</h3>
        {usesAdminComboDeals ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {availableComboDeals.map((deal) => (
              <ComboBuilderDealCard
                key={deal.id}
                deal={deal}
                isSelected={selectedItems.some((item) => item.id.startsWith(`${deal.id}-`))}
                onAdd={() => addComboDeal(deal)}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full h-10 pl-10 pr-4 border border-input rounded bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs tracking-wider uppercase rounded-full border transition-colors ${selectedCategory === cat ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:border-accent/40"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {filtered.map((product) => (
                <BulkProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedItems.some((i) => i.productVariationId === product.productVariationId)}
                  onAdd={() => addProduct(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkComboBuilder;

function toBulkBuilderProduct(product: ProductListItem): BulkBuilderProduct | null {
  const preferredVariation = getPreferredVariation(product.variations);
  if (!preferredVariation) return null;

  const price = preferredVariation.final_price ?? preferredVariation.selling_price;

  return {
    id: product.id,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price,
    oldPrice: preferredVariation.selling_price > price
      ? preferredVariation.selling_price
      : null,
    image: getProductImage(product),
    category: getProductCategory(product),
    sizes: ["Default"],
    colors: [{ name: "Default", value: "" }],
    inStock: preferredVariation.stock > 0,
    productVariationId: preferredVariation.id,
    stock: preferredVariation.stock,
  };
}

function toBulkOfferBuilderProduct(offer: BulkOffer): BulkBuilderProduct | null {
  const product = offer.product;
  const productVariationId = offer.productVariationId ?? product?.productVariationId;
  if (!product || !productVariationId) return null;

  return {
    id: productVariationId,
    productId: offer.productId,
    slug: product.slug,
    name: product.name,
    price: offer.pricePerUnit,
    oldPrice: offer.originalPricePerUnit > offer.pricePerUnit
      ? offer.originalPricePerUnit
      : null,
    image: product.image,
    category: "Bulk Offers",
    sizes: [product.size || "One Size"],
    colors: [{ name: product.color || "Default", value: "" }],
    inStock: offer.stockAvailable >= offer.minQuantity,
    productVariationId,
    stock: offer.stockAvailable,
    minQuantity: offer.minQuantity,
    quantityStep: 1,
    discountLabel: offer.discountLabel,
    freeDelivery: offer.freeDelivery,
  };
}

function ComboBuilderDealCard({
  deal,
  isSelected,
  onAdd,
}: {
  deal: ComboDeal;
  isSelected: boolean;
  onAdd: () => void;
}) {
  const firstProduct = deal.items[0]?.product;

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={!deal.inStock}
      className={`text-left p-3 border rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
        isSelected
          ? "border-accent bg-accent/5 ring-1 ring-accent/20"
          : "border-border hover:border-accent/30 hover:shadow-sm"
      }`}
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded overflow-hidden bg-secondary shrink-0">
          {firstProduct?.image && (
            <img src={firstProduct.image} alt={deal.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground truncate">{deal.title}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {deal.totalItems} items · {deal.discountPercent}% off
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold text-foreground">${deal.dealPrice.toFixed(2)}</span>
            {isSelected && (
              <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">
                Added
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function toComboCartItem(
  deal: ComboDeal,
  item: ComboDealItem,
  index: number,
): CartItem | null {
  const product = item.product;
  const productVariationId = item.productVariationId ?? product?.productVariationId;
  if (!product || !productVariationId) return null;

  const price = item.dealPricePerUnit ?? product.price ?? 0;
  const originalPrice = item.originalPricePerUnit ?? product.originalPrice ?? product.price ?? price;

  return {
    id: `${deal.id}-${productVariationId}-${index}`,
    productId: String(item.productId),
    productVariationId,
    title: product.name,
    name: product.name,
    image: product.image,
    price,
    originalPrice,
    size: item.size || product.size || "One Size",
    color: item.color || product.color || "Default",
    quantity: item.quantity,
    stock: item.stockAvailable ?? product.stock,
    slug: product.slug,
    freeDelivery: deal.freeDelivery,
  };
}

function isUsableComboDeal(deal: ComboDeal): boolean {
  return Boolean(
    deal.inStock &&
    deal.items.length > 0 &&
    deal.items.every((item) => item.product?.productVariationId && item.quantity > 0),
  );
}

function isCartItem(item: CartItem | null): item is CartItem {
  return item !== null;
}

function getPreferredVariation(
  variations: ProductVariationListItem[],
): ProductVariationListItem | null {
  return variations.find((variation) => variation.stock > 0) ?? variations[0] ?? null;
}

function getProductImage(product: ProductListItem): string {
  const imagePath = product.thumbnail || product.images[0]?.path || "";
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${IMAGE_URL.replace(/\/+$/, "")}/${imagePath.replace(/^\/+/, "")}`;
}

function getProductCategory(product: ProductListItem): string {
  if (product.best_deal) return "Best Deals";
  if (product.featured) return "Featured";
  return "Products";
}

function isBulkBuilderProduct(
  product: BulkBuilderProduct | null,
): product is BulkBuilderProduct {
  return product !== null && product.inStock && product.productVariationId > 0;
}
