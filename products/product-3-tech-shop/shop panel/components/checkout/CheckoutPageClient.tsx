"use client";

import { useMemo } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { AppButton } from "@/components/shared/AppButton";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { GuestOtpDialog } from "@/components/checkout/GuestOtpDialog";
import { useCheckoutOrder } from "@/hooks/useCheckoutOrder";
import type { CheckoutFormValues } from "@/lib/checkout/schemas";
import { parsePhoneValue } from "@/lib/phone/parse";
import { toast } from "sonner";

/**
 * Checkout page shell — graduate two-column form.
 * Site Header/Footer via page-level Layout (not checkout/layout).
 */
export default function CheckoutPageClient() {
  const {
    items,
    totalPrice,
    isSubmitting,
    isLeavingCheckout,
    leaveKind,
    isAuthenticated,
    permissions,
    otpDialog,
    resolveOtpDialog,
    submitCheckout,
    authUser,
  } = useCheckoutOrder();

  const userPhoneRaw =
    authUser?.phones?.[0]?.phone_number ||
    (typeof authUser?.default_phone === "string"
      ? authUser.default_phone
      : authUser?.default_phone &&
          typeof authUser.default_phone === "object" &&
          "phone_number" in authUser.default_phone
        ? String(authUser.default_phone.phone_number ?? "")
        : "") ||
    "";
  const userPhone =
    parsePhoneValue(userPhoneRaw, "BD").e164 || userPhoneRaw;

  const defaultValues = useMemo<CheckoutFormValues>(
    () => ({
      name: authUser?.first_name
        ? [authUser.first_name, authUser.last_name].filter(Boolean).join(" ")
        : "",
      phone: userPhone,
      email: authUser?.email ?? "",
      address: "",
      city: "",
      division: "",
      zipCode: "",
      addressId: "",
      orderNotes: "",
      couponCode: "",
      deliveryChargeId: "",
      paymentProvider: "cod",
    }),
    [authUser, userPhone],
  );

  // Only while actively navigating away after Place Order (in-memory).
  // Browser back must NOT re-show this via sessionStorage.
  if (isLeavingCheckout) {
    const goingToPayment = leaveKind === "gateway";
    return (
      <Layout>
        <div
          className="py-20 text-center px-4"
          role="status"
          aria-live="polite"
        >
          <h1 className="text-[22px] font-semibold mb-3 text-black">
            {goingToPayment
              ? "Redirecting to payment…"
              : "Confirming your order…"}
          </h1>
          <p className="text-black/70 text-sm max-w-md mx-auto">
            {goingToPayment
              ? "Please wait — you are being taken to a secure payment page."
              : "Please wait while we open your order confirmation."}
          </p>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-[22px] font-semibold mb-4 text-black">
            Your cart is empty
          </h1>
          <p className="text-black/70 text-sm mb-6">
            Add products before checking out.
          </p>
          <AppButton
            asChild
            className="rounded-none bg-black text-white hover:bg-black/90"
          >
            <Link href="/shop">Continue Shopping</Link>
          </AppButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto sm:pb-6">
        <CheckoutForm
          items={items}
          totalPrice={totalPrice}
          isAuthenticated={isAuthenticated}
          permissions={permissions}
          isSubmitting={isSubmitting}
          defaultValues={defaultValues}
          customerId={authUser?.id}
          onSubmit={async (values) => {
            try {
              await submitCheckout(values);
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Failed to place order. Please try again.",
              );
            }
          }}
        />
      </section>

      <GuestOtpDialog state={otpDialog} onResolved={resolveOtpDialog} />
    </Layout>
  );
}
