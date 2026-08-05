import { IMAGE_URL } from "@/config/env";
import type {
  BulkRule,
  ComboRule,
  ComboTier,
  ComboTierItem,
  DealDiscountType,
} from "@/lib/api/deal/service";
import type { BulkOffer, ComboDeal, ComboDealItem } from "@/types";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const roundMoney = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

const toNonNegativeNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const isEnabledFlag = (value: 0 | 1 | boolean): boolean =>
  value === true || value === 1;

const toImageUrl = (path: string | null | undefined): string => {
  const value = path?.trim();
  if (!value) return PLACEHOLDER_IMAGE;

  if (value.startsWith("/")) {
    return `${IMAGE_URL.replace(/\/+$/, "")}${value}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return `${IMAGE_URL.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
  }

  return PLACEHOLDER_IMAGE;
};

const calculateDiscountedPrice = (
  sellingPrice: number,
  discountType: DealDiscountType,
  discountValue: number,
): number => {
  const price = toNonNegativeNumber(sellingPrice);
  const discount = toNonNegativeNumber(discountValue);

  if (discountType === 1) {
    return roundMoney(Math.max(0, price - (price * discount) / 100));
  }

  return roundMoney(Math.max(0, price - discount));
};

const getDiscountLabel = (
  discountType: DealDiscountType,
  discountValue: number,
): string =>
  discountType === 1
    ? `${toNonNegativeNumber(discountValue)}% OFF`
    : `$${toNonNegativeNumber(discountValue)} OFF`;

const getTierSortValue = (tier: ComboTier): number =>
  Number.isFinite(tier.serial) ? tier.serial : tier.id;

const pickDisplayTier = (tiers: ComboTier[]): ComboTier | null => {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  return [...tiers].sort((a, b) => getTierSortValue(a) - getTierSortValue(b)).at(-1) ?? null;
};

const getComboDiscountAmount = (
  rawTotal: number,
  discountType: DealDiscountType,
  discountValue: number,
): number => {
  const discount = toNonNegativeNumber(discountValue);
  const amount =
    discountType === 1 ? (toNonNegativeNumber(rawTotal) * discount) / 100 : discount;

  return roundMoney(Math.min(toNonNegativeNumber(rawTotal), amount));
};

const createComboItem = (
  item: ComboTierItem,
  rawTotal: number,
  comboSavings: number,
): ComboDealItem => {
  const quantity = Math.max(1, Math.floor(toNonNegativeNumber(item.required_qty)));
  const originalPrice = toNonNegativeNumber(item.selling_price);
  const originalLineTotal = originalPrice * quantity;
  const discountShare = rawTotal > 0 ? (originalLineTotal / rawTotal) * comboSavings : 0;
  const dealLineTotal = Math.max(0, originalLineTotal - discountShare);

  return {
    productId: item.product_id,
    productVariationId: item.product_sku_id,
    size: item.variant_name ?? "One Size",
    color: item.color_name ?? "",
    quantity,
    originalPricePerUnit: roundMoney(originalPrice),
    dealPricePerUnit: roundMoney(dealLineTotal / quantity),
    stockAvailable: toNonNegativeNumber(item.stock),
      product: {
        id: item.product_id,
        name: item.product_name,
        slug: item.product_slug,
        image: toImageUrl(item.product_image),
        size: item.variant_name ?? "One Size",
        color: item.color_name ?? "",
        stock: toNonNegativeNumber(item.stock),
        price: roundMoney(originalPrice),
        originalPrice: roundMoney(originalPrice),
        productVariationId: item.product_sku_id,
      },
  };
};

export const normalizeBulkRules = (rules: BulkRule[]): BulkOffer[] =>
  rules.map((rule) => {
    const originalPrice = toNonNegativeNumber(rule.selling_price);
    const pricePerUnit = calculateDiscountedPrice(
      originalPrice,
      rule.discount_type,
      rule.discount_value,
    );

    return {
      id: `bulk-${rule.id}`,
      productId: rule.product_id,
      productVariationId: rule.product_sku_id,
      minQuantity: Math.max(1, Math.floor(toNonNegativeNumber(rule.min_qty))),
      pricePerUnit,
      originalPricePerUnit: roundMoney(originalPrice),
      discount: roundMoney(originalPrice - pricePerUnit),
      discountLabel: getDiscountLabel(rule.discount_type, rule.discount_value),
      freeDelivery: isEnabledFlag(rule.free_delivery),
      stockAvailable: toNonNegativeNumber(rule.stock),
      product: {
        id: rule.product_id,
        name: rule.product_name,
        slug: rule.product_slug,
        image: toImageUrl(rule.product_image),
        size: rule.variant_name ?? "One Size",
        color: rule.color_name ?? "",
        stock: toNonNegativeNumber(rule.stock),
        price: pricePerUnit,
        originalPrice: roundMoney(originalPrice),
        productVariationId: rule.product_sku_id,
      },
    };
  });

export const normalizeComboRules = (rules: ComboRule[]): ComboDeal[] =>
  rules.flatMap((rule) => {
    const tier = pickDisplayTier(rule.tiers);
    if (!tier) return [];

    const items = Array.isArray(tier.items) ? tier.items : [];
    if (items.length === 0) return [];

    const rawTotal = roundMoney(
      items.reduce(
        (sum, item) =>
          sum +
          toNonNegativeNumber(item.selling_price) *
            Math.max(1, Math.floor(toNonNegativeNumber(item.required_qty))),
        0,
      ),
    );
    const savings = getComboDiscountAmount(
      rawTotal,
      tier.discount_type,
      tier.discount_value,
    );
    const normalizedItems = items.map((item) =>
      createComboItem(item, rawTotal, savings),
    );
    const totalItems = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
    const inStock = normalizedItems.every(
      (item) => (item.stockAvailable ?? 0) >= item.quantity,
    );
    const discountPercent =
      rawTotal > 0 ? Math.round((savings / rawTotal) * 100) : 0;

    return [
      {
        id: `combo-${rule.id}`,
        title: rule.name,
        items: normalizedItems,
        totalItems,
        originalTotal: rawTotal,
        dealPrice: roundMoney(Math.max(0, rawTotal - savings)),
        savings,
        discountPercent,
        freeDelivery: isEnabledFlag(rule.free_delivery),
        inStock,
        stockWarning: inStock
          ? undefined
          : "Currently unavailable due to stock limits.",
      },
    ];
  });
