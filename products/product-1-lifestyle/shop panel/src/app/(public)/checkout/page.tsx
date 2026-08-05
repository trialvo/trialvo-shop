"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import ConfirmationModal from "@/components/shared/ConfirmationModal";
import {
  CheckoutStepper, OrderTypeSelector, ShippingForm, BillingForm, PaymentForm,
  OrderSummary, BulkComboBuilder,
} from "@/components/checkout";

import { useAppSelector, useAppDispatch } from "@/store";
import { selectCartItems, clearCart, setGuestId } from "@/store/slices/cartSlice";
import { deliveryService } from "@/lib/api/delivery/service";
import {
  getPaymentProviders,
  paymentProviderKeys,
} from "@/lib/api/payment/service";
import {
  createGuestCheckoutId,
  submitCheckoutOrder,
} from "@/lib/checkout/checkout-order";
import {
  isGatewayPaymentProvider,
  type CheckoutPaymentType,
  type GatewayPaymentProvider,
} from "@/lib/checkout/payment-types";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { toast } from "@/hooks/use-toast";
import { useCheckoutOptions, type SpecialCheckoutOrderType } from "@/hooks/useCheckoutOptions";
import { shippingSchema, billingSchema } from "@/lib/validation/checkout";
import type { ShippingFormData, BillingFormData } from "@/lib/validation/checkout";
import type { OrderType, CartItem, Address } from "@/types";
import type { CheckoutStep } from "@/components/checkout";

