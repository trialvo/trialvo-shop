"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_URL } from "@/config/env";
import { useAnalytics, generateEventId } from "@/lib/analytics/useAnalytics";
import { useTranslation } from "@/hooks/useTranslation";
import { toPublicUrl } from "@/lib/utils";
import PaymentMethod from "@/components/payment/PaymentMethod";
import DeliverySelector from "@/components/delivery/DeliverySelector";
import DeliveryAreaSelector, { type AreaSelection } from "@/components/delivery/DeliveryAreaSelector";
import Link from "next/link";
import LangToggleButton from "@/components/header/LangToggleButton";
import { useDelivery } from "@/hooks/useDelivery";
import type { MiniCart, MiniCartItem } from "../SingleOrderPageClient";
import { PiShoppingCartLight } from "react-icons/pi";
import { FaTruckFast } from "react-icons/fa6";
import { CiPercent } from "react-icons/ci";
import { TbReceiptDollar } from "react-icons/tb";
import { FiX, FiUser, FiPhoneCall, FiMapPin, FiLock } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import { LiaMapMarkedAltSolid } from "react-icons/lia";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Props = { slug: string; id: number | string };

const apiBase = `${API_URL.replace(/\/+$/, "")}/api/v1`;
const SOP_CART_KEY = "sop_cart";

const imgUrl = (path?: string) => {
  if (!path) return "/placeholder.webp";
  return toPublicUrl(path) || "/placeholder.webp";
};

