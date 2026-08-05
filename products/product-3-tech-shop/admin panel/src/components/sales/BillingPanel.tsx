import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  User2,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Truck,
  ShoppingCart,
  CreditCard,
  StickyNote,
  Ticket,
  CheckCircle2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  X,
} from "lucide-react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import AddCustomerModal from "./AddCustomerModal";
import SalePanelShell from "@/components/sales/SalePanelShell";
import type { CartItem } from "./types";
import { cn } from "@/lib/utils";
import SlidingTabFilter from "@/components/ui/SlidingTabFilter";

import { getDeliveryCharges } from "@/api/delivery-charges.api";
import {
  createManualAddress,
  createManualOrder,
  createManualOrderStranger,
  type ManualAddressPayload,
} from "@/api/manual-orders.api";
import {
  getAdminUser,
  getAdminUsers,
  type AdminUserEntity,
  type AdminUserAddress,
} from "@/api/admin-users.api";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { usePermissionConfig } from "@/hooks/usePermissions";
import { adminValidateCoupon, fetchSkuPrices } from "@/api/cart-discounts.api";
import { useAdminCartDiscounts } from "@/hooks/useAdminCartDiscounts";
import {
  calculateAdminCartTotals,
  type AdminCartItem,
} from "@/lib/discounts/calculateAdminCartTotals";
import AdminZonePicker, { type ZoneSelection } from "@/components/shared/AdminZonePicker";

type Props = {
  cart: CartItem[];
  onUpdateQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
};

type CustomerMode = "existing" | "stranger";

function userFullName(u: AdminUserEntity) {
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return name || u.email || `User #${u.id}`;
}

function firstVerifiedPhone(u: AdminUserEntity): string {
  const verified = u.phones?.find(
    (p) => p.is_verified === true || p.is_verified === 1
  );
  const any = u.phones?.[0];
  return verified?.phone_number || any?.phone_number || "";
}

function formatCurrencyBDT(n: number) {
  return `৳${Number.isFinite(n) ? n.toFixed(0) : "0"}`;
}

function toPublicUrlSafe(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return pathOrUrl;
}

function badgeClass(variant: "ok" | "warn" | "muted") {
  if (variant === "ok")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20";
  if (variant === "warn")
    return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20";
  return "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10";
}

