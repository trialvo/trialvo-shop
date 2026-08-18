/**
 * List price stays on products.price_bdt / price_usd.
 * discount_percent (0–100) is applied the same way for display and checkout.
 */

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function clampDiscountPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return Math.round(n * 100) / 100;
}

function saleAmount(listPrice, discountPercent) {
  const list = roundMoney(listPrice);
  const pct = clampDiscountPercent(discountPercent);
  if (pct <= 0) return list;
  if (pct >= 100) return 0;
  return roundMoney((list * (100 - pct)) / 100);
}

function discountAmount(listPrice, discountPercent) {
  const list = roundMoney(listPrice);
  const sale = saleAmount(list, discountPercent);
  return roundMoney(list - sale);
}

function quoteProduct(row) {
  const listBdt = roundMoney(row?.price_bdt);
  const listUsd = roundMoney(row?.price_usd);
  const percent = clampDiscountPercent(row?.discount_percent);
  return {
    listBdt,
    listUsd,
    discountPercent: percent,
    saleBdt: saleAmount(listBdt, percent),
    saleUsd: saleAmount(listUsd, percent),
    discountBdt: discountAmount(listBdt, percent),
    discountUsd: discountAmount(listUsd, percent),
    hasDiscount: percent > 0,
  };
}

module.exports = {
  roundMoney,
  clampDiscountPercent,
  saleAmount,
  discountAmount,
  quoteProduct,
};
