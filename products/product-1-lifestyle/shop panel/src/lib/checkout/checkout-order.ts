import { addressService, type CreateAddressPayload } from "@/lib/api/address/service";
import { guestOrderService } from "@/lib/api/guest-order/service";
import { orderService, type CreateOrderPayload } from "@/lib/api/order/service";
import {
  isGatewayPaymentProvider,
  type CheckoutPaymentType,
  type GatewayPaymentProvider,
} from "@/lib/checkout/payment-types";
import type {
  BillingFormData,
  ShippingFormData,
} from "@/lib/validation/checkout";
import type { Address, CartItem, OrderType } from "@/types";

type CheckoutBillingInput = {
  sameAsShipping: boolean;
  values: BillingFormData;
};

export type SubmitCheckoutOrderInput = {
  items: CartItem[];
  orderType: OrderType;
  shipping: ShippingFormData;
  billing: CheckoutBillingInput;
  isAuthenticated: boolean;
  savedAddresses?: Address[];
  selectedShippingAddressId?: number | null;
  deliveryChargeId?: number | null;
  couponCode?: string | null;
  guestOrderId?: string | null;
  paymentType: CheckoutPaymentType;
  gatewayProvider?: GatewayPaymentProvider | null;
};

export type SubmitCheckoutOrderResult = {
  confirmationId: string;
  redirectUrl?: string;
  guestOrderId?: string;
};

type UnknownRecord = Record<string, unknown>;