type CheckoutFlowStep = "type" | CheckoutStep;

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const appliedCoupon = useAppSelector((s) => s.cart.appliedCoupon);
  const storedGuestId = useAppSelector((s) => s.cart.guestId);

  const initialOrderType: OrderType = isAuthenticated ? "standard" : "guest";
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [step, setStep] = useState<CheckoutFlowStep>("shipping");
  const [showPlaceOrderConfirm, setShowPlaceOrderConfirm] = useState<boolean>(false);
  const [sameAsShipping, setSameAsShipping] = useState<boolean>(true);
  const [selectedPaymentType, setSelectedPaymentType] = useState<CheckoutPaymentType>("gateway");
  const [checkoutGuestId] = useState(() => storedGuestId?.id || createGuestCheckoutId());
  const paymentTypeInitialized = useRef(false);
  const checkoutFlowInitialized = useRef(false);

  const [customItemsByType, setCustomItemsByType] = useState<Record<SpecialCheckoutOrderType, CartItem[]>>({
    bulk: [],
    combo: [],
  });
  const checkoutOptions = useCheckoutOptions(isAuthenticated);

  const { data: deliveryCharges = [] } = useQuery({
    queryKey: ["checkout", "delivery-charges"],
    queryFn: async () => {
      const response = await deliveryService.getCharges();
      return response.delivery_charges;
    },
  });

  const { data: paymentProviders } = useQuery({
    queryKey: paymentProviderKeys.list({ is_active: true }),
    queryFn: () => getPaymentProviders({ is_active: true }),
  });

  const selectedDeliveryCharge = deliveryCharges[0] ?? null;
  const activePaymentProviders = useMemo(
    () => paymentProviders?.providers.filter((provider) => provider.is_active) ?? [],
    [paymentProviders],
  );
  const codAvailable = activePaymentProviders.some((provider) => provider.provider === "cod");
  const gatewayProvider = useMemo<GatewayPaymentProvider | null>(() => {
    const activeGatewayProviders = activePaymentProviders
      .map((provider) => provider.provider)
      .filter(isGatewayPaymentProvider);
    const defaultProvider = paymentProviders?.default_provider;

    if (
      isGatewayPaymentProvider(defaultProvider) &&
      activeGatewayProviders.includes(defaultProvider)
    ) {
      return defaultProvider;
    }

    return activeGatewayProviders[0] ?? null;
  }, [activePaymentProviders, paymentProviders?.default_provider]);
  const gatewayProviderLabel = activePaymentProviders.find(
    (provider) => provider.provider === gatewayProvider,
  )?.gateway_name || gatewayProvider || "online payment";

  useEffect(() => {
    const preferredPaymentType = getPreferredPaymentType(
      paymentProviders?.default_provider,
      gatewayProvider,
      codAvailable,
    );
    if (!preferredPaymentType) return;

    setSelectedPaymentType((current) => {
      if (
        paymentTypeInitialized.current &&
        isPaymentTypeAvailable(current, gatewayProvider, codAvailable)
      ) {
        return current;
      }

      paymentTypeInitialized.current = true;
      return preferredPaymentType;
    });
  }, [codAvailable, gatewayProvider, paymentProviders?.default_provider]);

  const isBulkOrCombo = orderType === "bulk" || orderType === "combo";
  const customItems = isBulkOrCombo
    ? customItemsByType[orderType as SpecialCheckoutOrderType]
    : [];
  const setCurrentCustomItems = useCallback((nextItems: CartItem[]) => {
    if (orderType !== "bulk" && orderType !== "combo") return;
    setCustomItemsByType((current) => ({
      ...current,
      [orderType]: nextItems,
    }));
  }, [orderType]);
  const activeItems = isBulkOrCombo && customItems.length > 0 ? customItems : items;
  const netSubtotal = roundMoney(activeItems.reduce((acc, i) => acc + i.price * i.quantity, 0));
  const originalSubtotal = roundMoney(activeItems.reduce(
    (acc, i) => acc + (i.originalPrice || i.price) * i.quantity,
    0,
  ));
  const activeSubtotal = isBulkOrCombo ? originalSubtotal : netSubtotal;
  const discount = isBulkOrCombo ? roundMoney(Math.max(0, originalSubtotal - netSubtotal)) : 0;
  const discountRate = activeSubtotal > 0 ? discount / activeSubtotal : 0;
  const discountedSubtotal = roundMoney(activeSubtotal - discount);
  const shipping = discountedSubtotal >= 150 ? 0 : selectedDeliveryCharge?.customer_charge ?? 15;
  const tax = Math.round(discountedSubtotal * 0.05 * 100) / 100;
  const total = discountedSubtotal + shipping + tax;
  const selectedPaymentAvailable = isPaymentTypeAvailable(
    selectedPaymentType,
    gatewayProvider,
    codAvailable,
  );
  const availableOrderTypeKey = checkoutOptions.availableOrderTypes.join("|");
  const bulkMinQuantityBySku = useMemo(() => {
    const minQuantityBySku = new Map<number, number>();
    for (const offer of checkoutOptions.bulkOffers) {
      if (!offer.productVariationId) continue;
      minQuantityBySku.set(offer.productVariationId, offer.minQuantity);
    }
    return minQuantityBySku;
  }, [checkoutOptions.bulkOffers]);

  useEffect(() => {
    if (checkoutOptions.isLoading) return;

    const isFirstRun = !checkoutFlowInitialized.current;

    setOrderType((current) =>
      checkoutOptions.availableOrderTypes.includes(current)
        ? current
        : checkoutOptions.baseOrderType,
    );

    setStep((current) => {
      if (!checkoutOptions.hasTypeStep) {
        if (current === "type" || current === "customize") return "shipping";
        return current;
      }

      if (isFirstRun) return "type";
      if (current === "customize" && orderType !== "bulk" && orderType !== "combo") {
        return "type";
      }
      return current;
    });

    checkoutFlowInitialized.current = true;
  }, [
    availableOrderTypeKey,
    checkoutOptions.baseOrderType,
    checkoutOptions.hasTypeStep,
    checkoutOptions.isLoading,
    checkoutOptions.availableOrderTypes,
    orderType,
  ]);

  const placeOrderMutation = useMutation({
    mutationFn: submitCheckoutOrder,
    onSuccess: (result) => {
      if (result.guestOrderId) {
        dispatch(setGuestId({
          id: result.guestOrderId,
          timestamp: Date.now(),
          generatedAt: new Date().toISOString(),
        }));
      }

      const redirectUrl = getSafeRedirectUrl(result.redirectUrl);

      dispatch(clearCart());

      // Gateway payment → redirect to external provider.
      // The gateway will call back to /checkout/fallback which
      // normalises the result and sends the user to success/failed.
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      if (result.redirectUrl) {
        toast({
          title: "Payment redirect was blocked because it was not a valid URL.",
          variant: "destructive",
        });
      }

      // COD or gateway-not-required → go straight to success page
      router.push(`/checkout/success?orderId=${encodeURIComponent(result.confirmationId)}`);
    },
    onError: (error: unknown) => {
      toast({
        title: getUnknownErrorMessage(error, "Failed to place order"),
        variant: "destructive",
      });
    },
  });

  /* ── RHF address form instances ───────────────────── */
  const shippingForm = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      firstName: "", lastName: "", email: user?.email ?? "", phone: user?.phone ?? "",
      address: "", city: "", state: "", zip: "", country: "United Arab Emirates",
    },
  });
  const billingForm = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      billingFirstName: "", billingLastName: "", billingAddress: "", billingCity: "",
      billingState: "", billingZip: "", billingCountry: "United Arab Emirates",
    },
  });
  useEffect(() => {
    if (user?.email && !shippingForm.getValues("email")) {
      shippingForm.setValue("email", user.email);
    }

    if (user?.phone && !shippingForm.getValues("phone")) {
      shippingForm.setValue("phone", user.phone);
    }
  }, [shippingForm, user?.email, user?.phone]);

  /* ── Autofill helpers ───────────────────────────── */
  const fillShipping = (addr: Address) => {
    const [first, ...rest] = addr.fullName.split(" ");
    shippingForm.setValue("firstName", first ?? "");
    shippingForm.setValue("lastName", rest.join(" "));
    shippingForm.setValue("address", addr.street);
    shippingForm.setValue("city", addr.city);
    shippingForm.setValue("state", addr.state ?? "");
    shippingForm.setValue("zip", addr.zip);
    shippingForm.setValue("country", addr.country);
    if (addr.phone) shippingForm.setValue("phone", addr.phone);
  };

  const fillBilling = (addr: Address) => {
    const [first, ...rest] = addr.fullName.split(" ");
    billingForm.setValue("billingFirstName", first ?? "");
    billingForm.setValue("billingLastName", rest.join(" "));
    billingForm.setValue("billingAddress", addr.street);
    billingForm.setValue("billingCity", addr.city);
    billingForm.setValue("billingState", addr.state ?? "");
    billingForm.setValue("billingZip", addr.zip);
    billingForm.setValue("billingCountry", addr.country);
  };

  /* ── Navigation ─────────────────────────────────── */
  const handleOrderTypeSelect = useCallback((nextOrderType: OrderType) => {
    if (!checkoutOptions.availableOrderTypes.includes(nextOrderType)) return;
    setOrderType(nextOrderType);
  }, [checkoutOptions.availableOrderTypes]);

  const handleContinue = () => {
    if (step === "type") {
      if (!checkoutOptions.availableOrderTypes.includes(orderType)) {
        toast({
          title: "Selected order type is unavailable.",
          variant: "destructive",
        });
        return;
      }
      setStep(isBulkOrCombo ? "customize" : "shipping");
      return;
    }
    if (step === "customize") {
      if (customItems.length === 0) {
        toast({
          title: orderType === "bulk"
            ? "Please select at least one active bulk offer."
            : "Please select at least one active combo deal.",
          variant: "destructive",
        });
        return;
      }

      if (orderType === "bulk") {
        const invalidItem = customItems.find((item) => {
          const skuId = item.productVariationId ?? 0;
          const minQuantity = bulkMinQuantityBySku.get(skuId);
          return !minQuantity || item.quantity < minQuantity;
        });

        if (invalidItem) {
          toast({
            title: "Please meet the minimum quantity for every selected bulk offer.",
            variant: "destructive",
          });
          return;
        }
      }

      if (orderType === "combo" && !checkoutOptions.availability.combo) {
        toast({
          title: "Combo orders are currently unavailable.",
          variant: "destructive",
        });
        return;
      }

      setStep("shipping"); return;
    }
    if (step === "shipping") {
      shippingForm.handleSubmit(async () => {
        if (!sameAsShipping) { const valid = await billingForm.trigger(); if (!valid) return; }
        setStep("payment");
      })();
      return;
    }

    if (!selectedPaymentAvailable) {
      toast({
        title: "Selected payment method is unavailable. Please choose another method.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPaymentType === "cod") {
      setShowPlaceOrderConfirm(true);
      return;
    }

    setShowPlaceOrderConfirm(true);
  };

  const goBack = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "shipping" && isBulkOrCombo) setStep("customize");
    else if (step === "shipping" && checkoutOptions.hasTypeStep) setStep("type");
    else if (step === "customize") setStep("type");
    else setStep("type");
  };

  /* ── Place order ─────────────────────────────────── */
  const confirmOrder = async () => {
    const s = shippingForm.getValues();
    const b = billingForm.getValues();

    await placeOrderMutation.mutateAsync({
      items: activeItems,
      orderType,
      shipping: s,
      billing: {
        sameAsShipping,
        values: b,
      },
      isAuthenticated,
      savedAddresses: user?.addresses,
      deliveryChargeId: selectedDeliveryCharge?.id,
      couponCode: appliedCoupon?.coupon,
      guestOrderId: checkoutGuestId,
      paymentType: selectedPaymentType,
      gatewayProvider,
    });
  };

  /* ── Empty cart guard ───────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
          <Link href="/" className="text-accent hover:text-accent/80 text-sm tracking-widest uppercase">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const stepList: CheckoutStep[] = isBulkOrCombo
    ? ["customize", "shipping", "payment"]
    : ["shipping", "payment"];
  const canGoBack = step === "payment" ||
    step === "customize" ||
    (step === "shipping" && (isBulkOrCombo || checkoutOptions.hasTypeStep));

  const ctaLabel =
    step === "type" ? "Continue"
    : step === "customize" ? "Continue to Shipping"
    : step === "shipping" ? "Continue to Payment"
    : "Place Order";

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground tracking-wider uppercase">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">Checkout</span>
        </nav>
      </div>

      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-16">
        {!checkoutOptions.isLoading && step !== "type" && (
          <CheckoutStepper steps={stepList} currentStep={step} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-6">
            {checkoutOptions.isLoading ? (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">
                  Checkout
                </h2>
                <div className="bg-secondary/50 border border-border p-4 rounded text-sm text-muted-foreground">
                  Loading checkout options...
                </div>
              </div>
            ) : (
              <>
                {step === "type" && (
                  <OrderTypeSelector
                    orderType={orderType}
                    isAuthenticated={isAuthenticated}
                    availableOrderTypes={checkoutOptions.availableOrderTypes}
                    onSelect={handleOrderTypeSelect}
                  />
                )}
                {step === "customize" && (
                  <BulkComboBuilder
                    mode={orderType as "bulk" | "combo"}
                    selectedItems={customItems}
                    onItemsChange={setCurrentCustomItems}
                    bulkOffers={checkoutOptions.bulkOffers}
                    comboDeals={checkoutOptions.comboDeals}
                  />
                )}
                {step === "shipping" && (
                  <div className="space-y-6">
                    <ShippingForm form={shippingForm} savedAddresses={user?.addresses} onFillFromAddress={fillShipping} />
                    <BillingForm form={billingForm} sameAsShipping={sameAsShipping} onToggleSame={setSameAsShipping} savedAddresses={user?.addresses} onFillFromAddress={fillBilling} />
                  </div>
                )}
                {step === "payment" && (
                  <PaymentForm
                    paymentType={selectedPaymentType}
                    onPaymentTypeChange={(value) => {
                      paymentTypeInitialized.current = true;
                      setSelectedPaymentType(value);
                    }}
                    codAvailable={codAvailable}
                    gatewayAvailable={gatewayProvider !== null}
                    gatewayLabel={gatewayProviderLabel}
                  />
                )}
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {canGoBack && !checkoutOptions.isLoading && (
                <button type="button" onClick={goBack} className="px-6 h-11 border border-border text-xs tracking-[0.2em] uppercase font-medium text-foreground hover:bg-secondary transition-colors rounded">
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={placeOrderMutation.isPending || checkoutOptions.isLoading}
                className="flex-1 h-11 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.2em] uppercase font-medium transition-colors rounded disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {ctaLabel}
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <OrderSummary
              items={activeItems}
              orderType={orderType}
              subtotal={activeSubtotal}
              discount={discount}
              discountRate={discountRate}
              shipping={shipping}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={showPlaceOrderConfirm}
        onClose={() => setShowPlaceOrderConfirm(false)}
        onConfirm={confirmOrder}
        title="Place Order?"
        message={`You're about to place a${orderType === "guest" ? " guest" : orderType === "bulk" ? " bulk" : orderType === "combo" ? " combo" : "n"} order for $${total.toFixed(2)} with ${selectedPaymentType === "cod" ? "cash on delivery" : "online payment"}.`}
        confirmLabel={placeOrderMutation.isPending ? "Placing..." : "Place Order"}
        variant="info"
        loading={placeOrderMutation.isPending}
      />
    </div>
  );
}

function getPreferredPaymentType(
  defaultProvider: string | null | undefined,
  gatewayProvider: GatewayPaymentProvider | null,
  codAvailable: boolean,
): CheckoutPaymentType | null {
  if (defaultProvider === "cod" && codAvailable) return "cod";
  if (gatewayProvider) return "gateway";
  return codAvailable ? "cod" : null;
}

function isPaymentTypeAvailable(
  paymentType: CheckoutPaymentType,
  gatewayProvider: GatewayPaymentProvider | null,
  codAvailable: boolean,
): boolean {
  return paymentType === "cod" ? codAvailable : gatewayProvider !== null;
}

function getSafeRedirectUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
