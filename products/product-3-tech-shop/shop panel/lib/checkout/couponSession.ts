import { sanitizeAuthText } from "@/lib/security/auth";

const STORAGE_KEY = "tech_shop_applied_coupon";

export type AppliedCouponSession = {
  code: string;
  discountAmount: number;
  title?: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readAppliedCoupon(): AppliedCouponSession | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const code =
      typeof obj.code === "string" ? sanitizeAuthText(obj.code, 40) : "";
    if (!code) return null;
    const discountAmount =
      typeof obj.discountAmount === "number" &&
      Number.isFinite(obj.discountAmount)
        ? Math.max(0, obj.discountAmount)
        : 0;
    const title =
      typeof obj.title === "string"
        ? sanitizeAuthText(obj.title, 80)
        : undefined;
    return { code, discountAmount, title };
  } catch {
    return null;
  }
}

export function writeAppliedCoupon(coupon: AppliedCouponSession): void {
  if (!canUseStorage()) return;
  try {
    const code = sanitizeAuthText(coupon.code, 40);
    if (!code) {
      clearAppliedCoupon();
      return;
    }
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        code,
        discountAmount: Math.max(0, coupon.discountAmount),
        title: coupon.title
          ? sanitizeAuthText(coupon.title, 80)
          : undefined,
      } satisfies AppliedCouponSession),
    );
  } catch {
    /* ignore */
  }
}

export function clearAppliedCoupon(): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
