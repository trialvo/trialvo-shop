import type { CartItem } from "@/store/cart/types";
import { addressService } from "@/lib/api/address/service";
import {
  guestOrderService,
  type GuestOrderPermissions,
  type InitiateGuestOrderPayload,
  type InitiateGuestOrderResponse,
} from "@/lib/api/guest-order/service";
import {
  orderService,
  type CreateOrderResponse,
} from "@/lib/api/order/service";
import {
  buildCartOrderItems,
  buildFullAddress,
  toPaymentType,
} from "@/lib/checkout/buildCartOrderItems";
import { resolveGatewayPaymentMethod } from "@/lib/checkout/paymentMethod";
import type { CheckoutFormValues } from "@/lib/checkout/schemas";
import { syncGuestCartOrder } from "@/lib/guest-order/syncGuestCart";
import { clearGuestIdStorage, ensureGuestId } from "@/lib/guest-order/guestId";
import { sanitizeAuthText, sanitizeEmail } from "@/lib/security/auth";
import { toApiPhoneNumber } from "@/lib/phone/parse";
import { sanitizePaymentRedirectUrl } from "@/lib/security/paymentUrl";
import { clearAppliedCoupon } from "@/lib/checkout/couponSession";
import { getPaymentProviders } from "@/lib/api/payment/service";

export type CheckoutPlaceResult = {
  kind: "completed";
  orderId: string;
  paymentUrl?: string;
  paymentProvider: string;
  mode: "auth" | "guest";
  paymentType: "cod" | "gateway";
};

export type PlaceCheckoutOrderInput = {
  values: CheckoutFormValues;
  items: CartItem[];
  isAuthenticated: boolean;
  permissions: GuestOrderPermissions;
  /** Opens OTP UI; resolve true when verified */
  requestPhoneOtp: (guestOrderId: string, phone: string) => Promise<boolean>;
};

function extractAddressId(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as { id?: unknown; address?: { id?: unknown } };
  if (typeof obj.id === "number" && obj.id > 0) return obj.id;
  if (typeof obj.address?.id === "number" && obj.address.id > 0) {
    return obj.address.id;
  }
  return null;
}

function extractOrderId(
  res: CreateOrderResponse | InitiateGuestOrderResponse,
): number | null {
  if (typeof res.order_id === "number" && res.order_id > 0) return res.order_id;
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    res.data &&
    typeof res.data === "object" &&
    "order_id" in res.data &&
    typeof (res.data as { order_id?: unknown }).order_id === "number"
  ) {
    return (res.data as { order_id: number }).order_id;
  }
  return null;
}

function extractRawPaymentUrl(
  res: CreateOrderResponse | InitiateGuestOrderResponse,
): string | undefined {
  const root = res.payment?.url;
  if (typeof root === "string") return root;

  const nested =
    res &&
    typeof res === "object" &&
    "data" in res &&
    res.data &&
    typeof res.data === "object" &&
    "payment" in res.data
      ? (res.data as { payment?: { url?: string } }).payment?.url
      : undefined;

  return typeof nested === "string" ? nested : undefined;
}

function resolveSafePaymentUrl(raw: string | undefined): string | undefined {
  const safe = sanitizePaymentRedirectUrl(raw);
  return safe ?? undefined;
}

function extractInitiatePaymentUrl(res: unknown): string | undefined {
  if (!res || typeof res !== "object") return undefined;
  const obj = res as {
    url?: unknown;
    redirect_url?: unknown;
    data?: { url?: unknown; redirect_url?: unknown };
    success?: boolean;
    error?: unknown;
    message?: unknown;
  };

  if (obj.success === false) {
    const msg =
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.message === "string" && obj.message) ||
      "Failed to start payment";
    throw new Error(msg);
  }

  const candidates = [
    obj.url,
    obj.redirect_url,
    obj.data?.url,
    obj.data?.redirect_url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return undefined;
}