export function createGuestCheckoutId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `guest-${crypto.randomUUID()}`;
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toFullShippingAddress(values: ShippingFormData): string {
  return [values.address, values.city, values.state, values.zip, values.country]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

export function toFullBillingAddress(
  shippingValues: ShippingFormData,
  billing: CheckoutBillingInput,
): string {
  if (billing.sameAsShipping) return toFullShippingAddress(shippingValues);

  const values = billing.values;
  return [
    values.billingAddress,
    values.billingCity,
    values.billingState,
    values.billingZip,
    values.billingCountry,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

export async function submitCheckoutOrder(
  input: SubmitCheckoutOrderInput,
): Promise<SubmitCheckoutOrderResult> {
  const deliveryChargeId = toPositiveInteger(input.deliveryChargeId);
  if (!deliveryChargeId) {
    throw new Error("Delivery option is unavailable. Please try again.");
  }

  const paymentType = normalizePaymentType(input.paymentType);
  const gatewayProvider = normalizeGatewayProvider(input.gatewayProvider);

  const orderItems = toOrderItems(input.items);
  const couponCode = normalizeOptionalString(input.couponCode);
  const shouldUseGuestFlow = !input.isAuthenticated || input.orderType === "guest";

  if (shouldUseGuestFlow) {
    return submitGuestCheckout({
      ...input,
      deliveryChargeId,
      guestOrderId: input.guestOrderId || createGuestCheckoutId(),
      orderItems,
      couponCode,
      paymentType,
      gatewayProvider,
    });
  }

  return submitAuthenticatedCheckout({
    ...input,
    deliveryChargeId,
    orderItems,
    couponCode,
    paymentType,
    gatewayProvider,
  });
}

async function submitAuthenticatedCheckout(
  input: SubmitCheckoutOrderInput & {
    deliveryChargeId: number;
    orderItems: ReturnType<typeof toOrderItems>;
    couponCode: string | undefined;
    paymentType: CheckoutPaymentType;
    gatewayProvider: GatewayPaymentProvider | null;
  },
): Promise<SubmitCheckoutOrderResult> {
  const addressId = await resolveAddressId(input);
  const payload: CreateOrderPayload = {
    address_id: addressId,
    payment_type: input.paymentType,
    delivery_charge_id: input.deliveryChargeId,
    order_items: input.orderItems.map((item) => ({
      product_variation_id: item.skuId,
      quantity: item.quantity,
    })),
  };

  const billingAddress = toFullBillingAddress(input.shipping, input.billing);
  if (billingAddress) payload.note = `Billing address: ${billingAddress}`;
  if (input.couponCode) payload.coupon_code = input.couponCode;

  const response = await orderService.createOrder(payload);
  assertApiSuccess(response, "Order creation failed");

  const orderId = toPositiveInteger(response.order_id);
  if (!orderId) throw new Error("Order was created without an order id.");

  let redirectUrl: string | undefined;
  if (shouldInitiateGatewayPayment(response, input.paymentType)) {
    const gatewayProvider = requireGatewayProvider(input.gatewayProvider);
    const paymentResponse = await orderService.initiatePayment(
      orderId,
      gatewayProvider,
    );
    assertApiSuccess(paymentResponse, "Payment initiation failed");
    redirectUrl = getPaymentRedirectUrl(paymentResponse);
  }

  return {
    confirmationId: String(orderId),
    redirectUrl,
  };
}

async function submitGuestCheckout(
  input: SubmitCheckoutOrderInput & {
    deliveryChargeId: number;
    guestOrderId: string;
    orderItems: ReturnType<typeof toOrderItems>;
    couponCode: string | undefined;
    paymentType: CheckoutPaymentType;
    gatewayProvider: GatewayPaymentProvider | null;
  },
): Promise<SubmitCheckoutOrderResult> {
  const fullName = toFullName(input.shipping);
  const fullAddress = toFullShippingAddress(input.shipping);

  const createdGuestOrder = await guestOrderService.createGuestOrder({
    id: input.guestOrderId,
    name: fullName,
    email: input.shipping.email,
    phone: input.shipping.phone,
    full_address: fullAddress,
    city: input.shipping.city,
    zip_code: input.shipping.zip,
    location_mapping_id: null,
    delivery_charge_id: input.deliveryChargeId,
    payment_type: input.paymentType,
    items: input.orderItems.map((item) => ({
      product_sku_id: item.skuId,
      quantity: item.quantity,
    })),
  });
  assertApiSuccess(createdGuestOrder, "Guest order creation failed");

  const guestOrderId =
    normalizeOptionalString(createdGuestOrder.guest_order_id) ||
    normalizeOptionalString(createdGuestOrder.id) ||
    input.guestOrderId;

  const initiatedOrder = await guestOrderService.initiate(guestOrderId, {
    payment_type: input.paymentType,
    delivery_charge_id: input.deliveryChargeId,
    coupon_code: input.couponCode ?? "",
  });
  assertApiSuccess(initiatedOrder, "Guest order initiation failed");

  const orderId = toPositiveInteger(initiatedOrder.order_id) ??
    toPositiveInteger(initiatedOrder.data?.order_id);

  let redirectUrl: string | undefined;
  if (shouldInitiateGatewayPayment(initiatedOrder, input.paymentType)) {
    const gatewayProvider = requireGatewayProvider(input.gatewayProvider);
    const paymentResponse = await guestOrderService.initiatePayment(guestOrderId, {
      payment_method: gatewayProvider,
    });
    assertApiSuccess(paymentResponse, "Guest payment initiation failed");
    redirectUrl = getPaymentRedirectUrl(paymentResponse);
  }

  return {
    confirmationId: orderId ? String(orderId) : guestOrderId,
    guestOrderId,
    redirectUrl,
  };
}

async function resolveAddressId(
  input: SubmitCheckoutOrderInput,
): Promise<number> {
  const selectedAddressId = toPositiveInteger(input.selectedShippingAddressId);
  if (selectedAddressId) return selectedAddressId;

  const matchingAddressId = findMatchingSavedAddressId(
    input.savedAddresses,
    input.shipping,
  );
  if (matchingAddressId) return matchingAddressId;

  const payload = toCreateAddressPayload(input.shipping);
  const response = await addressService.createAddress(payload);
  assertApiSuccess(response, "Address creation failed");

  const createdAddressId = extractCreatedAddressId(response);
  if (!createdAddressId) {
    throw new Error("Address was created without an address id.");
  }

  return createdAddressId;
}

function toOrderItems(items: CartItem[]): Array<{ skuId: number; quantity: number }> {
  if (items.length === 0) throw new Error("Your cart is empty.");

  return items.map((item) => {
    const skuId = toPositiveInteger(item.productVariationId);
    if (!skuId) {
      throw new Error(`${item.title} is missing a valid SKU. Please re-add it to your cart.`);
    }

    return {
      skuId,
      quantity: Math.max(1, Math.trunc(item.quantity)),
    };
  });
}

function toCreateAddressPayload(values: ShippingFormData): CreateAddressPayload {
  return {
    name: toFullName(values),
    phone: normalizeOptionalString(values.phone),
    type: "home",
    full_address: toFullShippingAddress(values),
    city: values.city,
    zip_code: values.zip,
    location_mapping_id: null,
  };
}

function toFullName(values: ShippingFormData): string {
  return [values.firstName, values.lastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
}

function findMatchingSavedAddressId(
  addresses: Address[] | undefined,
  values: ShippingFormData,
): number | null {
  if (!addresses?.length) return null;

  const fullAddress = toFullShippingAddress(values).toLowerCase();
  const match = addresses.find((address) => {
    if (address.usage !== "shipping" && address.usage !== "both") return false;

    const candidate = [
      address.street,
      address.city,
      address.state,
      address.zip,
      address.country,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ")
      .toLowerCase();

    return candidate === fullAddress;
  });

  return toPositiveInteger(match?.id);
}

function extractCreatedAddressId(response: unknown): number | null {
  const candidates = [
    response,
    getRecordValue(response, "data"),
    getRecordValue(response, "address"),
    getRecordValue(getRecordValue(response, "data"), "address"),
  ];

  for (const candidate of candidates) {
    const id =
      toPositiveInteger(getRecordValue(candidate, "id")) ??
      toPositiveInteger(getRecordValue(candidate, "address_id"));
    if (id) return id;
  }

  return null;
}

function normalizePaymentType(value: unknown): CheckoutPaymentType {
  if (value === "cod" || value === "gateway") return value;
  throw new Error("Payment method is unavailable. Please try again.");
}

function normalizeGatewayProvider(
  value: unknown,
): GatewayPaymentProvider | null {
  return isGatewayPaymentProvider(value) ? value : null;
}

function requireGatewayProvider(
  provider: GatewayPaymentProvider | null,
): GatewayPaymentProvider {
  if (provider) return provider;
  throw new Error("Online payment provider is unavailable. Please try again.");
}

function shouldInitiateGatewayPayment(
  response: unknown,
  paymentType: CheckoutPaymentType,
): boolean {
  return paymentType === "gateway" ||
    isPaymentAdvanceRequired(response) ||
    Boolean(getPaymentRedirectUrl(response));
}

function isPaymentAdvanceRequired(response: unknown): boolean {
  const payment = getRecordValue(response, "payment");
  const dataPayment = getRecordValue(getRecordValue(response, "data"), "payment");

  return getRecordValue(payment, "advance_required") === true ||
    getRecordValue(dataPayment, "advance_required") === true;
}

function getPaymentRedirectUrl(response: unknown): string | undefined {
  const payment = getRecordValue(response, "payment");
  const data = getRecordValue(response, "data");
  const dataPayment = getRecordValue(data, "payment");

  return (
    normalizeOptionalString(getRecordValue(payment, "url")) ||
    normalizeOptionalString(getRecordValue(response, "url")) ||
    normalizeOptionalString(getRecordValue(response, "redirect_url")) ||
    normalizeOptionalString(getRecordValue(data, "url")) ||
    normalizeOptionalString(getRecordValue(dataPayment, "url"))
  );
}

function assertApiSuccess(
  response: { success?: boolean; error?: string; message?: string } | unknown,
  fallback: string,
): void {
  const record = isRecord(response) ? response : {};
  const success = record.success;
  const error = normalizeOptionalString(record.error);

  if (success === false || error) {
    throw new Error(error || normalizeOptionalString(record.message) || fallback);
  }
}

function getRecordValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toPositiveInteger(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
  return Math.trunc(numberValue);
}