/* Soft section label for billing blocks */
function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      {icon ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {children}
      </p>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/15";

/** Typed error shape for Axios-like rejections */
type ApiError = Error & { response?: { data?: { error?: string; message?: string } }; message?: string };

// ─── Verification Info & Rules Panel ───────────────────────────────────────────
// Shows the selected customer's live verification status (Email, Address Phone, Default Phone).
// Reads admin_manual permission config and highlights failures with actionable
// guidance linking to /permissions when a required check fails.

type VerificationStatus = "verified" | "unverified" | "no_data";

function VerificationRow({
  label,
  status,
  isRequired,
  failMessage,
}: {
  label: string;
  status: VerificationStatus;
  isRequired: boolean;
  failMessage?: React.ReactNode;
}) {
  const iconMap: Record<VerificationStatus, React.ReactNode> = {
    verified: <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />,
    unverified: isRequired ? (
      <AlertTriangle size={14} className="text-rose-500 shrink-0" />
    ) : (
      <ShieldAlert size={14} className="text-amber-500 shrink-0" />
    ),
    no_data: <ShieldAlert size={14} className="text-gray-400 shrink-0" />,
  };

  const labelClass: Record<VerificationStatus, string> = {
    verified: "text-gray-700 dark:text-gray-300",
    unverified: isRequired
      ? "text-rose-700 dark:text-rose-300 font-semibold"
      : "text-amber-700 dark:text-amber-400 font-medium",
    no_data: "text-gray-500 dark:text-gray-400",
  };

  const statusText = {
    verified: "Verified",
    unverified: "Unverified",
    no_data: "No data",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{iconMap[status]}</span>
        <span className={cn("text-xs", labelClass[status])}>{label}</span>
        
        <span className="ml-auto flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] rounded-full px-2 py-0.5 font-medium",
              status === "verified"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : status === "unverified"
                ? isRequired
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {statusText[status]}
          </span>
          {isRequired && (
            <span className="text-[10px] rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              required
            </span>
          )}
        </span>
      </div>

      {status === "unverified" && isRequired && failMessage && (
        <div className="ml-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300 leading-relaxed">
          {failMessage}
        </div>
      )}
    </div>
  );
}

function AdminManualVerificationPanel({
  customer,
  address,
}: {
  customer: AdminUserEntity | null;
  address: AdminUserAddress | null;
}) {
  const { data: permData, isLoading: permLoading } = usePermissionConfig();

  // Extract admin_manual config block
  const adminManualCfg = useMemo(() => {
    const raw = permData?.data as Record<string, Record<string, unknown>> | undefined;
    if (!raw) return null;
    const section = raw["order_place_permission"];
    if (!section) return null;
    return (section["admin_manual"] as Record<string, unknown>) ?? null;
  }, [permData]);

  const requireEmailVerified = adminManualCfg?.email_verified === true;
  const phoneMode = (adminManualCfg?.phone_verified_mode as string) ?? "no_phone_verification_needed";
  const requireAddressPhone = phoneMode === "address_phone_verified" || phoneMode === "both";
  const requireDefaultPhone = phoneMode === "default_phone_verified" || phoneMode === "both";

  // 1. Email Status
  let emailStatus: VerificationStatus = "no_data";
  if (customer) {
    emailStatus = customer.is_email_verified ? "verified" : "unverified";
  }

  // 2. Default Phone Status
  let defaultPhoneStatus: VerificationStatus = "no_data";
  if (customer) {
    defaultPhoneStatus = customer.is_fully_verified ? "verified" : "unverified";
  }

  // 3. Address Phone Status
  let addressPhoneStatus: VerificationStatus = "no_data";
  if (customer && address) {
    if (!address.phone_id) addressPhoneStatus = "unverified";
    else addressPhoneStatus = address.phone_verified ? "verified" : "unverified";
  }

  // Determine if there's any blocking requirement failure
  const emailFails = emailStatus === "unverified" && requireEmailVerified;
  const addressPhoneFails = addressPhoneStatus === "unverified" && requireAddressPhone;
  const defaultPhoneFails = defaultPhoneStatus === "unverified" && requireDefaultPhone;

  const anyFail = emailFails || addressPhoneFails || defaultPhoneFails;

  if (permLoading) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white p-3 dark:border-gray-800 dark:bg-gray-800/40">
        <p className="text-xs text-gray-400 animate-pulse">Loading placement requirements…</p>
      </div>
    );
  }

  const customerName = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || customer.email || `Customer #${customer.id}`
    : "the selected customer";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3",
        anyFail
          ? "border-rose-200 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-500/5"
          : "border-gray-200 bg-gray-50/40 dark:border-gray-700 dark:bg-white/[0.02]"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {anyFail ? (
          <ShieldAlert size={15} className="text-rose-500 shrink-0" />
        ) : (
          <ShieldCheck size={15} className="text-gray-500 dark:text-gray-400 shrink-0" />
        )}
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
          Customer Verification Info
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        <VerificationRow
          label="Email Account"
          status={emailStatus}
          isRequired={requireEmailVerified}
          failMessage={
            <>
              <strong>{customerName}</strong>'s email (<em>{customer?.email}</em>) is not
              verified. Ask the customer to verify their email, or{" "}
              <Link
                to="/permissions"
                className="inline-flex items-center gap-0.5 underline font-semibold hover:opacity-80"
              >
                turn off <em>Email Verified</em>
                <ExternalLink size={10} className="ml-0.5" />
              </Link>
              {" "}in Permissions.
            </>
          }
        />

        <VerificationRow
          label="Default Account Phone"
          status={defaultPhoneStatus}
          isRequired={requireDefaultPhone}
          failMessage={
            <>
              <strong>{customerName}</strong> has no verified default phone on their account.
              Ask the customer to add and verify their account phone, or{" "}
              <Link
                to="/permissions"
                className="inline-flex items-center gap-0.5 underline font-semibold hover:opacity-80"
              >
                adjust the <em>Phone Verification Mode</em>
                <ExternalLink size={10} className="ml-0.5" />
              </Link>
              {" "}in Permissions.
            </>
          }
        />

        <VerificationRow
          label="Selected Address Phone"
          status={addressPhoneStatus}
          isRequired={requireAddressPhone}
          failMessage={
            !address?.phone_id ? (
              <>
                The selected address has <strong>no linked phone number</strong>. Add a phone
                number to this address, pick a different address, or{" "}
                <Link
                  to="/permissions"
                  className="inline-flex items-center gap-0.5 underline font-semibold hover:opacity-80"
                >
                  adjust <em>Phone Verification Mode</em>
                  <ExternalLink size={10} className="ml-0.5" />
                </Link>
                {" "}in Permissions.
              </>
            ) : (
              <>
                The phone number on the selected address is <strong>not verified</strong>.
                Ask <strong>{customerName}</strong> to verify their address phone number, or{" "}
                <Link
                  to="/permissions"
                  className="inline-flex items-center gap-0.5 underline font-semibold hover:opacity-80"
                >
                  adjust <em>Phone Verification Mode</em>
                  <ExternalLink size={10} className="ml-0.5" />
                </Link>
                {" "}in Permissions.
              </>
            )
          }
        />
      </div>

      {/* Blocking summary warning */}
      {anyFail && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2.5 dark:border-rose-500/20 dark:bg-gray-900">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-500" />
          <p className="text-xs text-rose-700 dark:text-rose-300">
            This order will be <strong>rejected by the server</strong> if submitted as-is.
            Resolve the issues above, or{" "}
            <Link
              to="/permissions"
              className="inline-flex items-center gap-0.5 underline font-semibold hover:opacity-80"
            >
              adjust Admin Manual Order requirements
              <ExternalLink size={10} className="ml-0.5" />
            </Link>
            {" "}in Permissions.
          </p>
        </div>
      )}
    </div>
  );
}

