"use client";

import Link from "next/link";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, Receipt } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { FormAppSelect } from "@/components/shared/FormAppSelect";
import { FormPhoneInput } from "@/components/phone/FormPhoneInput";
import { CheckoutDeliverySelector } from "@/components/checkout/CheckoutDeliverySelector";
import { CheckoutPaymentSelector } from "@/components/checkout/CheckoutPaymentSelector";
import { CheckoutSavedAddressSelect } from "@/components/checkout/CheckoutSavedAddressSelect";
import { CheckoutCouponField } from "@/components/checkout/CheckoutCouponField";
import type { CartItem } from "@/store/cart/types";
import {
  createCheckoutFormSchema,
  checkoutFormSchema,
  type CheckoutFormValues,
  type GuestCheckoutPermissions,
} from "@/lib/checkout/schemas";
import { useDelivery } from "@/hooks/useDelivery";
import { useAddress } from "@/hooks/useAddress";
import { readAppliedCoupon } from "@/lib/checkout/couponSession";
import type { AddressItem } from "@/lib/api/address/service";
import { parsePhoneValue } from "@/lib/phone/parse";
import {
  BD_DIVISIONS,
  getDistrictsForDivision,
  resolveAddressLocationFields,
} from "@/lib/adapters/accountAddress";
import type { AppSelectOption } from "@/lib/ui/appSelect";
import { cn } from "@/lib/utils";

const DIVISION_OPTIONS: AppSelectOption[] = BD_DIVISIONS.map((d) => ({
  value: d,
  label: d,
}));

const fieldClass =
  "w-full h-10 px-3 rounded-none border border-[#CBCBCB] bg-white text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black";

type CheckoutFormProps = Readonly<{
  items: CartItem[];
  totalPrice: number;
  isAuthenticated: boolean;
  permissions: GuestCheckoutPermissions;
  isSubmitting: boolean;
  defaultValues: CheckoutFormValues;
  customerId?: number;
  onSubmit: (values: CheckoutFormValues) => Promise<void>;
}>;

function phoneFromAddress(addr: AddressItem): string {
  return addr.phone?.number ?? "";
}

/**
 * Graduate checkout layout:
 * left Card (customer + delivery + payment + CTA) | right sticky summary 420px
 */
