"use client";

/**
 * SingleOrderCheckoutClient.tsx — Client component for SOP checkout
 *
 * Composes checkout form, OTP verification, and order summary.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useSingleOrderCheckout } from "@/hooks/useSingleOrderCheckout";
import type { SOPMiniCart, SOPAddressType } from "@/types/single-order";
import { SOPHeader } from "@/components/single-order";
import { SOPCheckoutForm } from "@/components/single-order/checkout/SOPCheckoutForm";
import { SOPOtpVerification } from "@/components/single-order/checkout/SOPOtpVerification";
import { SOPOrderSummary } from "@/components/single-order/checkout/SOPOrderSummary";
import type { DeliveryChargeItem } from "@/lib/api/delivery/service";
import { deliveryService } from "@/lib/api/delivery/service";
import {
  getPaymentProviders,
  type PaymentProviderItem,
} from "@/lib/api/payment/service";

const SOP_CART_KEY = "sop_cart";

interface Props {
  slug: string;
  id: string;
}

export default function SingleOrderCheckoutClient({ slug, id }: Props) {
  const router = useRouter();

  // ── Cart from sessionStorage ─────────────────────────────────────────
  const [cart, setCart] = useState<SOPMiniCart | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SOP_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SOPMiniCart;
        if (parsed?.items?.length > 0) {
          setCart(parsed);
          return;
        }
      }
    } catch {
      /* empty */
    }
    router.replace(`/single-order-page/${slug}/${id}`);
  }, [slug, id, router]);

  // ── Form state ───────────────────────────────────────────────────────
  const [addressType, setAddressType] = useState<SOPAddressType>("home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [areaName, setAreaName] = useState("");
  const [locationMappingId, setLocationMappingId] = useState<number | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [deliveryChargeId, setDeliveryChargeId] = useState("");

  // ── Delivery and Payment data ────────────────────────────────────────
  const [deliveryCharges, setDeliveryCharges] = useState<DeliveryChargeItem[]>(
    [],
  );
  const [paymentProviders, setPaymentProviders] = useState<
    PaymentProviderItem[]
  >([]);

  useEffect(() => {
    deliveryService
      .getCharges()
      .then((res) => {
        if (res.success && res.delivery_charges) {
          setDeliveryCharges(res.delivery_charges);
        }
      })
      .catch(() => {});

    getPaymentProviders({ is_active: true })
      .then((res) => {
        if (res.providers) {
          setPaymentProviders(res.providers);
          if (res.default_provider) {
            setPaymentProvider(res.default_provider);
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Computed totals ──────────────────────────────────────────────────
  const subtotal = useMemo(
    () => cart?.items.reduce((s, i) => s + i.sellingPrice * i.qty, 0) ?? 0,
    [cart],
  );
  const itemDiscount = useMemo(
    () =>
      cart?.items.reduce(
        (s, i) => s + (i.sellingPrice - i.unitPrice) * i.qty,
        0,
      ) ?? 0,
    [cart],
  );

  const selectedDelivery = useMemo(
    () => deliveryCharges.find((d) => String(d.id) === deliveryChargeId),
    [deliveryCharges, deliveryChargeId],
  );
  const rawDeliveryAmount = useMemo(
    () => (selectedDelivery ? Number(selectedDelivery.customer_charge) : 0),
    [selectedDelivery],
  );

  // Check if all items have free delivery
  const allFreeDelivery = useMemo(() => {
    if (!cart || cart.items.length === 0) return false;
    return cart.items.every((i) => i.freeDelivery);
  }, [cart]);

  const hasMixedDelivery = useMemo(() => {
    if (!cart || cart.items.length === 0) return false;
    return (
      cart.items.some((i) => i.freeDelivery) &&
      cart.items.some((i) => !i.freeDelivery)
    );
  }, [cart]);

  const deliveryAmount = useMemo(
    () => (allFreeDelivery ? 0 : rawDeliveryAmount),
    [allFreeDelivery, rawDeliveryAmount],
  );

  const paidWeightKg = useMemo(() => {
    if (!cart) return 0;
    return cart.items
      .filter((i) => !i.freeDelivery)
      .reduce((s, i) => s + i.weightKg * i.qty, 0);
  }, [cart]);

  const weightExtraCharge = useMemo(() => {
    if (!selectedDelivery || allFreeDelivery) return 0;
    const freeKg = Number(selectedDelivery.default_weight_kg || 0);
    const extraPerKg = Number(selectedDelivery.extra_charge_per_kg || 0);
    const excess = Math.max(0, paidWeightKg - freeKg);
    return Number((excess * extraPerKg).toFixed(2));
  }, [selectedDelivery, allFreeDelivery, paidWeightKg]);

  const bulkDiscount = useMemo(() => {
    if (!cart) return 0;
    const bulkOffers = cart.bulkOffers ?? [];
    const items = cart.items;
    const qtyMap: Record<number, number> = {};
    for (const it of items) qtyMap[it.skuId] = (qtyMap[it.skuId] ?? 0) + it.qty;

    let bd = 0;
    const bulkBySku: Record<number, typeof bulkOffers> = {};
    for (const r of bulkOffers) {
      if (!bulkBySku[r.product_sku_id]) bulkBySku[r.product_sku_id] = [];
      bulkBySku[r.product_sku_id].push(r);
    }
    for (const vid in bulkBySku)
      bulkBySku[vid].sort((a, b) => b.min_qty - a.min_qty);

    for (const vid in bulkBySku) {
      const qty = qtyMap[Number(vid)] ?? 0;
      const rule = bulkBySku[vid].find((r) => qty >= r.min_qty);
      if (!rule) continue;
      const base =
        items.find((i) => i.skuId === Number(vid))?.unitPrice ??
        rule.sku_selling_price;
      const disc =
        rule.discount_type === 0
          ? rule.discount_value * qty
          : ((base * rule.discount_value) / 100) * qty;
      bd += disc;
    }
    return Math.round(bd * 100) / 100;
  }, [cart]);

  const grandTotal = useMemo(
    () =>
      Math.max(
        0,
        subtotal -
          itemDiscount +
          deliveryAmount +
          weightExtraCharge -
          bulkDiscount,
      ),
    [subtotal, itemDiscount, deliveryAmount, weightExtraCharge, bulkDiscount],
  );

  // ── Checkout hook ────────────────────────────────────────────────────
  const checkout = useSingleOrderCheckout({
    slug,
    id,
    cart,
    grandTotal,
  });

  // Fetch permissions on mount
  useEffect(() => {
    checkout.fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Field change handler ─────────────────────────────────────────────
  const handleFieldChange = useCallback((field: string, value: string) => {
    switch (field) {
      case "name":
        setName(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "address":
        setAddress(value);
        break;
      case "note":
        setNote(value);
        break;
    }
  }, []);

  // ── Remove item from cart ────────────────────────────────────────────
  const handleRemoveItem = useCallback(
    (skuId: number) => {
      setCart((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          items: prev.items.filter((i) => i.skuId !== skuId),
        };
        if (updated.items.length === 0) {
          sessionStorage.removeItem(SOP_CART_KEY);
          router.replace(`/single-order-page/${slug}/${id}`);
          return null;
        }
        sessionStorage.setItem(SOP_CART_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [router, slug, id],
  );

  // ── Build form data for checkout hook ────────────────────────────────
  const formData = useMemo(
    () => ({
      name,
      phone,
      email,
      addressType,
      address,
      city,
      locationMappingId,
      deliveryChargeId,
      note,
      paymentProvider,
    }),
    [
      name,
      phone,
      email,
      addressType,
      address,
      city,
      locationMappingId,
      deliveryChargeId,
      note,
      paymentProvider,
    ],
  );

  const canSubmitForm = checkout.canSubmit(formData);

  // ── Render ────────────────────────────────────────────────────────────
  if (!cart) return null;

  return (
    <div className="min-h-screen bg-background">
      <SOPHeader />

      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <nav className="text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-1">›</span>
          <span className="text-foreground">Checkout</span>
        </nav>
      </div>

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div>
            {checkout.step === "form" && (
              <SOPCheckoutForm
                addressType={addressType}
                name={name}
                phone={phone}
                email={email}
                address={address}
                note={note}
                paymentProvider={paymentProvider}
                deliveryChargeId={deliveryChargeId}
                permissions={checkout.permissions}
                phoneError={checkout.phoneError(phone)}
                emailError={checkout.emailError(email)}
                canSubmit={canSubmitForm}
                otpSending={checkout.otpSending}
                otpError={checkout.otpError}
                onFieldChange={handleFieldChange}
                onAddressTypeChange={setAddressType}
                onPlaceOrder={() => checkout.handlePlaceOrder(formData)}
                deliverySlot={
                  <DeliverySlot
                    charges={deliveryCharges}
                    value={deliveryChargeId}
                    onChange={setDeliveryChargeId}
                  />
                }
                paymentSlot={
                  <PaymentSlot
                    providers={paymentProviders}
                    value={paymentProvider}
                    onChange={setPaymentProvider}
                  />
                }
                areaSlot={
                  <AreaSlot
                    city={city}
                    areaName={areaName}
                    locationMappingId={locationMappingId}
                    onCityChange={setCity}
                    onAreaChange={setAreaName}
                    onLocationChange={setLocationMappingId}
                  />
                }
              />
            )}

            {checkout.step === "phone_otp" && (
              <div className="border border-border bg-card px-4 sm:px-6 rounded">
                <SOPOtpVerification
                  type="phone"
                  target={phone}
                  otp={checkout.otp}
                  onOtpChange={checkout.setOtp}
                  onVerify={() =>
                    checkout.verifyPhoneOtp(email, formData)
                  }
                  onResend={() => {
                    checkout.setOtpError("");
                    checkout.sendPhoneOtp(phone);
                  }}
                  onGoBack={checkout.goBackToForm}
                  isVerifying={checkout.otpVerifying}
                  isSending={checkout.otpSending}
                  error={checkout.otpError}
                />
              </div>
            )}

            {checkout.step === "email_otp" && (
              <div className="border border-border bg-card px-4 sm:px-6 rounded">
                <SOPOtpVerification
                  type="email"
                  target={email}
                  otp={checkout.otp}
                  onOtpChange={checkout.setOtp}
                  onVerify={() => checkout.verifyEmailOtp(formData)}
                  onResend={() => {
                    checkout.setOtpError("");
                    checkout.sendEmailOtp(email);
                  }}
                  onGoBack={checkout.goBackFromEmailOtp}
                  isVerifying={checkout.otpVerifying}
                  isSending={checkout.otpSending}
                  error={checkout.otpError}
                  phoneVerified={checkout.permissions.phoneVerifyRequired}
                />
              </div>
            )}

            {checkout.step === "placing" && (
              <div className="border border-border bg-card px-4 sm:px-6 rounded">
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
                  <p className="text-sm text-muted-foreground">
                    Placing your order...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <SOPOrderSummary
            items={cart.items}
            productImage={cart.productImage}
            subtotal={subtotal}
            itemDiscount={itemDiscount}
            deliveryAmount={deliveryAmount}
            weightExtraCharge={weightExtraCharge}
            bulkDiscount={bulkDiscount}
            grandTotal={grandTotal}
            allFreeDelivery={allFreeDelivery}
            hasMixedDelivery={hasMixedDelivery}
            paidWeightKg={paidWeightKg}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        {/* Mobile bottom bar */}
        {checkout.step === "form" && (
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden border-t border-border bg-card shadow-lg pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-base font-bold text-foreground">
                  BDT {grandTotal.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => checkout.handlePlaceOrder(formData)}
                disabled={!canSubmitForm || checkout.otpSending}
                className="h-11 px-6 bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 rounded transition-colors"
              >
                {checkout.otpSending ? "..." : "Place Order"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Inline Slot Components ───────────────────────────────────────────────────

function DeliverySlot({
  charges,
  value,
  onChange,
}: {
  charges: DeliveryChargeItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (charges.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">
        Delivery Option
      </h2>
      <div className="space-y-2">
        {charges.map((charge) => (
          <label
            key={charge.id}
            className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
              value === String(charge.id)
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/40"
            }`}
          >
            <input
              type="radio"
              name="deliveryCharge"
              value={String(charge.id)}
              checked={value === String(charge.id)}
              onChange={() => onChange(String(charge.id))}
              className="h-4 w-4 accent-primary"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {charge.title}
              </p>
              <p className="text-xs text-muted-foreground">{charge.type}</p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              ৳{charge.customer_charge}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function PaymentSlot({
  providers,
  value,
  onChange,
}: {
  providers: PaymentProviderItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (providers.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">
        Payment Method
      </h2>
      <div className="space-y-2">
        {providers.map((p) => (
          <label
            key={p.provider}
            className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
              value === p.provider
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/40"
            }`}
          >
            <input
              type="radio"
              name="paymentProvider"
              value={p.provider}
              checked={value === p.provider}
              onChange={() => onChange(p.provider)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium text-foreground">
              {p.gateway_name}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function AreaSlot({
  city,
  areaName,
  locationMappingId,
  onCityChange,
  onAreaChange,
  onLocationChange,
}: {
  city: string;
  areaName: string;
  locationMappingId: number | null;
  onCityChange: (v: string) => void;
  onAreaChange: (v: string) => void;
  onLocationChange: (v: number | null) => void;
}) {
  const [areas, setAreas] = useState<
    { city_name: string; areas: { id: number; area_name: string }[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    deliveryService
      .getAreas()
      .then((res) => {
        if (res.success && res.data) setAreas(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const selectedCity = areas.find((c) => c.city_name === city);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <select
          value={city}
          onChange={(e) => {
            onCityChange(e.target.value);
            onAreaChange("");
            onLocationChange(null);
          }}
          className="w-full border border-border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded transition-colors"
        >
          <option value="">
            {isLoading ? "Loading cities..." : "Select City"}
          </option>
          {areas.map((c) => (
            <option key={c.city_name} value={c.city_name}>
              {c.city_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={locationMappingId ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            onLocationChange(id || null);
            const area = selectedCity?.areas.find((a) => a.id === id);
            onAreaChange(area?.area_name ?? "");
          }}
          disabled={!city}
          className="w-full border border-border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded transition-colors disabled:opacity-50"
        >
          <option value="">Select Area</option>
          {selectedCity?.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.area_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