async function resolveDefaultGatewayProvider(): Promise<string | null> {
  try {
    const res = await getPaymentProviders({ is_active: true });
    return res?.default_provider ?? null;
  } catch {
    return null;
  }
}

function requireGatewayUrl(
  paymentType: "cod" | "gateway",
  paymentUrl: string | undefined,
): void {
  if (paymentType === "gateway" && !paymentUrl) {
    throw new Error(
      "Payment gateway did not return a valid payment link. Please try again or choose Cash on Delivery.",
    );
  }
}

function couponFromValues(values: CheckoutFormValues): string | undefined {
  const code = (values.couponCode ?? "").trim();
  return code ? sanitizeAuthText(code, 40) : undefined;
}

async function resolveAuthAddressId(
  values: CheckoutFormValues,
): Promise<number> {
  const existingId = Number(values.addressId);
  if (Number.isFinite(existingId) && existingId > 0) {
    return existingId;
  }

  const fullAddress = buildFullAddress({
    address: values.address,
    city: values.city,
    division: values.division,
  });

  const addrRes = await addressService.createAddress({
    name: sanitizeAuthText(values.name, 80),
    phone: toApiPhoneNumber(values.phone),
    type: "home",
    full_address: fullAddress,
    city: sanitizeAuthText(values.city || values.division, 100),
    zip_code: values.zipCode
      ? sanitizeAuthText(values.zipCode, 20)
      : undefined,
  });

  if (!addrRes?.success) {
    throw new Error(
      addrRes?.error || addrRes?.message || "Could not create shipping address",
    );
  }

  const addressId = extractAddressId(addrRes.data) ?? extractAddressId(addrRes);
  if (!addressId) {
    throw new Error("Could not create shipping address. Please try again.");
  }
  return addressId;
}

async function placeAuthenticatedOrder(
  input: PlaceCheckoutOrderInput,
): Promise<CheckoutPlaceResult> {
  const { values, items } = input;
  const { authItems } = buildCartOrderItems(items);
  const payment_type = toPaymentType(values.paymentProvider);
  const delivery_charge_id = Number(values.deliveryChargeId);
  const coupon_code = couponFromValues(values);

  if (!Number.isFinite(delivery_charge_id) || delivery_charge_id <= 0) {
    throw new Error("Please select a delivery option.");
  }

  const addressId = await resolveAuthAddressId(values);

  const result = await orderService.createOrder({
    address_id: addressId,
    payment_type,
    delivery_charge_id,
    note: values.orderNotes
      ? sanitizeAuthText(values.orderNotes, 500)
      : undefined,
    coupon_code,
    order_items: authItems,
  });

  if (!result?.success) {
    throw new Error(result?.error || result?.message || "Failed to place order");
  }

  const orderIdNum = extractOrderId(result);
  if (!orderIdNum) {
    throw new Error("Order created but no order id returned");
  }

  let paymentUrl = resolveSafePaymentUrl(extractRawPaymentUrl(result));

  // Gateway: always initiate with a backend-valid payment_method
  // (createOrder only stores payment_type = gateway|cod).
  if (payment_type === "gateway") {
    const defaultProvider = await resolveDefaultGatewayProvider();
    const paymentMethod = resolveGatewayPaymentMethod(
      values.paymentProvider,
      defaultProvider,
    );
    const payRes = await orderService.initiatePayment(orderIdNum, paymentMethod);
    paymentUrl =
      resolveSafePaymentUrl(extractInitiatePaymentUrl(payRes)) ?? paymentUrl;
  }

  requireGatewayUrl(payment_type, paymentUrl);
  clearAppliedCoupon();

  return {
    kind: "completed",
    mode: "auth",
    orderId: String(orderIdNum),
    paymentUrl,
    paymentProvider: values.paymentProvider,
    paymentType: payment_type,
  };
}