export function CheckoutForm({
  items,
  totalPrice,
  isAuthenticated,
  permissions,
  isSubmitting,
  defaultValues,
  customerId,
  onSubmit,
}: CheckoutFormProps) {
  const { deliveryCharges } = useDelivery();
  const { addresses, addressesLoading } = useAddress();

  const schema = useMemo(
    () =>
      isAuthenticated
        ? checkoutFormSchema
        : createCheckoutFormSchema(permissions),
    [isAuthenticated, permissions],
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues,
    mode: "onTouched",
  });

  const { control, handleSubmit, watch, setValue, formState, reset } = form;
  const deliveryChargeId = watch("deliveryChargeId");
  const paymentProvider = watch("paymentProvider");
  const addressId = watch("addressId") ?? "";
  const couponCode = watch("couponCode") ?? "";
  const selectedDivision = useWatch({ control, name: "division" });
  const selectedCity = useWatch({ control, name: "city" });
  const previousDivisionRef = useRef(selectedDivision);

  useEffect(() => {
    const stored = readAppliedCoupon();
    const next = {
      ...defaultValues,
      couponCode: stored?.code ?? defaultValues.couponCode ?? "",
    };
    reset(next);
    previousDivisionRef.current = next.division;
  }, [defaultValues, reset]);

  const districtOptions = useMemo((): AppSelectOption[] => {
    const base = getDistrictsForDivision(selectedDivision).map((d) => ({
      value: d,
      label: d,
    }));
    // Keep legacy free-text city visible while editing until user re-picks.
    if (selectedCity && !base.some((option) => option.value === selectedCity)) {
      return [{ value: selectedCity, label: selectedCity }, ...base];
    }
    return base;
  }, [selectedDivision, selectedCity]);

  useEffect(() => {
    if (previousDivisionRef.current === selectedDivision) return;
    previousDivisionRef.current = selectedDivision;

    if (!selectedDivision) {
      setValue("city", "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    const allowed = getDistrictsForDivision(selectedDivision);
    if (selectedCity && !allowed.includes(selectedCity)) {
      setValue("city", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedDivision, selectedCity, setValue]);

  const shippingFee = useMemo(() => {
    const found = deliveryCharges.find(
      (c) => String(c.id) === String(deliveryChargeId),
    );
    return found ? Number(found.customer_charge) || 0 : 0;
  }, [deliveryChargeId, deliveryCharges]);

  const couponDiscount = useMemo(() => {
    const stored = readAppliedCoupon();
    if (!stored || !couponCode) return 0;
    if (stored.code.toLowerCase() !== couponCode.toLowerCase()) return 0;
    return stored.discountAmount;
  }, [couponCode]);

  const grandTotal = Math.max(0, totalPrice + shippingFee - couponDiscount);

  const applySavedAddress = (id: string, addr: AddressItem | null) => {
    setValue("addressId", id, { shouldDirty: true });
    if (!addr) return;

    const location = resolveAddressLocationFields(addr);

    setValue("name", addr.name || "", { shouldDirty: true, shouldValidate: true });
    // Sync ref first so the division-change effect does not clear district.
    previousDivisionRef.current = location.division;
    setValue("division", location.division, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("city", location.district, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("address", location.address, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("zipCode", addr.zip_code || "", { shouldDirty: true });
    const phone = phoneFromAddress(addr);
    if (phone) {
      const e164 = parsePhoneValue(phone, "BD").e164 || phone;
      setValue("phone", e164, { shouldDirty: true, shouldValidate: true });
    }
  };

  const scrollToFirstError = () => {
    const order: (keyof CheckoutFormValues)[] = [
      "name",
      "phone",
      "email",
      "address",
      "city",
      "division",
      "deliveryChargeId",
      "paymentProvider",
    ];
    const first = order.find((key) => formState.errors[key]);
    if (!first) return;
    const el = document.querySelector<HTMLElement>(
      `[data-checkout-error="${first}"], [name="${first}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <form
        id="checkout-form"
        onSubmit={handleSubmit(
          async (values) => {
            await onSubmit(values);
          },
          () => scrollToFirstError(),
        )}
        className="sm:mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] pb-28 sm:pb-0"
        noValidate
      >
        {/* ── Left: CheckoutLeft clone ── */}
        <div
          className={cn(
            "rounded-none border-none bg-white",
            "shadow-[0px_0px_10px_rgba(0,0,0,0.10)]",
            "px-2 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6",
          )}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-black" />
            <h1 className="text-[22px] font-semibold text-black">Checkout</h1>
          </div>

          <div className="space-y-4">
            {/* Customer / address */}
            <div className="space-y-2" data-checkout-error="addressId">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-black">
                  {isAuthenticated
                    ? "Delivery address"
                    : "Customer information"}
                </h2>
                {!isAuthenticated ? (
                  <Link
                    href="/account"
                    className="text-sm font-medium text-[#0088FF] hover:underline"
                  >
                    Sign In
                  </Link>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isAuthenticated ? (
                  <CheckoutSavedAddressSelect
                    addresses={addresses}
                    loading={addressesLoading}
                    value={addressId}
                    onChange={applySavedAddress}
                  />
                ) : null}

                <FormAppInput
                  control={control}
                  name="name"
                  label="Full Name"
                  labelClassName="text-xs font-medium mb-1 block text-black"
                  placeholder="Your name"
                  sanitize="text"
                  maxLength={80}
                  inputSize="sm"
                  containerClassName="sm:col-span-2"
                  className={fieldClass}
                  required
                />
                {!isAuthenticated ? (
                  <FormAppInput
                    control={control}
                    name="email"
                    label="Email"
                    labelClassName="text-xs font-medium mb-1 block text-black"
                    type="email"
                    placeholder="email@example.com"
                    sanitize="email"
                    inputSize="sm"
                    containerClassName="sm:col-span-2"
                    className={fieldClass}
                    required={permissions.email_required}
                  />
                ) : null}
                <FormPhoneInput
                  control={control}
                  name="phone"
                  label="Mobile"
                  labelClassName="text-xs font-medium mb-1 block text-black"
                  detectCountry
                  required
                  triggerClassName={cn(
                    "h-10 shrink-0 rounded-none border border-[#CBCBCB] border-r-0 bg-white px-2",
                    "hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0",
                  )}
                  inputClassName={cn(
                    "h-10 w-full rounded-none border border-[#CBCBCB] border-l-0 bg-white px-3 text-sm",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0",
                  )}
                />
                <FormAppInput
                  control={control}
                  name="address"
                  label="Full Address"
                  labelClassName="text-xs font-medium mb-1 block text-black"
                  placeholder="House, Road, Area"
                  sanitize="text"
                  maxLength={200}
                  inputSize="sm"
                  className={fieldClass}
                  required
                />
                <div data-checkout-error="division">
                  <FormAppSelect
                    control={control}
                    name="division"
                    label="Division"
                    labelClassName="text-xs font-medium mb-1 block text-black"
                    options={DIVISION_OPTIONS}
                    placeholder="Select division"
                    searchable
                    layer="page"
                    required
                    triggerClassName={cn(
                      fieldClass,
                      "rounded-none h-10 text-sm",
                    )}
                  />
                </div>
                <div data-checkout-error="city">
                  <FormAppSelect
                    control={control}
                    name="city"
                    label="District / City"
                    labelClassName="text-xs font-medium mb-1 block text-black"
                    options={districtOptions}
                    placeholder={
                      selectedDivision
                        ? "Select district"
                        : "Select division first"
                    }
                    searchable
                    layer="page"
                    required
                    disabled={!selectedDivision}
                    triggerClassName={cn(
                      fieldClass,
                      "rounded-none h-10 text-sm",
                    )}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block text-black">
                    Order notes{" "}
                    <span className="text-[#888] font-normal">(optional)</span>
                  </label>
                  <Controller
                    control={control}
                    name="orderNotes"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value.slice(0, 500))
                        }
                        className={cn(
                          fieldClass,
                          "h-auto py-2 min-h-[72px]",
                        )}
                        rows={2}
                        placeholder="Any special instructions"
                        maxLength={500}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1" data-checkout-error="deliveryChargeId">
              <CheckoutDeliverySelector
                value={deliveryChargeId}
                onChange={(v) =>
                  setValue("deliveryChargeId", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={formState.errors.deliveryChargeId?.message}
              />
            </div>

            <div className="space-y-1" data-checkout-error="paymentProvider">
              <CheckoutPaymentSelector
                value={paymentProvider}
                onChange={(v) =>
                  setValue("paymentProvider", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={formState.errors.paymentProvider?.message}
              />
            </div>

            <div className="pt-2 sm:sticky sm:z-10 sm:-bottom-5">
              <AppButton
                type="submit"
                className="hidden sm:flex h-12 w-full rounded-none bg-black text-white hover:bg-black/90"
                disabled={items.length === 0}
                isLoading={isSubmitting}
                loadingText="Placing order…"
              >
                Place Order
              </AppButton>
              <p className="sm:mt-2 text-center text-xs text-muted-foreground">
                By placing your order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: OrderSummary clone ── */}
        <aside
          className={cn(
            "sm:sticky sm:top-20 h-fit border-0 bg-white",
            "shadow-[0px_0px_10px_rgba(0,0,0,0.10)]",
          )}
        >
          <div className="flex items-center gap-2 text-lg font-semibold border-b border-[#F1F1F1] py-4 px-3 text-black">
            <Receipt className="h-5 w-5" />
            Order Summary
          </div>

          <div className="px-3 mb-4 pt-2 space-y-0 max-h-[17.5rem] overflow-y-auto">
            <h3 className="text-sm font-semibold text-black py-2">
              Items in Cart
            </h3>
            {items.map(({ product, quantity, productVariationId }) => (
              <div
                key={`${product.id}:${productVariationId ?? "default"}`}
                className="flex items-center gap-3 border-b border-[#F1F1F1] py-4"
              >
                <img
                  src={product.image}
                  alt=""
                  className="h-12 w-12 object-cover border border-[#f1f1f1] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-black">
                    {product.title}
                  </p>
                  <p className="text-xs text-black/60">×{quantity}</p>
                </div>
                <span className="text-sm font-semibold shrink-0 text-black">
                  BDT {(product.price * quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <CheckoutCouponField
            items={items}
            customerId={customerId}
            value={couponCode}
            variant="summary"
            onApplied={(code) =>
              setValue("couponCode", code, { shouldDirty: true })
            }
            onCleared={() =>
              setValue("couponCode", "", { shouldDirty: true })
            }
          />

          <div className="space-y-3 px-3 py-4 text-sm text-black">
            <div className="flex justify-between">
              <span className="font-normal">Subtotal</span>
              <span className="font-semibold">
                BDT {totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-normal">Delivery charge</span>
              <span
                className={cn(
                  "font-semibold",
                  shippingFee === 0 && "text-green-600",
                )}
              >
                {shippingFee === 0
                  ? "FREE"
                  : `BDT ${shippingFee.toLocaleString()}`}
              </span>
            </div>
            {couponDiscount > 0 ? (
              <div className="flex justify-between">
                <span className="font-normal">Coupon discount</span>
                <span className="font-semibold text-green-600">
                  −BDT {couponDiscount.toLocaleString()}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-[#F1F1F1] pt-3 text-base font-semibold">
              <span>Total amount</span>
              <span>BDT {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </form>

      {/* Mobile sticky Place Order — graduate */}
      <div className="block sm:hidden fixed bottom-0 right-0 left-0 bg-white border-0 shadow-[0px_-2px_20px_rgba(0,0,0,0.06)] p-2 space-y-1.5 z-30">
        <div className="flex justify-between text-base font-semibold text-black">
          <span>Total amount</span>
          <span>BDT {grandTotal.toLocaleString()}</span>
        </div>
        <AppButton
          type="submit"
          form="checkout-form"
          className="h-12 w-full rounded-none bg-black text-white hover:bg-black/90"
          disabled={items.length === 0}
          isLoading={isSubmitting}
          loadingText="Placing order…"
        >
          Place Order
        </AppButton>
      </div>
    </>
  );
}
