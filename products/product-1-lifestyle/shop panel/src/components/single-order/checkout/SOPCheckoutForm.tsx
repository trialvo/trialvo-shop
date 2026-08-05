"use client";

/**
 * components/single-order/checkout/SOPCheckoutForm.tsx
 *
 * Customer information form for SOP checkout.
 * Renders customer info fields, delivery area selector, and place order CTA.
 */

import { User, Phone, Mail, MapPin, Map, ShoppingCart } from "lucide-react";
import type { SOPAddressType, SOPOrderPermissions } from "@/types/single-order";

interface SOPCheckoutFormProps {
  // Form state
  addressType: SOPAddressType;
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  paymentProvider: string;
  deliveryChargeId: string;

  // Permissions
  permissions: SOPOrderPermissions;

  // Validation
  phoneError: string;
  emailError: string;
  canSubmit: boolean;

  // Loading
  otpSending: boolean;
  otpError: string;

  // Callbacks
  onFieldChange: (field: string, value: string) => void;
  onAddressTypeChange: (type: SOPAddressType) => void;
  onPlaceOrder: () => void;

  // Slot for delivery and payment selectors
  deliverySlot?: React.ReactNode;
  paymentSlot?: React.ReactNode;
  areaSlot?: React.ReactNode;
}

export function SOPCheckoutForm({
  addressType,
  name,
  phone,
  email,
  address,
  note,
  permissions,
  phoneError,
  emailError,
  canSubmit,
  otpSending,
  otpError,
  onFieldChange,
  onAddressTypeChange,
  onPlaceOrder,
  deliverySlot,
  paymentSlot,
  areaSlot,
}: SOPCheckoutFormProps) {
  return (
    <div className="border border-border bg-card px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 rounded">
      <div className="flex items-center gap-2">
        <ShoppingCart size={22} className="text-foreground" />
        <h1 className="text-xl font-display font-semibold text-foreground">
          Checkout
        </h1>
      </div>

      <div className="space-y-4">
        {/* Customer Information */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Customer Information
          </h2>

          <div className="space-y-3">
            {/* Address Type */}
            <div className="flex items-center gap-5">
              {(["home", "office", "na"] as const).map((val) => (
                <label
                  key={val}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="addressType"
                    value={val}
                    checked={addressType === val}
                    onChange={() => onAddressTypeChange(val)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-xs font-medium text-foreground">
                    {val === "home"
                      ? "Home"
                      : val === "office"
                        ? "Office"
                        : "N/A"}
                  </span>
                </label>
              ))}
            </div>

            {/* Name */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User size={16} /> Full Name{" "}
                <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => onFieldChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded transition-colors"
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Phone size={16} /> Mobile Number{" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    onFieldChange("phone", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="01XXXXXXXXX"
                  className={`w-full border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded transition-colors ${
                    phone && phoneError
                      ? "border-destructive"
                      : "border-border"
                  }`}
                />
                {phone && phoneError && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Mail size={16} /> Email
                  {permissions.emailRequired ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm leading-none">
                      Optional
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => onFieldChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded transition-colors ${
                    email && emailError
                      ? "border-destructive"
                      : "border-border"
                  }`}
                />
                {email && emailError && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {emailError}
                  </p>
                )}
              </div>
            </div>

            {/* Zone (City → Area) */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MapPin size={16} /> Zone{" "}
                <span className="text-destructive">*</span>
              </label>
              {areaSlot}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Map size={16} /> Delivery Address{" "}
                <span className="text-destructive">*</span>
              </label>
              <textarea
                name="address"
                autoComplete="street-address"
                value={address}
                onChange={(e) => onFieldChange("address", e.target.value)}
                placeholder="Enter your complete delivery address with house number, street, area, and district"
                rows={2}
                className="w-full border border-border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded resize-y transition-colors"
              />
            </div>

            {/* Note */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                Note{" "}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm leading-none">
                  Optional
                </span>
              </label>
              <textarea
                name="note"
                value={note}
                onChange={(e) => onFieldChange("note", e.target.value)}
                placeholder="Any special instructions"
                rows={1}
                className="w-full border border-border bg-card text-foreground px-3 py-2.5 text-sm outline-none focus:border-accent rounded resize-y transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Delivery Selector Slot */}
        {deliverySlot}

        {/* Payment Method Slot */}
        {paymentSlot}

        {/* Place Order Button (desktop) */}
        <div className="pt-2 sm:sticky sm:z-10 sm:-bottom-5">
          {otpError && (
            <p className="mb-2 text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 py-2 px-3 rounded">
              {otpError}
            </p>
          )}
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={!canSubmit || otpSending}
            className="hidden sm:block h-12 w-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
          >
            {otpSending ? "Sending OTP..." : "Place Order"}
          </button>
          <p className="sm:mt-2 text-center text-xs text-muted-foreground">
            By placing your order, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
}