async function placeGuestOrder(
  input: PlaceCheckoutOrderInput,
): Promise<CheckoutPlaceResult> {
  const { values, items, permissions, requestPhoneOtp } = input;
  ensureGuestId();
  const guestOrderId = await syncGuestCartOrder(items);

  const payment_type = toPaymentType(values.paymentProvider);
  const delivery_charge_id = Number(values.deliveryChargeId);
  const coupon_code = couponFromValues(values) ?? "";

  if (!Number.isFinite(delivery_charge_id) || delivery_charge_id <= 0) {
    throw new Error("Please select a delivery option.");
  }

  const full_address = buildFullAddress({
    address: values.address,
    city: values.city,
    division: values.division,
  });
  const email = (values.email ?? "").trim()
    ? sanitizeEmail(values.email)
    : undefined;
  const zip_code = values.zipCode
    ? sanitizeAuthText(values.zipCode, 20)
    : undefined;

  const updateRes = await guestOrderService.updateGuestOrder(guestOrderId, {
    name: sanitizeAuthText(values.name, 80),
    phone: toApiPhoneNumber(values.phone),
    email,
    full_address,
    city: sanitizeAuthText(values.city || values.division, 100),
    zip_code,
  });

  if (updateRes?.error && updateRes.success === false) {
    throw new Error(updateRes.error || "Failed to save delivery details");
  }

  if (permissions.phone_verification_required) {
    const resendRes = await guestOrderService.resendOtp(guestOrderId);
    if (resendRes?.error && resendRes.success === false) {
      throw new Error(resendRes.error || "Failed to send phone OTP");
    }

    const verified = await requestPhoneOtp(
      guestOrderId,
      toApiPhoneNumber(values.phone),
    );
    if (!verified) {
      throw new Error("Phone verification is required to place your order.");
    }
  }

  const payload: InitiateGuestOrderPayload = {
    payment_type,
    delivery_charge_id,
    coupon_code,
    name: sanitizeAuthText(values.name, 80),
    phone: toApiPhoneNumber(values.phone),
    email,
    full_address,
    city: sanitizeAuthText(values.city || values.division, 100),
    zip_code,
    note: values.orderNotes
      ? sanitizeAuthText(values.orderNotes, 500)
      : undefined,
  };

  const result = await guestOrderService.initiate(guestOrderId, payload);

  if (result?.error && result.success === false) {
    throw new Error(result.error || result.message || "Failed to place order");
  }

  const orderIdNum = extractOrderId(result);
  if (!orderIdNum) {
    throw new Error("Order placed but no order id returned");
  }

  let paymentUrl = resolveSafePaymentUrl(extractRawPaymentUrl(result));

  if (payment_type === "gateway") {
    const defaultProvider = await resolveDefaultGatewayProvider();
    const paymentMethod = resolveGatewayPaymentMethod(
      values.paymentProvider,
      defaultProvider,
    );
    const payRes = await guestOrderService.initiatePayment(guestOrderId, {
      payment_method: paymentMethod,
    });
    paymentUrl =
      resolveSafePaymentUrl(extractInitiatePaymentUrl(payRes)) ?? paymentUrl;
  }

  requireGatewayUrl(payment_type, paymentUrl);
  clearGuestIdStorage();
  clearAppliedCoupon();

  return {
    kind: "completed",
    mode: "guest",
    orderId: String(orderIdNum),
    paymentUrl,
    paymentProvider: values.paymentProvider,
    paymentType: payment_type,
  };
}

export async function placeCheckoutOrder(
  input: PlaceCheckoutOrderInput,
): Promise<CheckoutPlaceResult> {
  if (input.items.length === 0) {
    throw new Error("Your cart is empty");
  }

  if (input.isAuthenticated) {
    return placeAuthenticatedOrder(input);
  }

  return placeGuestOrder(input);
}

export async function verifyGuestPhoneOtp(
  guestOrderId: string,
  otp: string,
): Promise<void> {
  const verifyRes = await guestOrderService.verifyPhone(guestOrderId, { otp });
  if (verifyRes?.error && verifyRes.success === false) {
    throw new Error(verifyRes.error || "Phone verification failed");
  }
}
