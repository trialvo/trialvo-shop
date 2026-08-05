/**
 * User-facing copy for Add to Cart.
 * When already in cart, buttons should not invite another add.
 */
export function addToCartLabel(options: {
  inCart: boolean;
  quantityInCart?: number;
  /** Short label for compact buttons (list cards). */
  compact?: boolean;
}): string {
  const { inCart, quantityInCart = 0, compact = false } = options;

  if (!inCart) {
    return compact ? "Add" : "Add to Cart";
  }

  if (compact) {
    return quantityInCart > 0 ? `In cart (${quantityInCart})` : "In cart";
  }

  if (quantityInCart > 0) {
    return `Already in cart (${quantityInCart})`;
  }

  return "Already in cart";
}