export default function SingleOrderCheckoutClient({ slug, id }: Props) {
  const router = useRouter();
  const { trackInitiateCheckout, trackPurchase } = useAnalytics();
  const { t } = useTranslation();

  // Cart from sessionStorage
  const [cart, setCart] = useState<MiniCart | null>(null);
  const [step, setStep] = useState<"form" | "phone_otp" | "email_otp" | "placing">("form");

  // Form state
  const [addressType, setAddressType] = useState<"home" | "office" | "na">("home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [areaName, setAreaName] = useState("");
  const [locationMappingId, setLocationMappingId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [deliveryChargeId, setDeliveryChargeId] = useState("");

  // OTP
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [otpError, setOtpError] = useState("");

  // Permissions
  const [emailRequired, setEmailRequired] = useState(true);
  const [phoneVerifyReq, setPhoneVerifyReq] = useState(true);
  const [emailVerifyReq, setEmailVerifyReq] = useState(false);

  // Delivery charges
  const { charges: deliveryCharges } = useDelivery();

  const fetchOrderPermissions = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/single-page/order-permissions`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) return null;

      const nextPermissions = {
        emailRequired: data.email_required !== false,
        phoneVerifyReq: data.phone_verification_required === true,
        emailVerifyReq: data.email_verification_required === true,
      };

      setEmailRequired(nextPermissions.emailRequired);
      setPhoneVerifyReq(nextPermissions.phoneVerifyReq);
      setEmailVerifyReq(nextPermissions.emailVerifyReq);

      return nextPermissions;
    } catch {
      return null;
    }
  }, []);

  // Load cart
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SOP_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MiniCart;
        if (parsed?.items?.length > 0) {
          setCart(parsed);
          return;
        }
      }
    } catch { /* empty */ }
    router.replace(`/single-order-page/${slug}/${id}`);
  }, [slug, id, router]);

  // Fetch permissions
  useEffect(() => {
    fetchOrderPermissions();
  }, [fetchOrderPermissions]);

  // Analytics: begin_checkout
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !cart) return;
    checkoutTracked.current = true;
    trackInitiateCheckout({
      content_ids: [String(cart.productId)],
      value: cart.items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
      num_items: cart.items.length,
    });
  }, [cart, trackInitiateCheckout]);

  // Derived
  const subtotal = useMemo(() => cart?.items.reduce((s, i) => s + i.sellingPrice * i.qty, 0) ?? 0, [cart]);
  const totalQty = useMemo(() => cart?.items.reduce((s, i) => s + i.qty, 0) ?? 0, [cart]);
  const itemDiscount = useMemo(() => cart?.items.reduce((s, i) => s + (i.sellingPrice - i.unitPrice) * i.qty, 0) ?? 0, [cart]);

  const selectedDelivery = useMemo(() => deliveryCharges.find(d => String(d.id) === deliveryChargeId), [deliveryCharges, deliveryChargeId]);
  const rawDeliveryAmount = useMemo(() => selectedDelivery ? Number(selectedDelivery.customer_charge) : 0, [selectedDelivery]);

  // ── Effective free delivery per item (SKU flag + bulk rule) ──────────
  const { allFreeDelivery, hasMixedDelivery, paidWeightKg, bulkDiscount } = useMemo(() => {
    if (!cart) return { allFreeDelivery: false, hasMixedDelivery: false, paidWeightKg: 0, bulkDiscount: 0 };
    const items = cart.items;
    const bulkOffers = cart.bulkOffers ?? [];

    // Build qty map per SKU for bulk rule lookup
    const qtyMap: Record<number, number> = {};
    for (const it of items) qtyMap[it.skuId] = (qtyMap[it.skuId] ?? 0) + it.qty;

    // Group bulk rules by SKU, sort DESC by min_qty
    const bulkBySku: Record<number, typeof bulkOffers> = {};
    for (const r of bulkOffers) {
      if (!bulkBySku[r.product_sku_id]) bulkBySku[r.product_sku_id] = [];
      bulkBySku[r.product_sku_id].push(r);
    }
    for (const vid in bulkBySku) bulkBySku[vid].sort((a, b) => b.min_qty - a.min_qty);

    // Build price map: skuId → effective unit price (after SKU discount) — matches guest checkout priceMap
    const priceMap: Record<number, number> = {};
    for (const it of items) {
      if (!(it.skuId in priceMap)) priceMap[it.skuId] = it.unitPrice;
    }

    // Track SKUs with free delivery via a bulk rule + compute bulk discount
    const freeViaRule = new Set<number>();
    let bd = 0;
    for (const vid in bulkBySku) {
      const qty = qtyMap[Number(vid)] ?? 0;
      const rule = bulkBySku[vid].find(r => qty >= r.min_qty);
      if (!rule) continue;
      if (rule.free_delivery) freeViaRule.add(Number(vid));
      const base = priceMap[Number(vid)] ?? rule.sku_selling_price;
      const disc = rule.discount_type === 0
        ? rule.discount_value * qty
        : (base * rule.discount_value / 100) * qty;
      bd += disc;
    }
    bd = Math.round(bd * 100) / 100;

    // Determine effective free delivery per item
    const isEffFree = (it: MiniCartItem) => it.freeDelivery || freeViaRule.has(it.skuId);
    const allFree = items.length > 0 && items.every(isEffFree);
    const mixed = items.length > 0 && items.some(isEffFree) && items.some(i => !isEffFree(i));
    const paidWt = items.filter(i => !isEffFree(i)).reduce((s, i) => s + i.weightKg * i.qty, 0);

    return { allFreeDelivery: allFree, hasMixedDelivery: mixed, paidWeightKg: paidWt, bulkDiscount: bd };
  }, [cart]);

  const deliveryAmount = useMemo(() => allFreeDelivery ? 0 : rawDeliveryAmount, [allFreeDelivery, rawDeliveryAmount]);

  const weightExtraCharge = useMemo(() => {
    if (!selectedDelivery || allFreeDelivery) return 0;
    const freeKg = Number(selectedDelivery.default_weight_kg || 0);
    const extraPerKg = Number(selectedDelivery.extra_charge_per_kg || 0);
    const excess = Math.max(0, paidWeightKg - freeKg);
    return Number((excess * extraPerKg).toFixed(2));
  }, [selectedDelivery, allFreeDelivery, paidWeightKg]);

  const grandTotal = useMemo(() => Math.max(0, subtotal - itemDiscount + deliveryAmount + weightExtraCharge - bulkDiscount), [subtotal, itemDiscount, deliveryAmount, weightExtraCharge, bulkDiscount]);

  // Remove item from cart
  const removeItem = useCallback((skuId: number) => {
    setCart(prev => {
      if (!prev) return prev;
      const updated = { ...prev, items: prev.items.filter(i => i.skuId !== skuId) };
      if (updated.items.length === 0) {
        sessionStorage.removeItem(SOP_CART_KEY);
        router.replace(`/single-order-page/${slug}/${id}`);
        return null;
      }
      sessionStorage.setItem(SOP_CART_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [router, slug, id]);

  // ── OTP flow: multi-step (phone → email → place) ────────────────────────
  const capiEventIdRef = useRef<string>("");

  const sendPhoneOtp = useCallback(async () => {
    if (!phone || phone.length < 11) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await fetch(`${apiBase}/single-page/send-phone-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) { setSessionId(data.session_id); setOtp(""); setStep("phone_otp"); }
      else setOtpError(data.message || "Failed to send OTP");
    } catch { setOtpError("Network error"); }
    finally { setOtpSending(false); }
  }, [phone]);

  const sendEmailOtp = useCallback(async (sid?: string) => {
    const s = sid || sessionId;
    if (!s || !email) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await fetch(`${apiBase}/single-page/send-email-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: s, email }),
      });
      const data = await res.json();
      if (data.success) { setOtp(""); setStep("email_otp"); }
      else setOtpError(data.message || "Failed to send email OTP");
    } catch { setOtpError("Network error"); }
    finally { setOtpSending(false); }
  }, [sessionId, email]);

  const placeOrder = useCallback(async () => {
    if (!sessionId || !cart || !deliveryChargeId) return;
    setStep("placing");
    try {
      const eventId = generateEventId();
      capiEventIdRef.current = eventId;
      const cookies = typeof document !== "undefined" ? document.cookie : "";
      const fbp = cookies.match(/_fbp=([^;]+)/)?.[1] || "";
      const fbc = cookies.match(/_fbc=([^;]+)/)?.[1] || "";

      const orderRes = await fetch(`${apiBase}/single-page/place-order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          product_id: cart.productId,
          items: cart.items.map(i => ({ product_sku_id: i.skuId, quantity: i.qty })),
          name, phone,
          email: email || undefined,
          address_type: addressType,
          full_address: address,
          city,
          location_mapping_id: locationMappingId || undefined,
          delivery_charge_id: Number(deliveryChargeId),
          note,
          payment_type: paymentProvider === "cod" ? "cod" : "gateway",
          capi_event_id: eventId,
          fbp, fbc,
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.success) {
        trackPurchase({
          value: grandTotal,
          order_id: String(orderData.order_id),
          content_ids: [String(cart.productId)],
          num_items: cart.items.length,
          event_id: eventId,
        });
        if (paymentProvider !== "cod" && orderData.payment?.needs_initiation) {
          const payRes = await fetch(`${apiBase}/single-page/initiate-payment/${orderData.order_id}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, payment_method: paymentProvider }),
          });
          const payData = await payRes.json();
          const gatewayUrl = typeof payData?.url === "string" ? payData.url.trim() : "";
          if (gatewayUrl) {
            globalThis.location.href = gatewayUrl;
            return;
          }
        }
        sessionStorage.removeItem(SOP_CART_KEY);
        router.push(`/checkout/success?orderId=${orderData.order_id}`);
      } else {
        setOtpError(orderData.message || "Order failed");
        setStep("form");
      }
    } catch { setOtpError("Network error"); setStep("form"); }
  }, [sessionId, cart, deliveryChargeId, name, phone, email, addressType, address, city, locationMappingId, note, paymentProvider, grandTotal, trackPurchase]);

  // After phone OTP verified → either email OTP or place order
  const handlePhoneVerified = useCallback(async () => {
    if (emailVerifyReq && email) {
      await sendEmailOtp();
    } else {
      await placeOrder();
    }
  }, [emailVerifyReq, email, sendEmailOtp, placeOrder]);

  // Verify phone OTP then proceed
  const verifyPhoneOtp = useCallback(async () => {
    if (!otp || otp.length < 6 || !sessionId) return;
    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await fetch(`${apiBase}/single-page/verify-phone-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, otp }),
      });
      const data = await res.json();
      if (!data.success) { setOtpError(data.message || "Invalid OTP"); return; }
      await handlePhoneVerified();
    } catch { setOtpError("Network error"); }
    finally { setOtpVerifying(false); }
  }, [otp, sessionId, handlePhoneVerified]);

  // Verify email OTP then place order
  const verifyEmailOtp = useCallback(async () => {
    if (!otp || otp.length < 6 || !sessionId) return;
    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await fetch(`${apiBase}/single-page/verify-email-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, otp }),
      });
      const data = await res.json();
      if (!data.success) { setOtpError(data.message || "Invalid OTP"); return; }
      await placeOrder();
    } catch { setOtpError("Network error"); }
    finally { setOtpVerifying(false); }
  }, [otp, sessionId, placeOrder]);

  // "Place Order" button — start the verification chain
  // ── Form field validation (mirrors guest checkout's Zod schema) ────────────
  const phoneError = useMemo(() => {
    if (!phone) return "";
    if (!/^01\d{9}$/.test(phone)) return "Enter a valid BD mobile number (01XXXXXXXXX)";
    return "";
  }, [phone]);

  const emailError = useMemo(() => {
    if (!email) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
    return "";
  }, [email]);

  // Helper: create a session without verification (for no-OTP flows)
  const createSessionOnly = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${apiBase}/single-page/session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email: email || undefined }),
      });
      const data = await res.json();
      if (data.success) { setSessionId(data.session_id); return data.session_id; }
      setOtpError(data.message || "Failed to start session");
      return null;
    } catch { setOtpError("Network error"); return null; }
  }, [phone, email]);

  const handlePlaceOrder = useCallback(async () => {
    const latestPermissions = await fetchOrderPermissions();
    const shouldRequireEmail = latestPermissions?.emailRequired ?? emailRequired;
    const shouldVerifyPhone = latestPermissions?.phoneVerifyReq ?? phoneVerifyReq;
    const shouldVerifyEmail = latestPermissions?.emailVerifyReq ?? emailVerifyReq;

    // Validate form fields first
    if (phoneError) { setOtpError(phoneError); return; }
    if (shouldVerifyEmail && !email.trim()) { setOtpError("Email is required for verification"); return; }
    if (shouldRequireEmail && !email.trim()) { setOtpError("Email is required"); return; }
    if (emailError) { setOtpError(emailError); return; }
    setOtpError("");

    if (shouldVerifyPhone) {
      await sendPhoneOtp();
    } else if (shouldVerifyEmail && email) {
      // Phone not required but email verification is — create session then send email OTP
      setOtpSending(true);
      try {
        const sid = await createSessionOnly();
        if (sid) await sendEmailOtp(sid);
      } finally { setOtpSending(false); }
    } else {
      // Neither verification required — create session and place order directly
      setOtpSending(true);
      try {
        const sid = await createSessionOnly();
        if (sid) {
          // Place order directly with the new session
          setSessionId(sid);
          // Need to call placeOrder with the sid directly since state may not have updated
          setStep("placing");
          const eventId = generateEventId();
          capiEventIdRef.current = eventId;
          const cookies = typeof document !== "undefined" ? document.cookie : "";
          const fbp = cookies.match(/_fbp=([^;]+)/)?.[1] || "";
          const fbc = cookies.match(/_fbc=([^;]+)/)?.[1] || "";

          const orderRes = await fetch(`${apiBase}/single-page/place-order`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sid,
              product_id: cart!.productId,
              items: cart!.items.map(i => ({ product_sku_id: i.skuId, quantity: i.qty })),
              name, phone,
              email: email || undefined,
              address_type: addressType,
              full_address: address,
              city,
              location_mapping_id: locationMappingId || undefined,
              delivery_charge_id: Number(deliveryChargeId),
              note,
              payment_type: paymentProvider === "cod" ? "cod" : "gateway",
              capi_event_id: eventId,
              fbp, fbc,
            }),
          });
          const orderData = await orderRes.json();
          if (orderData.success) {
            trackPurchase({ value: grandTotal, order_id: String(orderData.order_id), content_ids: [String(cart!.productId)], num_items: cart!.items.length, event_id: eventId });
            if (paymentProvider !== "cod" && orderData.payment?.needs_initiation) {
              const payRes = await fetch(`${apiBase}/single-page/initiate-payment/${orderData.order_id}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sid, payment_method: paymentProvider }),
              });
              const payData = await payRes.json();
              const gatewayUrl = typeof payData?.url === "string" ? payData.url.trim() : "";
              if (gatewayUrl) {
                globalThis.location.href = gatewayUrl;
                return;
              }
            }
            sessionStorage.removeItem(SOP_CART_KEY);
            router.push(`/checkout/success?orderId=${orderData.order_id}`);
          } else {
            setOtpError(orderData.message || "Order failed");
            setStep("form");
          }
        }
      } catch { setOtpError("Network error"); setStep("form"); }
      finally { setOtpSending(false); }
    }
  }, [fetchOrderPermissions, phoneVerifyReq, emailVerifyReq, emailRequired, email, emailError, phone, phoneError, sendPhoneOtp, sendEmailOtp, createSessionOnly, cart, name, addressType, address, city, locationMappingId, deliveryChargeId, note, paymentProvider, grandTotal, trackPurchase]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!cart) return null;



  const canSubmit = name.trim().length >= 2 && /^01\d{9}$/.test(phone)
    && (!emailRequired || (email.trim().length > 0 && !emailError))
    && (!email || !emailError)
    && locationMappingId && address.trim().length >= 10 && deliveryChargeId && paymentProvider;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header t={t} />

      {/* Breadcrumb */}
      <div className="container mx-auto py-2">
        <nav data-sop="true" className="text-xs text-gray-500">
          <a href="/" className="hover:underline">{t("breadcrumb.home") || "Home"}</a>
          <span className="mx-1">›</span>
          <span className="text-gray-900">{t("checkout.breadcrumb") || "Checkout"}</span>
        </nav>
      </div>

      <section data-sop="true" className="container mx-auto pb-10">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
          {/* ══ LEFT COLUMN ══ */}
          <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.10)] bg-white px-2 sm:px-6 sm:py-4.25 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <PiShoppingCartLight className="h-6 w-6" />
              <h1 className="text-[22px] font-semibold">{t("checkout.title") || "Checkout"}</h1>
            </div>

            {step === "form" && (
              <div className="space-y-4">
                {/* Customer Information */}
                <section className="space-y-4">
                  <h2 className="text-base font-semibold">{t("customerInfo.title") || "Customer Information"}</h2>

                  <div className="space-y-3">
                    {/* Address Type */}
                    <div className="flex items-center gap-5">
                      {(["home", "office", "na"] as const).map(val => (
                        <label key={val} className="flex cursor-pointer items-center gap-1.5">
                          <input type="radio" name="addressType" value={val} checked={addressType === val}
                            onChange={() => setAddressType(val)}
                            className="h-4 w-4 accent-black" />
                          <span className="text-xs font-medium text-[#343434]">
                            {val === "home" ? (t("customerInfo.home") || "Home")
                              : val === "office" ? (t("customerInfo.office") || "Office")
                              : (t("customerInfo.na") || "N/A")}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Name */}
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#343434]">
                        <FiUser className="h-4 w-4 text-[#343434]" /> {t("customerInfo.fullName") || "Full Name"} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                        placeholder={t("customerInfo.fullNamePlaceholder") || "Enter your full name"}
                        className="w-full rounded-none border border-[#CBCBCB] px-3 py-2.5 text-sm outline-none focus:border-black" />
                    </div>

                    {/* Phone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#343434]">
                          <FiPhoneCall className="h-4 w-4 text-[#343434]" /> {t("customerInfo.mobile") || "Mobile Number"} <span className="text-red-500">*</span>
                        </label>
                        <input type="tel" name="phone" autoComplete="tel" inputMode="numeric" value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="01XXXXXXXXX"
                          className={`w-full rounded-none border px-3 py-2.5 text-sm outline-none focus:border-black ${phone && phoneError ? "border-red-400" : "border-[#CBCBCB]"}`} />
                        {phone && phoneError && <p className="mt-0.5 text-xs text-red-500">{phoneError}</p>}
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#343434]">
                          <HiOutlineMail className="h-4 w-4 text-[#343434]" /> {t("customerInfo.email") || "Email"}
                          {emailRequired
                            ? <span className="text-red-500">*</span>
                            : <span className="ml-1 text-[10px] font-normal text-[#888] border border-[#DCDCDC] px-1.5 py-0.5 rounded-sm leading-none">{t("customerInfo.optional") || "Optional"}</span>}
                        </label>
                        <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder={t("customerInfo.emailPlaceholder") || "Enter your email"}
                          className={`w-full rounded-none border px-3 py-2.5 text-sm outline-none focus:border-black ${email && emailError ? "border-red-400" : "border-[#CBCBCB]"}`} />
                        {email && emailError && <p className="mt-0.5 text-xs text-red-500">{emailError}</p>}
                      </div>
                    </div>

                    {/* Zone (City → Area) */}
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#343434]">
                        <FiMapPin className="h-4 w-4 text-[#343434]" /> {t("customerInfo.zone") || "Zone"} <span className="text-red-500">*</span>
                      </label>
                      <DeliveryAreaSelector
                        value={locationMappingId ? { location_mapping_id: locationMappingId, city_name: city, area_name: areaName } : null}
                        onChange={(sel) => {
                          setLocationMappingId(sel?.location_mapping_id ?? null);
                          setCity(sel?.city_name ?? "");
                          setAreaName(sel?.area_name ?? "");
                        }}
                        required
                        error={!locationMappingId ? undefined : undefined}
                      />
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#343434]">
                        <LiaMapMarkedAltSolid className="h-4 w-4 text-[#343434]" /> {t("customerInfo.deliveryAddress") || "Delivery Address"} <span className="text-red-500">*</span>
                      </label>
                      <textarea name="address" autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)}
                        placeholder={t("customerInfo.deliveryAddressPlaceholder") || "Enter your complete delivery address with house number, street, area, and district"}
                        rows={2}
                        className="w-full rounded-none border border-[#CBCBCB] px-3 py-2.5 text-sm outline-none focus:border-black resize-y" />
                    </div>
                  </div>
                </section>

                {/* Delivery Area */}
                <DeliverySelector value={deliveryChargeId} onChange={setDeliveryChargeId} />

                {/* Payment Method */}
                <PaymentMethod value={paymentProvider} onChange={setPaymentProvider} />

                {/* Place Order Button (desktop) */}
                <div className="pt-2 sm:sticky sm:z-10 sm:-bottom-5">
                  {otpError && (
                    <p className="mb-2 text-center text-sm text-red-600 bg-red-50 border border-red-200 py-2 px-3 rounded">{otpError}</p>
                  )}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!canSubmit || otpSending}
                    className="hidden sm:block h-12 w-full bg-black text-white text-sm font-semibold hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpSending ? (t("singleOrder.sendingOtp") || "Sending OTP...") : (t("checkout.placeOrder") || "Place Order")}
                  </button>
                  <p className="sm:mt-2 text-center text-xs text-gray-500">
                    {t("checkout.agreeTerms") || "By placing your order, you agree to our terms and conditions"}
                  </p>
                </div>
              </div>
            )}

            {/* ── Phone OTP Step ── */}
            {step === "phone_otp" && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <FiLock className="h-6 w-6 text-gray-700" />
                  </div>
                  <h2 className="text-xl font-bold text-black">{t("auth.verifyIdentityTitle") || "Verify Identity"}</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {t("auth.verifyDesc1") || "Please enter the"} 6-{t("auth.verifyDesc2") || "digit code sent to"}{" "}
                    <span className="font-semibold text-black">{phone}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} inputMode="numeric" pattern="^[0-9]+$" containerClassName="justify-center" disabled={otpVerifying} autoComplete="one-time-code">
                    <InputOTPGroup className="gap-3">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <InputOTPSlot key={idx} index={idx} className={`h-15 w-12 rounded-none! text-center text-4xl font-semibold ${otpError ? "border-red-500" : "border-gray-300"}`} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {otpError && <p className="text-center text-sm text-red-600">{otpError}</p>}

                <p className="text-center text-sm text-black">
                  {t("auth.codeNotReceived") || "Didn't receive the code?"}{" "}
                  <button type="button" onClick={() => { setOtpError(""); sendPhoneOtp(); }} disabled={otpSending} className="font-semibold text-[#0088FF] cursor-pointer hover:underline disabled:opacity-60">
                    {t("auth.resend") || "Resend"}
                  </button>
                </p>

                <button
                  onClick={verifyPhoneOtp}
                  disabled={otp.length < 6 || otpVerifying}
                  className="w-full h-12 bg-black text-white text-sm font-semibold hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpVerifying ? (t("auth.verifying") || "Verifying...") : (t("auth.verify") || "Verify & Continue")}
                </button>

                <button onClick={() => { setStep("form"); setOtp(""); setOtpError(""); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                  ← {t("common.back") || "Go Back"}
                </button>
              </div>
            )}

            {/* ── Email OTP Step ── */}
            {step === "email_otp" && (
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <HiOutlineMail className="h-6 w-6 text-gray-700" />
                  </div>
                  <h2 className="text-xl font-bold text-black">{t("auth.verifyEmail") || "Verify Email"}</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {t("auth.verifyDesc1") || "Please enter the"} 6-{t("auth.verifyDesc2") || "digit code sent to"}{" "}
                    <span className="font-semibold text-black">{email}</span>
                  </p>
                  {phoneVerifyReq && (
                    <p className="mt-1 text-xs text-green-600">✓ Phone verified</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} inputMode="numeric" pattern="^[0-9]+$" containerClassName="justify-center" disabled={otpVerifying} autoComplete="one-time-code">
                    <InputOTPGroup className="gap-3">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <InputOTPSlot key={idx} index={idx} className={`h-15 w-12 rounded-none! text-center text-4xl font-semibold ${otpError ? "border-red-500" : "border-gray-300"}`} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {otpError && <p className="text-center text-sm text-red-600">{otpError}</p>}

                <p className="text-center text-sm text-black">
                  {t("auth.codeNotReceived") || "Didn't receive the code?"}{" "}
                  <button type="button" onClick={() => { setOtpError(""); sendEmailOtp(); }} disabled={otpSending} className="font-semibold text-[#0088FF] cursor-pointer hover:underline disabled:opacity-60">
                    {t("auth.resend") || "Resend"}
                  </button>
                </p>

                <button
                  onClick={verifyEmailOtp}
                  disabled={otp.length < 6 || otpVerifying}
                  className="w-full h-12 bg-black text-white text-sm font-semibold hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpVerifying ? (t("auth.verifying") || "Verifying...") : (t("auth.verify") || "Verify & Place Order")}
                </button>

                <button onClick={() => { setStep(phoneVerifyReq ? "phone_otp" : "form"); setOtp(""); setOtpError(""); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                  ← {t("common.back") || "Go Back"}
                </button>
              </div>
            )}

            {step === "placing" && (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
                <p className="text-sm text-gray-500">{t("singleOrder.placingOrder") || "Placing your order..."}</p>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN: ORDER SUMMARY ══ */}
          <div className="lg:sticky lg:top-19.5 lg:self-start border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.10)] bg-white">
            {/* Title */}
            <div className="flex items-center gap-2 text-lg font-semibold border-b border-[#F1F1F1] py-4 px-3">
              <TbReceiptDollar className="h-5 w-5" />
              {t("orderSummary.title") || "Order Summary"}
            </div>

            {/* Cart Items */}
            <div className="px-3 mb-4 pt-3">
              <p className="text-sm font-semibold mb-3">{t("singleOrder.itemsInCart") || "Items in Cart"}</p>
              <div className="space-y-3">
                {cart.items.map(item => (
                  <div key={item.skuId} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 border border-gray-100 bg-gray-50">
                      <Image src={imgUrl(cart.productImage)} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.colorName} / {item.variantName}</p>
                      <p className="text-xs text-gray-500">Qty: {item.qty} X BDT {item.unitPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-sm font-semibold">BDT {(item.unitPrice * item.qty).toLocaleString()}</span>
                      <button onClick={() => removeItem(item.skuId)} className="text-red-400 hover:text-red-600 p-0.5">
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mixed delivery notice */}
            {hasMixedDelivery && (
              <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <span className="mt-0.5 shrink-0">🚚</span>
                <p>
                  Your cart has <strong>mixed delivery</strong>: some items ship free, others don&apos;t.
                  A delivery charge applies, but free-delivery items are <strong>excluded from weight surcharge</strong>.
                </p>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 py-4 px-3">
              <div className="flex justify-between text-sm">
                <span className="font-normal">{t("orderSummary.subtotal") || "Subtotal"}</span>
                <span className="font-semibold">BDT {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center font-normal gap-2">
                  <FaTruckFast className="h-4 w-4" /> {t("orderSummary.deliveryCharge") || "Delivery Charge"}
                </span>
                {deliveryAmount === 0 ? (
                  <span className="font-semibold text-green-600 flex items-center gap-1">🚚 FREE</span>
                ) : (
                  <span className="font-semibold">BDT {deliveryAmount.toLocaleString()}</span>
                )}
              </div>

              {weightExtraCharge > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center font-normal gap-2">
                      ⚖ {t("singleOrder.weightSurcharge") || "Weight surcharge"}{paidWeightKg > 0 ? ` (${paidWeightKg.toFixed(2)} kg)` : ""}
                    </span>
                    <span className="font-semibold text-orange-500">+BDT {weightExtraCharge.toLocaleString()}</span>
                  </div>
                  {hasMixedDelivery && (
                    <p className="text-[10px] text-amber-600 -mt-1 pl-1">
                      ⚠️ Surcharge applies to paid-delivery items only
                    </p>
                  )}
                </>
              )}

              {bulkDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center font-normal gap-2">
                    ⚡ Bulk Discount
                  </span>
                  <span className="font-semibold text-green-600">-BDT {bulkDiscount.toLocaleString()}</span>
                </div>
              )}

              {itemDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center font-normal gap-2">
                    <CiPercent className="h-4 w-4" /> {t("orderSummary.itemDiscount") || "Item Discount"}
                  </span>
                  <span className="font-semibold text-green-600">-BDT {itemDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>{t("orderSummary.totalAmount") || "Total Amount"}</span>
                <span>BDT {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom bar */}
        {step === "form" && (
          <div className="fixed inset-x-0 bottom-0 z-60 sm:hidden border-t border-black/10 bg-white shadow-[0_-6px_18px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs text-gray-500">{t("orderSummary.totalAmount") || "Total"}</p>
                <p className="text-base font-bold">BDT {grandTotal.toLocaleString()}</p>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={!canSubmit || otpSending}
                className="h-11 px-6 bg-black text-white text-sm font-bold disabled:opacity-50"
              >
                {otpSending ? "..." : (t("checkout.placeOrder") || "Place Order")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Shared Header ────────────────────────────────────────────────────────────
function Header({ t }: { t: (key: string) => string }) {
  return (
    <header data-sop="true" className="sticky top-0 z-50 bg-background h-17.5 shadow-[0px_0px_20px_rgba(0,0,0,0.08)]">
      <div className="container mx-auto flex h-full items-center justify-between">
        <div className="flex h-17.5 items-center">
          <div className="overflow-hidden mr-8.25">
            <Link href="/" className="flex items-center gap-2 focus:outline-none" aria-label="Go to homepage">
              <img src="/logo-default.svg" alt="Graduate" width={140} height={36} className="h-11.25 w-36.25 object-contain" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LangToggleButton />
        </div>
      </div>
    </header>
  );
}
