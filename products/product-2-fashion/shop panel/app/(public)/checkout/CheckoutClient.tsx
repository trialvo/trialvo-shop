"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import CheckoutLeft from "@/components/checkout/CheckoutLeft";
import CheckoutRight from "@/components/checkout/CheckoutRight";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBuyNowGuestOrderEffect } from "@/hooks/useBuyNowGuestOrderEffect";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import { useOrder } from "@/hooks/useOrder";
import { UpdateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { CreateOrderPayload } from "@/lib/api/order/service";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { useCartSync } from "@/hooks/useCartSync";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAppliedCoupon, selectBuyNowId, selectBuyNowItems, selectCartItems, selectCartTotals, selectGuestId } from "@/redux/selectors/cartSelectors";
import { clearCart, setAppliedCoupon } from "@/redux/slices/cartSlice";
import { setError } from "@/redux/slices/uiSlice";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomerInformationFormRef } from "@/form/CustomerInformationForm";

type CheckoutFormValues = {
  addressId: string;
  deliveryChargeId: string;
  paymentProvider: string;
  coupon?: string;
};

type OrderItemPayload = {
  product_variation_id: number;
  quantity: number;
};

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function toNonZeroQty(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function buildOrderItemsFromCart(items: unknown[]): OrderItemPayload[] {
  return items
    .map((it): OrderItemPayload | null => {
      if (!it || typeof it !== "object") return null;

      const obj = it as {
        productVariationId?: unknown;
        product_variation_id?: unknown;
        quantity?: unknown;
      };

      const variationId =
        toPositiveInt(obj.productVariationId) ?? toPositiveInt(obj.product_variation_id);

      const qty = toNonZeroQty(obj.quantity);

      if (!variationId || !qty) return null;

      return { product_variation_id: variationId, quantity: qty };
    })
    .filter((x): x is OrderItemPayload => x !== null);
}

// function buildOrderItemsFromBuyNow(raw: string | null): OrderItemPayload[] {
//   if (!raw) return [];

//   try {
//     const parsed: unknown = JSON.parse(raw);
//     if (!parsed || typeof parsed !== "object") return [];

//     const obj = parsed as {
//       productVariationId?: unknown;
//       product_variation_id?: unknown;
//       variationId?: unknown;
//       quantity?: unknown;
//       qty?: unknown;
//     };

//     const variationId =
//       toPositiveInt(obj.productVariationId) ??
//       toPositiveInt(obj.product_variation_id) ??
//       toPositiveInt(obj.variationId);

//     const qty = toNonZeroQty(obj.quantity) ?? toNonZeroQty(obj.qty);

//     if (!variationId || !qty) return [];

//     return [{ product_variation_id: variationId, quantity: qty }];
//   } catch {
//     return [];
//   }
// }

const CheckoutClient: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { createOrder, initiatePayment } = useOrder();
  const { resendOtp, verifyPhone, initiateGuestOrder, initiateGuestPayment, isUpdating, isInitiating, isInitiatingPayment, updateGuestOrder, getOrderPermissions } = useGuestOrder();
  const { syncCart, isSyncing } = useCartSync();


  const buyNowId = useAppSelector(selectBuyNowId);
  const items = useAppSelector(selectCartItems);
  const buyNowItems = useAppSelector(selectBuyNowItems);
  const total = useAppSelector(selectCartTotals);
  const appliedCoupon = useAppSelector(selectAppliedCoupon);
  const guestOrderId = useAppSelector(selectGuestId)?.id;

  const notBuyNow = buyNowId === null;
  const orderItems = notBuyNow ? items : buyNowItems;

  useBuyNowGuestOrderEffect(buyNowItems, 800);

  /* ── Analytics: InitiateCheckout ── */
  const { trackInitiateCheckout } = useAnalytics();
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current) return;
    if (!orderItems?.length) return;
    checkoutTracked.current = true;
    const totalValue = orderItems.reduce((sum, item) => {
      const it = item as { price?: number; quantity?: number };
      return sum + ((it.price ?? 0) * (it.quantity ?? 1));
    }, 0);
    trackInitiateCheckout({
      value: totalValue,
      num_items: orderItems.length,
      content_ids: orderItems.map((it) => String((it as { productId?: string }).productId ?? "")),
    });
  }, [orderItems, trackInitiateCheckout]);

  // Sync cart only on initial load
  useEffect(() => {
    syncCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const buyNowRaw = useBuyNowRaw();

  const form = useForm<CheckoutFormValues>({
    mode: "onSubmit",
    defaultValues: {
      addressId: "",
      deliveryChargeId: "",
      paymentProvider: "",
      coupon: "",
    },
  });

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  const addressId = watch("addressId");
  const deliveryChargeId = watch("deliveryChargeId");
  const paymentProvider = watch("paymentProvider");
  const coupon = watch("coupon");

  // Ref for guest checkout form validation
  const guestFormRef = useRef<CustomerInformationFormRef | null>(null);

  // Scroll to the first error section
  const scrollToFirstError = useCallback((errors: FieldErrors<CheckoutFormValues>) => {
    const fieldOrder: (keyof CheckoutFormValues)[] = ["addressId", "deliveryChargeId", "paymentProvider"];
    const firstErrorField = fieldOrder.find((f) => errors[f]);
    if (firstErrorField) {
      const el = document.querySelector<HTMLElement>(`[data-checkout-error="${firstErrorField}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, []);

  const setAddressId: React.Dispatch<React.SetStateAction<string>> = React.useCallback(
    (next) => {
      const prev = getValues("addressId");
      const value = typeof next === "function" ? next(prev) : next;
      setValue("addressId", value, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue],
  );

  const setDeliveryId: React.Dispatch<React.SetStateAction<string>> = React.useCallback(
    (next) => {
      const prev = getValues("deliveryChargeId");
      const value = typeof next === "function" ? next(prev) : next;
      setValue("deliveryChargeId", value, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue],
  );

  const setProvider: React.Dispatch<React.SetStateAction<string>> = React.useCallback(
    (next) => {
      const prev = getValues("paymentProvider");
      const value = typeof next === "function" ? next(prev) : next;
      setValue("paymentProvider", value, { shouldValidate: true, shouldDirty: true });
    },
    [getValues, setValue],
  );

  const setCoupon: React.Dispatch<React.SetStateAction<string>> = React.useCallback(
    (next) => {
      const prev = getValues("coupon") ?? "";
      const value = typeof next === "function" ? next(prev) : next;
      setValue("coupon", value, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  const [phoneNumber] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("phone_number") ?? "";
  });
  // Guest order permissions — only email_required is dynamic.
  // Email OTP verification (email_verification_required) was removed in V2-044.
  const [guestPermissions, setGuestPermissions] = useState({
    email_required: true,
    phone_verification_required: true,
  });

  useEffect(() => {
    getOrderPermissions().then((perms) => {
      setGuestPermissions({
        email_required: perms.email_required,
        phone_verification_required: perms.phone_verification_required,
      });
    }).catch(() => {}); // fallback to defaults on error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const [guestInfo, setGuestInfo] = useState<UpdateGuestOrderPayload | null>(null);

  const handleGuestInfoUpdate = useCallback((data: UpdateGuestOrderPayload) => {
    setGuestInfo(data);
  }, []);


  const onSubmit = async (values: CheckoutFormValues) => {
    try {
      // const buyNowItems = buildOrderItemsFromBuyNow(buyNowRaw);

      const cartItems = buildOrderItemsFromCart(orderItems as unknown[]);
      // const orderItems = buyNowItems?.length ? buyNowItems : cartItems;

      if (!cartItems.length) return;

      const addressIdNum = Number(values.addressId);
      const deliveryIdNum = Number(values.deliveryChargeId);

      if (!Number.isFinite(addressIdNum) || addressIdNum <= 0) return;
      if (!Number.isFinite(deliveryIdNum) || deliveryIdNum <= 0) return;

      const provider = (values.paymentProvider ?? "").trim();
      if (!provider) return;

      const typeForPayment = provider === "cod" ? "cod" : "gateway";

      const payload: CreateOrderPayload = {
        address_id: addressIdNum,
        payment_type: typeForPayment,
        delivery_charge_id: deliveryIdNum,
        note: "I am order",
        coupon_code: (appliedCoupon?.coupon ?? "").trim() || "",
        order_items: cartItems,
      };

      const res = await createOrder.mutateAsync(payload);

      const orderId = Number(res?.order_id);
      if (!Number.isFinite(orderId) || orderId <= 0) return;

      if (provider !== "cod" && res?.payment?.url) {
        const payRes = await initiatePayment.mutateAsync({
          orderId,
          payment_method: provider === "cod" ? "" : provider,
        });

        const urlFromInitiate =
          typeof (payRes as { url?: unknown })?.url === "string"
            ? String((payRes as { url?: unknown }).url).trim()
            : "";

        if (urlFromInitiate) {
          globalThis.location.href = urlFromInitiate;
        }
      } else {
        if (provider === "cod") {
          router?.push(`/checkout/success?orderId=${orderId}`)
        }
      }
      dispatch(clearCart());
      localStorage.removeItem("phone_number");
      setCoupon("");
      dispatch(setAppliedCoupon(null));
    } catch (err) {
      console.error("Place order failed:", err);
    }
  };

  const handleVerify = async (id: string, Phone?: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      try {
        openVerifyIdentity(
          dispatch,
          {
            onVerify: async (code) => {
              try {
                const res = await verifyPhone(id, code);
                if (res?.success) {
                  resolve(true);
                } else {
                  resolve(false);
                }
              } catch (error) {
                reject(error);
              }
            },
            onResend: async () => {
              await resendOtp(id);
            },
          },
          {
            maskedTarget: Phone,
            length: 6,
            title: "Verify Phone Number",
            description: "Enter the OTP sent to your phone number to continue.",
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  };



  const onGuestSubmit = async () => {
    try {
      if (!guestInfo) {
        dispatch(setError(t("checkout.fillCustomerInfo")))
        return;
      }
      if (guestOrderId && guestInfo) {
        const updateResult = await updateGuestOrder(guestOrderId, guestInfo);

        if (updateResult?.success) {
          // ── Step 1: Phone OTP verification (if required by admin) ──────────────
          if (guestPermissions.phone_verification_required) {
            const resendRes = await resendOtp(String(guestOrderId));
            if (!resendRes?.success) {
              dispatch(setError("Failed to send phone OTP. Please try again."));
              return;
            }
            const phoneVerified = await handleVerify(String(guestOrderId), guestInfo.phone || phoneNumber);
            if (!phoneVerified) return; // user closed modal or wrong OTP
          }

          // ── Step 2: Place the order ─────────────────────────────────────────────
          const initiateRes = await initiateGuestOrder(String(guestOrderId), {
            payment_type: paymentProvider === "cod" ? "cod" : "gateway",
            delivery_charge_id: Number(deliveryChargeId),
            coupon_code: (appliedCoupon?.coupon ?? "").trim() || "",
          });

          const orderId = Number(initiateRes?.order_id);
          if (!Number.isFinite(orderId) || orderId <= 0) return;

          if (paymentProvider !== "cod" && initiateRes?.payment?.url) {
            const payRes = await initiateGuestPayment(String(guestOrderId), paymentProvider);

            const urlFromInitiate =
              typeof (payRes as { url?: unknown })?.url === "string"
                ? String((payRes as { url?: unknown }).url).trim()
                : "";

            if (urlFromInitiate) {
              globalThis.location.href = urlFromInitiate;
            }
          } else {
            if (paymentProvider === "cod") {
              router?.push(`/checkout/success?orderId=${orderId}`);
            }
          }
          localStorage.removeItem("phone_number")
          dispatch(clearCart());
          setCoupon("");
          dispatch(setAppliedCoupon(null));
        }
      }
    } catch (err) {
      console.error("Place order failed:", err);
      const errMsg = err instanceof Error ? err.message : "Order placement failed. Please try again.";
      dispatch(setError(errMsg));
    }
  }


  const handleAuthenticatedOrder = (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    return handleSubmit(onSubmit, (errors) => {
      scrollToFirstError(errors);
    })(e);
  };

  const handleGuestOrder = async (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }

    // First validate the guest information form
    if (guestFormRef.current) {
      const isGuestValid = await guestFormRef.current.triggerValidation();
      if (!isGuestValid) return; // scroll+focus already handled inside triggerValidation
    }

    return handleSubmit(onGuestSubmit, (errors) => {
      scrollToFirstError(errors);
    })(e);
  };

  const isGuestOrderLoading = isUpdating || isInitiating || isInitiatingPayment || isSyncing;


  return (
    <section className="container mx-auto sm:pb-6">
      <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("checkout.breadcrumb") }]} />

      <input
        type="hidden"
        value={addressId}
        {...register("addressId", { required: isAuthenticated ? t("checkout.selectAddress") : false })}
        readOnly
      />
      <input
        type="hidden"
        value={deliveryChargeId}
        {...register("deliveryChargeId", { required: t("checkout.selectDelivery") })}
        readOnly
      />
      <input
        type="hidden"
        value={paymentProvider}
        {...register("paymentProvider", { required: t("checkout.selectPayment") })}
        readOnly
      />

      <div className="sm:mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <CheckoutLeft
          isAuthenticate={isAuthenticated}
          selectedAddressId={addressId}
          onSelectAddress={setAddressId}
          setDeliveryChargeId={setDeliveryId}
          setPaymentProvider={setProvider}
          setCoupon={setCoupon}
          deliveryChargeId={deliveryChargeId}
          paymentProvider={paymentProvider}
          coupon={coupon ?? ""}
          errors={{
            addressId: errors.addressId?.message,
            deliveryChargeId: errors.deliveryChargeId?.message,
            paymentProvider: errors.paymentProvider?.message,
          }}
          onPlaceOrder={isAuthenticated ? handleAuthenticatedOrder : handleGuestOrder}
          isSubmitting={isAuthenticated ? isSubmitting : isGuestOrderLoading}
          onGuestInfoUpdate={handleGuestInfoUpdate}
          guestFormRef={guestFormRef}
          emailRequired={guestPermissions.email_required}
        />


        <CheckoutRight items={orderItems} />
      </div>

      <div className="block sm:hidden fixed bottom-0 right-0 left-0 bg-white border-0 shadow-[0px_-2px_20px_rgba(0,0,0,0.06)] p-2 space-y-1.5 z-30">
        <div className="flex justify-between text-base font-semibold">
          <span>{t("checkout.totalAmount")}</span>
          <span>BDT {total?.total?.toLocaleString()}</span>
        </div>

        <Button
          type="button"
          onClick={isAuthenticated ? handleAuthenticatedOrder : handleGuestOrder}
          className="h-12 w-full rounded-none bg-black text-white hover:bg-black/90"
          disabled={isAuthenticated ? isSubmitting : isGuestOrderLoading}
          isLoading={isAuthenticated ? isSubmitting : isGuestOrderLoading}
        >
          {t("checkout.placeOrder")}
        </Button>
      </div>
    </section>
  );
};

export default CheckoutClient;