function CustomerRow({
  u,
  active,
  onPick,
  t,
}: {
  u: AdminUserEntity;
  active: boolean;
  onPick: () => void;
  t: (key: string) => string;
}) {
  const img = toPublicUrlSafe(u.img_path);
  const fallback = imageFallbackSvgDataUri(userFullName(u));
  const imageSrc = img ? toPublicUrl(img) : fallback;
  const phone = firstVerifiedPhone(u);
  const addrCount = Array.isArray(u.addresses) ? u.addresses.length : 0;

  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-brand-400 bg-brand-50/60 shadow-sm ring-1 ring-brand-300/30 dark:border-brand-500/60 dark:bg-brand-500/5 dark:ring-brand-500/20"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-gray-600"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={userFullName(u)}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              const target = event.currentTarget;
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {userFullName(u)}
            </div>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                badgeClass(u.status === "active" ? "ok" : "muted")
              )}
            >
              {String(u.status ?? "unknown")}
            </span>

            {u.is_fully_verified ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                  badgeClass("ok")
                )}
              >
                {t("sales.verified")}
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                  badgeClass("warn")
                )}
              >
                {t("sales.notVerified")}
              </span>
            )}
          </div>

          <div className="mt-1.5 grid grid-cols-12 gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="col-span-12 md:col-span-6 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <Mail size={13} className="text-gray-400" />
                <span className="truncate">{u.email}</span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <Phone size={13} className="text-gray-400" />
                <span className="truncate">{phone || t("sales.noPhone")}</span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400" />
                <span>{addrCount} {t("sales.addressCount")}</span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6">
              <div className="flex items-center justify-between gap-2">
                <span>{t("sales.totalSpent")}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyBDT(Number(u.total_spent ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {active ? (
          <div className="mt-1 flex-shrink-0 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            {t("sales.selected")}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function BillingPanel({ cart, onUpdateQty, onRemove }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CustomerMode>("existing");

  // ---------- EXISTING USER FLOW ----------
  const [userQ, setUserQ] = useState("");
  const [usersOffset, setUsersOffset] = useState(0);
  const USERS_LIMIT = 4;

  const usersQuery = useQuery({
    queryKey: [
      "adminUsers",
      { q: userQ.trim(), limit: USERS_LIMIT, offset: usersOffset },
    ],
    queryFn: () =>
      getAdminUsers({
        limit: USERS_LIMIT,
        offset: usersOffset === 0 ? undefined : usersOffset,
        search: userQ.trim() ? userQ.trim() : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const users = usersQuery.data?.users ?? [];
  const usersTotal = usersQuery.data?.meta?.total ?? 0;

  const [customerId, setCustomerId] = useState<number | null>(null);

  const userDetailsQuery = useQuery({
    queryKey: ["adminUser", customerId],
    queryFn: () => getAdminUser(Number(customerId)),
    enabled: typeof customerId === "number" && customerId > 0,
  });

  const selectedUser = userDetailsQuery.data?.user ?? null;
  const addresses = selectedUser?.addresses ?? [];

  const [addressId, setAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedUser) {
      setAddressId(null);
      return;
    }

    const def = Number(selectedUser.default_address ?? 0);
    if (def) {
      setAddressId(def);
      return;
    }

    const first = addresses?.[0]?.id ? Number(addresses[0].id) : null;
    setAddressId(first);
  }, [selectedUser, addresses]);

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  // Manual address modal
  const [manualAddressOpen, setManualAddressOpen] = useState(false);
  const [manualAddressName, setManualAddressName] = useState("");
  const [manualAddressPhone, setManualAddressPhone] = useState("");
  const [manualAddressFull, setManualAddressFull] = useState("");
  const [manualAddressZone, setManualAddressZone] = useState<ZoneSelection | null>(null);
  const [manualAddressZip, setManualAddressZip] = useState("");
  const [manualAddressType, setManualAddressType] = useState<
    "home" | "office" | "n/a"
  >("n/a");

  useEffect(() => {
    if (!manualAddressOpen) return;
    if (!selectedUser) return;

    setManualAddressName(userFullName(selectedUser));
    setManualAddressPhone(firstVerifiedPhone(selectedUser));
    setManualAddressFull("");
    setManualAddressZone(null);
    setManualAddressZip("");
    setManualAddressType("n/a");
  }, [manualAddressOpen, selectedUser]);

  const createAddressMutation = useMutation({
    mutationFn: (payload: ManualAddressPayload) => createManualAddress(payload),
    onSuccess: (data) => {
      if (data?.success === true || data?.flag === 200) {
        toast.success(data?.message || "Address created");
        setManualAddressOpen(false);
        void userDetailsQuery.refetch();
        return;
      }

      toast.error(data?.error || data?.message || "Failed to create address");
    },
    onError: (err: ApiError) => {
      toast.error(err?.message || "Failed to create address");
    },
  });

  // ---------- STRANGER FLOW ----------
  const [strangerName, setStrangerName] = useState("");
  const [strangerPhone, setStrangerPhone] = useState("");
  const [strangerEmail, setStrangerEmail] = useState("");
  const [strangerFullAddress, setStrangerFullAddress] = useState("");
  const [strangerZone, setStrangerZone] = useState<ZoneSelection | null>(null);
  const [strangerZip, setStrangerZip] = useState("");

  // ---------- DELIVERY ----------
  const deliveryChargesQuery = useQuery({
    queryKey: ["deliveryCharges", { limit: 20 }],
    queryFn: () => getDeliveryCharges({ limit: 20, status: true }),
  });

  const deliveryCharges = deliveryChargesQuery.data?.data ?? [];
  const [deliveryChargeId, setDeliveryChargeId] = useState<number | null>(null);

  useEffect(() => {
    if (deliveryChargeId) return;
    const first = deliveryCharges?.[0]?.id
      ? Number(deliveryCharges[0].id)
      : null;
    setDeliveryChargeId(first);
  }, [deliveryCharges, deliveryChargeId]);

  const deliveryCharge = useMemo(() => {
    if (!deliveryChargeId) return null;
    return (
      deliveryCharges.find((d) => Number(d.id) === Number(deliveryChargeId)) ??
      null
    );
  }, [deliveryCharges, deliveryChargeId]);

  // ---------- PAYMENT ----------
  const [payBy, setPayBy] = useState<"cod" | "bkash">("cod");
  const [trx, setTrx] = useState("");

  // ---------- NOTE / COUPON ----------
  const [note, setNote] = useState("");
  const [couponInputVal, setCouponInputVal] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const couponCode = appliedCoupon?.code ?? "";

  // ---------- DISCOUNT RULES ----------
  const { bulkRules, comboRules, cartDiscountConfig } = useAdminCartDiscounts();

  // ---------- SKU DISCOUNT MAP (via /user/cart/sync) ----------
  // The admin dev panel hits the LIVE API (shop-api.shoplinkbd.com). Instead of
  // relying on sku_discount fields in bulk/combo rules (needs backend deploy), we
  // call /user/cart/sync which ALREADY computes discount = selling_price - final_price
  // for every SKU. This is exactly the same per-unit discount the shop uses.
  const cartSkuIds = useMemo(() => {
    const ids = cart
      .map((i) => i.productVariationId)
      .filter((v): v is number => v != null);
    return [...new Set(ids)];
  }, [cart]);

  const { data: syncedPrices = [] } = useQuery({
    queryKey: ["admin-cart-sku-sync", cartSkuIds],
    queryFn: () => fetchSkuPrices(cartSkuIds),
    enabled: cartSkuIds.length > 0,
    staleTime: 30_000,
  });

  const skuDiscMap = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const s of syncedPrices) {
      if (s.id != null && s.discount > 0) {
        map[s.id] = s.discount;
      }
    }
    return map;
  }, [syncedPrices]);

  // ---------- TOTALS ----------
  const adminCartItems = useMemo<AdminCartItem[]>(
    () =>
      cart.map((i) => {
        const vid = i.productVariationId;
        let { discount, originalPrice, unitPrice } = i;
        // Patch: if this cart item has no discount set, look it up from the rule data map
        if ((discount == null || discount === 0) && vid != null) {
          const ruleDisc = skuDiscMap[vid];
          if (ruleDisc != null && ruleDisc > 0) {
            const sellingP = originalPrice ?? unitPrice;
            discount = ruleDisc;
            originalPrice = sellingP;
            unitPrice = Math.max(0, sellingP - ruleDisc);
          }
        }
        return {
          key: i.key,
          productVariationId: vid,
          unitPrice,
          originalPrice,
          discount,
          freeDelivery: i.freeDelivery,
          qty: i.qty,
          weight_kg: i.weight_kg,
        };
      }),
    [cart, skuDiscMap]
  );

  const totals = useMemo(
    () =>
      calculateAdminCartTotals({
        cart: adminCartItems,
        deliveryCharge,
        bulkRules,
        comboRules,
        cartDiscountConfig,
        couponDiscount: appliedCoupon?.discount ?? 0,
      }),
    [adminCartItems, deliveryCharge, bulkRules, comboRules, cartDiscountConfig, appliedCoupon]
  );

  const { subtotal, total, hasMixedDelivery } = totals;

  // ---------- COUPON VALIDATE ----------
  const handleApplyCoupon = async () => {
    const code = couponInputVal.trim();
    if (!code || cart.length === 0) return;

    // Guard: in existing-customer mode the coupon API requires a customer_id
    // (coupons with per-user limits will fail with a confusing "Please log in" error
    // if no customer_id is supplied).
    if (mode === "existing" && !customerId) {
      setCouponError("Please select a customer first before applying a coupon.");
      return;
    }

    const orderItems = cart
      .filter((i) => i.productVariationId)
      .map((i) => ({ product_variation_id: i.productVariationId!, quantity: i.qty }));
    if (!orderItems.length) return;
    setCouponError(null);
    setCouponValidating(true);
    try {
      const res = await adminValidateCoupon({
        coupon: code,
        order_items: orderItems,
        ...(customerId ? { customer_id: customerId } : {}),
      });
      const disc = Number(
        res?.data?.totals?.total_coupon_discount ??
        res?.totals?.total_coupon_discount ??
        0
      );
      setAppliedCoupon({ code, discount: disc });
      setCouponInputVal("");
      toast.success(`Coupon applied! -৳${disc}`);
    } catch (err: unknown) {
      const e = err as ApiError;
      const raw: string =
        e?.response?.data?.error || e?.message || "Invalid coupon";
      // Rephrase the cryptic backend message for admin context
      const msg = raw.toLowerCase().includes("log in")
        ? "This coupon has a per-user limit. Please select a customer first."
        : raw;
      setCouponError(msg);
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInputVal("");
  };

  // ---------- PLACE ORDER ----------
  const canPlaceExisting = useMemo(() => {
    if (cart.length === 0) return false;
    if (!customerId) return false;
    if (!addressId) return false;
    if (!deliveryChargeId) return false;
    if (payBy === "bkash" && trx.trim() === "") return false;

    const anyMissingVariation = cart.some((i) => !Number(i.productVariationId));
    if (anyMissingVariation) return false;

    return true;
  }, [cart, customerId, addressId, deliveryChargeId, payBy, trx]);

  const canPlaceStranger = useMemo(() => {
    if (cart.length === 0) return false;
    if (!deliveryChargeId) return false;
    if (
      !strangerName.trim() ||
      !strangerPhone.trim() ||
      !strangerFullAddress.trim()
    )
      return false;
    if (payBy === "bkash" && trx.trim() === "") return false;

    const anyMissingVariation = cart.some((i) => !Number(i.productVariationId));
    if (anyMissingVariation) return false;

    return true;
  }, [
    cart,
    deliveryChargeId,
    strangerName,
    strangerPhone,
    strangerFullAddress,
    payBy,
    trx,
  ]);

  const placeExistingMutation = useMutation({
    mutationFn: async () => {
      const order_items = cart.map((i) => ({
        product_variation_id: Number(i.productVariationId),
        quantity: Number(i.qty),
      }));

      return createManualOrder({
        customer_id: Number(customerId),
        address_id: Number(addressId),
        payment_type: payBy === "bkash" ? "bkash" : "cod",
        trx_id: payBy === "bkash" ? trx.trim() : undefined,
        delivery_charge_id: Number(deliveryChargeId),
        note: note.trim() || undefined,
        coupon_code: appliedCoupon?.code || undefined,
        order_items,
      } as any);
    },
    onSuccess: (data) => {
      if (data?.success === true) {
        toast.success(data?.message || "Order created");
        window.dispatchEvent(new CustomEvent("new-sale-clear-cart"));
        setNote("");
        setAppliedCoupon(null);
        setCouponInputVal("");
        setTrx("");
        return;
      }
      toast.error(data?.error || data?.message || "Failed to place order");
    },
    onError: (err: ApiError) => {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      toast.error(serverMsg || err?.message || "Failed to place order");
    },
  });

  const placeStrangerMutation = useMutation({
    mutationFn: async () => {
      const order_items = cart.map((i) => ({
        product_variation_id: Number(i.productVariationId),
        quantity: Number(i.qty),
      }));

      return createManualOrderStranger({
        name: strangerName.trim(),
        phone: strangerPhone.trim(),
        email: strangerEmail.trim() || undefined,
        full_address: strangerFullAddress.trim(),
        city: strangerZone?.city_name || undefined,
        location_mapping_id: strangerZone?.location_mapping_id,
        zip_code: strangerZip.trim() || undefined,
        payment_type: payBy === "bkash" ? "bkash" : "cod",
        trx_id: payBy === "bkash" ? trx.trim() : undefined,
        delivery_charge_id: Number(deliveryChargeId),
        note: note.trim() || undefined,
        coupon_code: couponCode.trim() || undefined,
        order_items,
      });
    },
    onSuccess: (data) => {
      if (data?.success === true) {
        toast.success(data?.message || "Order created");
        window.dispatchEvent(new CustomEvent("new-sale-clear-cart"));
        setNote("");
        setAppliedCoupon(null);
        setCouponInputVal("");
        setTrx("");
        setStrangerName("");
        setStrangerPhone("");
        setStrangerEmail("");
        setStrangerFullAddress("");
        setStrangerZone(null);
        setStrangerZip("");
        return;
      }
      toast.error(data?.error || data?.message || "Failed to place order");
    },
    onError: (err: ApiError) => {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      toast.error(serverMsg || err?.message || "Failed to place order");
    },
  });

  const placing =
    placeExistingMutation.isPending || placeStrangerMutation.isPending;

  // ---------- UI ----------
  return (
    <SalePanelShell
      icon={<Receipt className="h-4 w-4" />}
      title={t("sales.billing")}
      subtitle={t("sales.billingSubtitle")}
      headerRight={
        <SlidingTabFilter
          options={[
            { label: t("sales.existing"), value: "existing" as CustomerMode },
            { label: t("sales.stranger"), value: "stranger" as CustomerMode },
          ]}
          value={mode}
          onChange={setMode}
        />
      }
      footer={
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-xl"
            startIcon={<Trash2 size={15} />}
            onClick={() =>
              window.dispatchEvent(new CustomEvent("new-sale-clear-cart"))
            }
          >
            {t("sales.clearCart")}
          </Button>

          <Button
            variant="primary"
            className="h-11 flex-[1.35] rounded-xl"
            disabled={
              mode === "existing" ? !canPlaceExisting : !canPlaceStranger
            }
            isLoading={placing}
            loadingText={t("sales.placing")}
            startIcon={<CheckCircle2 size={15} />}
            onClick={() => {
              if (placing) return;

              const anyMissingVariation = cart.some(
                (i) => !Number(i.productVariationId)
              );
              if (anyMissingVariation) {
                toast.error(t("sales.selectVariationError"));
                return;
              }

              if (mode === "existing") {
                if (!canPlaceExisting) {
                  toast.error(t("sales.existingOrderError"));
                  return;
                }
                placeExistingMutation.mutate();
                return;
              }

              if (!canPlaceStranger) {
                toast.error(t("sales.strangerOrderError"));
                return;
              }
              placeStrangerMutation.mutate();
            }}
          >
            {t("sales.placeOrder")}
          </Button>
        </div>
      }
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 custom-scrollbar">

        {/* Cart Items */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel icon={<ShoppingCart size={14} />}>{t("sales.cartItems")}</SectionLabel>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {cart.length}
            </span>
          </div>

          <div className="space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-10 dark:border-gray-700 dark:bg-gray-900/40">
                <ShoppingCart className="mb-2 h-6 w-6 text-gray-300 dark:text-gray-600" />
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("sales.cartIsEmpty")}</p>
              </div>
            ) : (
              cart.map((i) => (
                <div
                  key={i.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {i.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      SKU: {i.sku}
                      {i.colorName || i.variantName ? (
                        <>
                          {" "}
                          • {i.colorName ?? "Color"} •{" "}
                          {i.variantName ?? "Variant"}
                        </>
                      ) : null}{" "}
                      • PV:{" "}
                      {i.productVariationId ? (
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {i.productVariationId}
                        </span>
                      ) : (
                        <span className="font-semibold text-error-600 dark:text-error-300">
                          (Select variation)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(i.key, Math.max(1, i.qty - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold text-gray-700 transition hover:bg-white dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        -
                      </button>
                      <div className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">
                        {i.qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(i.key, i.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-[88px] text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                      {formatCurrencyBDT(i.unitPrice * i.qty)}
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(i.key)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-error-300 hover:bg-error-50 hover:text-error-500 dark:border-gray-700 dark:hover:border-error-500/40 dark:hover:bg-error-500/10"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════ Customer / Stranger ═══════ */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
              <div className="mb-3 flex items-center justify-between gap-3">
                <SectionLabel icon={<User2 size={14} />}>
                  {mode === "existing" ? t("sales.customer") : t("sales.strangerCustomer")}
                </SectionLabel>

                {mode === "existing" ? (
                  <Button
                    onClick={() => setAddCustomerOpen(true)}
                    className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                  >
                    <Plus size={14} /> {t("sales.add")}
                  </Button>
                ) : null}
              </div>

              {mode === "existing" ? (
                <>
                  <div>
                    <input
                      value={userQ}
                      onChange={(e) => {
                        setUsersOffset(0);
                        setUserQ(e.target.value);
                      }}
                      placeholder={t("sales.searchByNameEmailPhone")}
                      className={inputClass}
                    />
                  </div>

                  <div className="mt-3 space-y-2">
                    {usersQuery.isLoading ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
                        {t("sales.loadingCustomers")}
                      </div>
                    ) : users.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
                        {t("sales.noCustomersFound")}
                      </div>
                    ) : (
                      users.map((u) => (
                        <CustomerRow
                          key={u.id}
                          u={u}
                          active={Number(customerId) === Number(u.id)}
                          onPick={() => setCustomerId(Number(u.id))}
                          t={t}
                        />
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      {t("sales.showing")}{" "}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {usersTotal === 0
                          ? 0
                          : Math.min(usersOffset + USERS_LIMIT, usersTotal)}
                      </span>{" "}
                      / {usersTotal}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={usersOffset === 0}
                        onClick={() =>
                          setUsersOffset((o) => Math.max(0, o - USERS_LIMIT))
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ring-1 transition",
                          usersOffset === 0
                            ? "cursor-not-allowed text-gray-400 ring-gray-200 dark:ring-gray-700"
                            : "text-gray-700 ring-gray-200 hover:bg-gray-50 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
                        )}
                      >
                        <ChevronLeft size={14} />
                        {t("sales.prev")}
                      </button>

                      <button
                        type="button"
                        disabled={usersOffset + USERS_LIMIT >= usersTotal}
                        onClick={() => setUsersOffset((o) => o + USERS_LIMIT)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ring-1 transition",
                          usersOffset + USERS_LIMIT >= usersTotal
                            ? "cursor-not-allowed text-gray-400 ring-gray-200 dark:ring-gray-700"
                            : "text-gray-700 ring-gray-200 hover:bg-gray-50 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
                        )}
                      >
                        {t("sales.next")}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <SectionLabel icon={<MapPin size={14} />}>{t("sales.address")}</SectionLabel>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!selectedUser) {
                            toast.error(t("sales.selectCustomerError"));
                            return;
                          }
                          setManualAddressOpen(true);
                        }}
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                      >
                        <Plus size={14} /> {t("sales.add")}
                      </Button>
                    </div>

                    <Select
                      options={addresses.map((a: AdminUserAddress) => ({
                        value: String(a.id),
                        label: `${a.name ? `${a.name} — ` : ""}${a.full_address ?? ""}`,
                      }))}
                      value={addressId ? String(addressId) : ""}
                      onChange={(v) => setAddressId(v ? Number(v) : null)}
                      placeholder={
                        selectedUser
                          ? t("sales.chooseAddress")
                          : t("sales.selectCustomerFirst")
                      }
                      searchable
                    />
                  </div>

                  {/* ── Admin Manual Verification Panel ── */}
                  {selectedUser && (() => {
                    const selAddr = addresses.find((a) => Number(a.id) === Number(addressId)) ?? null;
                    return (
                      <div className="mt-3">
                        <AdminManualVerificationPanel
                          customer={selectedUser}
                          address={selAddr}
                        />
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-6">
                    <SectionLabel>{t("sales.name")}</SectionLabel>
                    <input
                      value={strangerName}
                      onChange={(e) => setStrangerName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <SectionLabel>{t("sales.phone")}</SectionLabel>
                    <input
                      value={strangerPhone}
                      onChange={(e) => setStrangerPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="col-span-12">
                    <SectionLabel>{t("sales.fullAddress")}</SectionLabel>
                    <input
                      value={strangerFullAddress}
                      onChange={(e) => setStrangerFullAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="col-span-12">
                    <SectionLabel>{t("sales.email")}</SectionLabel>
                    <input
                      value={strangerEmail}
                      onChange={(e) => setStrangerEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6 relative z-20">
                    <SectionLabel>{t("sales.zone")}</SectionLabel>
                    <AdminZonePicker
                      value={strangerZone}
                      onChange={(sel: ZoneSelection | null) => setStrangerZone(sel)}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <SectionLabel>{t("sales.zip")}</SectionLabel>
                    <input
                      value={strangerZip}
                      onChange={(e) => setStrangerZip(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ Delivery + Payment + Totals ═══════ */}
          <div className="col-span-12 lg:col-span-5">
            <div className="space-y-4">
              {/* Delivery */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
                <SectionLabel icon={<Truck size={14} />}>{t("sales.deliveryChargeLabel")}</SectionLabel>
                <div className="mt-2">
                  <Select
                    options={deliveryCharges.map((d) => ({
                      value: String(d.id),
                      label: `${d.title} — ${formatCurrencyBDT(d.customer_charge)}`,
                    }))}
                    value={deliveryChargeId ? String(deliveryChargeId) : ""}
                    onChange={(v) => setDeliveryChargeId(v ? Number(v) : null)}
                    placeholder={
                      deliveryChargesQuery.isLoading
                        ? t("sales.loading")
                        : t("sales.chooseDeliveryCharge")
                    }
                  />
                </div>
              </div>

              {/* Mixed Delivery Alert */}
              {hasMixedDelivery && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/5">
                  <span className="mt-0.5 shrink-0">🚚</span>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Your cart has <strong>mixed delivery</strong>: some items ship free, others don't. A delivery charge applies, but free-delivery items are <strong>excluded from weight surcharge</strong>.
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 dark:border-gray-800 dark:from-white/[0.04] dark:to-white/[0.01]">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t("sales.subtotal")}</span>
                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatCurrencyBDT(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><Truck size={13} /> {t("sales.delivery")}</span>
                    {totals.delivery === 0 ? (
                      <span className="font-semibold text-success-600 dark:text-success-400">🚚 FREE</span>
                    ) : (
                      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatCurrencyBDT(totals.delivery)}</span>
                    )}
                  </div>
                  {totals.weightSurcharge > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">⚖ Weight Surcharge ({totals.weightKgTotal.toFixed(2)} kg)</span>
                        <span className="font-semibold text-orange-500">+{formatCurrencyBDT(totals.weightSurcharge)}</span>
                      </div>
                      {hasMixedDelivery && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">⚠️ Surcharge applies to paid-delivery items only</p>
                      )}
                    </div>
                  )}
                  {totals.bulkDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">⚡ Bulk Discount</span>
                      <span className="font-semibold text-success-600 dark:text-success-400">-{formatCurrencyBDT(totals.bulkDiscount)}</span>
                    </div>
                  )}
                  {totals.comboDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">🎁 Combo Discount</span>
                      <span className="font-semibold text-success-600 dark:text-success-400">-{formatCurrencyBDT(totals.comboDiscount)}</span>
                    </div>
                  )}
                  {totals.cartWideDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">🏷️ Cart Discount</span>
                      <span className="font-semibold text-success-600 dark:text-success-400">-{formatCurrencyBDT(totals.cartWideDiscount)}</span>
                    </div>
                  )}
                  {totals.skuDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">% Item Discount</span>
                      <span className="font-semibold text-success-600 dark:text-success-400">-{formatCurrencyBDT(totals.skuDiscount)}</span>
                    </div>
                  )}
                  {appliedCoupon && appliedCoupon.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">🎟️ Coupon Discount</span>
                      <span className="font-semibold text-success-600 dark:text-success-400">-{formatCurrencyBDT(appliedCoupon.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{t("sales.total")}</span>
                      <span className="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">{formatCurrencyBDT(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
                <SectionLabel icon={<Ticket size={14} />}>{t("sales.coupon")}</SectionLabel>
                {appliedCoupon ? (
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-success-300 bg-success-50 px-3 py-2.5 dark:border-success-500/30 dark:bg-success-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-success-700 dark:text-success-300">Applied:</span>
                      <span className="text-xs font-bold text-success-800 dark:text-success-200">{appliedCoupon.code}</span>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} className="text-gray-400 transition-colors hover:text-error-500">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={couponInputVal}
                      onChange={(e) => { setCouponInputVal(e.target.value); setCouponError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder={t("sales.optionalCouponCode")}
                      className={cn(inputClass, "flex-1")}
                      disabled={couponValidating}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponValidating || !couponInputVal.trim()}
                      className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {couponValidating ? "..." : "Apply"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1.5 text-[11px] text-error-500">{couponError}</p>
                )}
              </div>

              {/* Note */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
                <SectionLabel icon={<StickyNote size={14} />}>{t("sales.note")}</SectionLabel>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("sales.optionalNote")}
                  className="mt-2 min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/15"
                />
              </div>

              {/* Payment */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
                <SectionLabel icon={<CreditCard size={14} />}>{t("sales.payment")}</SectionLabel>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPayBy("cod")}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition-all",
                      payBy === "cod"
                        ? "bg-brand-500 text-white ring-brand-500"
                        : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
                    )}
                  >
                    {t("sales.cod")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayBy("bkash")}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition-all",
                      payBy === "bkash"
                        ? "bg-brand-500 text-white ring-brand-500"
                        : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
                    )}
                  >
                    {t("sales.bkash")}
                  </button>
                </div>

                {payBy === "bkash" ? (
                  <div className="mt-3">
                    <SectionLabel>{t("sales.bkashTrxId")}</SectionLabel>
                    <input
                      value={trx}
                      onChange={(e) => setTrx(e.target.value)}
                      placeholder={t("sales.enterTransactionId")}
                      className={cn(inputClass, "mt-1")}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

      </div>

      <AddCustomerModal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onCreated={(data) => setCustomerId(data.id)}
      />

      {manualAddressOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[760px] overflow-visible rounded-xl bg-white shadow-theme-lg dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("sales.addAddress")}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("sales.createManualAddress")}
              </p>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <SectionLabel>{t("sales.name")}</SectionLabel>
                  <input
                    value={manualAddressName}
                    onChange={(e) => setManualAddressName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <SectionLabel>{t("sales.phone")}</SectionLabel>
                  <input
                    value={manualAddressPhone}
                    onChange={(e) => setManualAddressPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-12">
                  <SectionLabel>{t("sales.fullAddress")}</SectionLabel>
                  <input
                    value={manualAddressFull}
                    onChange={(e) => setManualAddressFull(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-12 md:col-span-4 relative z-20">
                  <SectionLabel>{t("sales.zone")}</SectionLabel>
                  <AdminZonePicker
                    value={manualAddressZone}
                    onChange={(sel: ZoneSelection | null) => setManualAddressZone(sel)}
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <SectionLabel>{t("sales.zip")}</SectionLabel>
                  <input
                    value={manualAddressZip}
                    onChange={(e) => setManualAddressZip(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <SectionLabel>{t("sales.type")}</SectionLabel>
                  <Select
                    options={[
                      { value: "n/a", label: "N/A" },
                      { value: "home", label: "Home" },
                      { value: "office", label: "Office" },
                    ]}
                    value={manualAddressType}
                    onChange={(v) => setManualAddressType(v as "home" | "office" | "n/a")}
                    placeholder="Select type"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setManualAddressOpen(false)}
                >
                  {t("sales.cancel")}
                </Button>
                <Button
                  className="rounded-xl"
                  disabled={
                    !selectedUser ||
                    createAddressMutation.isPending ||
                    !manualAddressName.trim() ||
                    !manualAddressPhone.trim() ||
                    !manualAddressFull.trim()
                  }
                  onClick={() => {
                    if (!selectedUser) return;
                    if (
                      !manualAddressName.trim() ||
                      !manualAddressPhone.trim() ||
                      !manualAddressFull.trim()
                    ) {
                      toast.error(t("sales.addressRequiredError"));
                      return;
                    }

                    createAddressMutation.mutate({
                      customer_id: Number(selectedUser.id),
                      name: manualAddressName.trim(),
                      phone: manualAddressPhone.trim(),
                      full_address: manualAddressFull.trim(),
                      city: manualAddressZone?.city_name || undefined,
                      location_mapping_id: manualAddressZone?.location_mapping_id,
                      zip_code: manualAddressZip.trim() || undefined,
                      type: manualAddressType,
                    });
                  }}
                >
                  {createAddressMutation.isPending
                    ? t("sales.saving")
                    : t("sales.saveAddress")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SalePanelShell>
  );
}
