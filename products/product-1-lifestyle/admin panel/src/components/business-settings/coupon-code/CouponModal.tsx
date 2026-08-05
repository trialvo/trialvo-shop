// src/components/coupon-code/CouponModal.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Search, X } from "lucide-react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import DatePicker from "@/components/form/date-picker";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

import type { CouponScope, DiscountType, Option, ProductLite, CustomerLite } from "./types";
import {
  normalizeCode,
  safeNumber,
  todayISO,
  toApiCouponScope,
  toApiDiscountType,
  toCouponScope,
  toDiscountType,
  toYmdFromIso,
  toBoolStatus,
} from "./types";

import {
  createCoupon,
  getCouponById,
  getProductScope,
  getUsersScope,
  updateCoupon,
  type ApiCouponCreateResponse,
} from "@/api/coupon.api";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  couponId: number | null;
  onClose: () => void;
  onSaved: () => void;
};

const DISCOUNT_TYPE_OPTIONS: Option[] = [
  { value: "flat", label: "Amount (৳)" },
  { value: "percent", label: "Percent (%)" },
];

const SCOPE_OPTIONS: Option[] = [
  { value: "all", label: "All" },
  { value: "specified", label: "Specified" },
];

function makeRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function addDaysISO(baseIso: string, days: number): string {
  const base = new Date(`${baseIso}T00:00:00`);
  if (Number.isNaN(base.getTime())) return baseIso;
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapProductScopeToLite(p: any): ProductLite {
  const variationId = Number(p?.variation_id ?? 0);
  const sku = String(p?.sku ?? "");
  const productName = String(p?.product_name ?? "");
  const variant = p?.variant_name ? String(p.variant_name) : "";
  const color = p?.color_name ? String(p.color_name) : "";
  const name = [productName, variant, color].filter(Boolean).join(" - ");

  return {
    id: variationId,
    sku,
    name: name || sku || `Variation #${variationId}`,
  };
}

function mapUserScopeToLite(u: any): CustomerLite {
  const id = Number(u?.id ?? 0);
  const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() || `User #${id}`;
  const email = typeof u?.email === "string" ? u.email : undefined;
  const phone =
    Array.isArray(u?.verified_phones) && u.verified_phones.length > 0
      ? String(u.verified_phones[0])
      : undefined;

  return { id, name, email, phone };
}

function getResponseId(res: any): number | null {
  if (typeof res?.id === "number") return res.id;
  if (typeof res?.data?.id === "number") return res.data.id;
  return null;
}

export default function CouponModal({ open, mode, couponId, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("flat");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [minPurchase, setMinPurchase] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [limitPerUser, setLimitPerUser] = useState<number>(1);

  const [startDate, setStartDate] = useState<string>(todayISO());
  const [expireDate, setExpireDate] = useState<string>(todayISO());
  const [status, setStatus] = useState<boolean>(true);

  const [productScope, setProductScope] = useState<CouponScope>("all");
  const [productIds, setProductIds] = useState<number[]>([]);
  const [customerScope, setCustomerScope] = useState<CouponScope>("all");
  const [customerIds, setCustomerIds] = useState<number[]>([]);

  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const selectedProductMapRef = useRef<Map<number, ProductLite>>(new Map());
  const selectedCustomerMapRef = useRef<Map<number, CustomerLite>>(new Map());

  const singleQuery = useQuery({
    queryKey: ["coupon", couponId],
    queryFn: () => {
      if (!couponId) throw new Error("couponId missing");
      return getCouponById(couponId);
    },
    enabled: open && mode === "edit" && Boolean(couponId),
    retry: 1,
  });

  useEffect(() => {
    if (!open) return;

    hydratedRef.current = false;

    if (mode === "create") {
      setTitle("");
      setCode(makeRandomCode());
      setDiscountType("flat");
      setDiscountValue(0);
      setMinPurchase(0);
      setMaxDiscount(0);
      setLimitPerUser(1);
      setStartDate(todayISO());
      setExpireDate(todayISO());
      setStatus(true);

      setProductScope("all");
      setProductIds([]);
      setCustomerScope("all");
      setCustomerIds([]);

      setProductSearch("");
      setCustomerSearch("");

      selectedProductMapRef.current = new Map();
      selectedCustomerMapRef.current = new Map();
      return;
    }

    setProductSearch("");
    setCustomerSearch("");
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;
    if (!singleQuery.data?.success) return;
    if (hydratedRef.current) return;

    const d = singleQuery.data.data;

    setTitle(String(d.title ?? ""));
    setCode(String(d.code ?? ""));
    setDiscountType(toDiscountType(d.discount_type));
    setDiscountValue(Number(d.discount ?? 0));

    setMinPurchase(Number(d.min_purchase_amount ?? 0));
    setMaxDiscount(Number(d.max_discount_amount ?? 0));
    setLimitPerUser(Number(d.limit_per_user ?? 1));

    setProductScope(toCouponScope(d.product_scope));
    setCustomerScope(toCouponScope(d.customer_scope));

    setStartDate(toYmdFromIso(String(d.start_date ?? todayISO())));
    setExpireDate(toYmdFromIso(String(d.expire_date ?? todayISO())));
    setStatus(toBoolStatus(d.status));

    const pv = Array.isArray(d.product_variations) ? d.product_variations : [];
    const nextProductIds = pv.map((x) => Number(x.product_variation_id)).filter((x) => Number.isFinite(x));
    setProductIds(nextProductIds);

    const cm = Array.isArray(d.customers) ? d.customers : [];
    const nextCustomerIds = cm.map((x) => Number(x.id)).filter((x) => Number.isFinite(x));
    setCustomerIds(nextCustomerIds);

    const pMap = new Map<number, ProductLite>();
    pv.forEach((x) => {
      const id = Number(x.product_variation_id);
      if (!Number.isFinite(id)) return;
      pMap.set(id, { id, sku: String(x.sku ?? ""), name: String(x.name ?? String(x.sku ?? "")) });
    });
    selectedProductMapRef.current = pMap;

    const cMap = new Map<number, CustomerLite>();
    cm.forEach((x) => {
      const id = Number(x.id);
      if (!Number.isFinite(id)) return;
      const name = [x.first_name, x.last_name].filter(Boolean).join(" ").trim() || `User #${id}`;
      const phone = x.default_phone ? String(x.default_phone) : undefined;
      cMap.set(id, { id, name, phone });
    });
    selectedCustomerMapRef.current = cMap;

    hydratedRef.current = true;
  }, [open, mode, singleQuery.data]);

  useEffect(() => {
    if (productScope === "all") setProductIds([]);
  }, [productScope]);

  useEffect(() => {
    if (customerScope === "all") setCustomerIds([]);
  }, [customerScope]);

  useEffect(() => {
    if (!startDate || !expireDate) return;
    if (startDate > expireDate) {
      setExpireDate(startDate);
    }
  }, [startDate, expireDate]);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (!normalizeCode(code)) return false;
    if (discountValue <= 0) return false;
    if (startDate && expireDate && startDate > expireDate) return false;

    if (productScope === "specified" && productIds.length === 0) return false;
    if (customerScope === "specified" && customerIds.length === 0) return false;

    if (discountType === "percent" && discountValue > 100) return false;

    return true;
  }, [
    title,
    code,
    discountValue,
    startDate,
    expireDate,
    productScope,
    productIds.length,
    customerScope,
    customerIds.length,
    discountType,
  ]);

  const toggleId = (list: number[], id: number): number[] => {
    if (list.includes(id)) return list.filter((x) => x !== id);
    return [...list, id];
  };

  /** ✅ Dynamic Product Scope */
  const productQuery = useInfiniteQuery({
    queryKey: ["productScope", productSearch],
    queryFn: ({ pageParam }) =>
      getProductScope({
        search: productSearch.trim() ? productSearch.trim() : undefined,
        status: true,
        limit: 20,
        offset: Number(pageParam ?? 0),
      }),
    enabled: open && productScope === "specified",
    getNextPageParam: (lastPage, allPages) => {
      const total = Number(lastPage?.total ?? 0);
      const loaded = allPages.reduce((acc, p) => acc + (p?.data?.length ?? 0), 0);
      if (loaded >= total) return undefined;
      return loaded;
    },
    retry: 1,
    initialPageParam: 0,
  });

  const productOptions: ProductLite[] = useMemo(() => {
    const pages = productQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.data ?? []).map(mapProductScopeToLite);
  }, [productQuery.data]);

  /** ✅ Dynamic Customer Scope */
  const customerQuery = useInfiniteQuery({
    queryKey: ["usersScope", customerSearch],
    queryFn: ({ pageParam }) =>
      getUsersScope({
        search: customerSearch.trim() ? customerSearch.trim() : undefined,
        status: "active", // ✅ FIX
        limit: 20,
        offset: Number(pageParam ?? 0),
      }),
    enabled: open && customerScope === "specified",
    getNextPageParam: (lastPage, allPages) => {
      const total = Number(lastPage?.total ?? 0);
      const loaded = allPages.reduce((acc, p) => acc + (p?.data?.length ?? 0), 0);
      if (loaded >= total) return undefined;
      return loaded;
    },
    retry: 1,
    initialPageParam: 0,
  });

  const customerOptions: CustomerLite[] = useMemo(() => {
    const pages = customerQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.data ?? []).map(mapUserScopeToLite);
  }, [customerQuery.data]);

  const invalidateCouponList = async () => {
    // ✅ IMPORTANT:
    // Make sure your Coupon List page uses query keys starting with ["coupons"] for list fetching.
    await queryClient.invalidateQueries({ queryKey: ["coupons"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        title: title.trim(),
        code: normalizeCode(code),
        discount: discountValue,
        discount_type: toApiDiscountType(discountType),
        min_purchase_amount: minPurchase,
        max_discount_amount: discountType === "percent" ? maxDiscount : 0,
        limit_per_user: limitPerUser,

        product_scope: toApiCouponScope(productScope),
        product_variation_ids: productScope === "specified" ? productIds : [],

        customer_scope: toApiCouponScope(customerScope),
        customer_ids: customerScope === "specified" ? customerIds : [],

        start_date: startDate,
        expire_date: expireDate,
        status,
      }),
    onSuccess: async (res: ApiCouponCreateResponse | any) => {
      const createdId = getResponseId(res);
      if (createdId) {
        toast.success(`Coupon created (ID: ${createdId})`);

        // ✅ refresh list after success create
        await invalidateCouponList();

        onSaved();
        return;
      }

      if (res?.success === true) {
        toast.success("Coupon created");
        await invalidateCouponList();
        onSaved();
        return;
      }

      toast.error(res?.error ?? res?.message ?? "Failed to create coupon");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to create coupon";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!couponId) throw new Error("couponId missing");
      return updateCoupon(couponId, {
        title: title.trim(),
        code: normalizeCode(code),
        discount: discountValue,
        discount_type: toApiDiscountType(discountType),
        min_purchase_amount: minPurchase,
        max_discount_amount: discountType === "percent" ? maxDiscount : 0,
        limit_per_user: limitPerUser,

        product_scope: toApiCouponScope(productScope),
        product_variation_ids: productScope === "specified" ? productIds : [],

        customer_scope: toApiCouponScope(customerScope),
        customer_ids: customerScope === "specified" ? customerIds : [],

        start_date: startDate,
        expire_date: expireDate,
        status,
      });
    },
    onSuccess: async (res: any) => {
      const updatedId = getResponseId(res);
      if (updatedId) {
        toast.success(`Coupon updated (ID: ${updatedId})`);

        // ✅ refresh list after success update
        await invalidateCouponList();

        onSaved();
        return;
      }

      if (res?.success === true) {
        toast.success("Coupon updated");
        await invalidateCouponList();
        onSaved();
        return;
      }

      toast.error(res?.error ?? res?.message ?? "Failed to update coupon");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to update coupon";
      toast.error(msg);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submit = () => {
    if (!canSave || isSaving) return;
    if (mode === "create") createMutation.mutate();
    else updateMutation.mutate();
  };

  const selectedProducts = useMemo(() => {
    const map = selectedProductMapRef.current;
    return productIds.map((id) => map.get(id) ?? { id, sku: `#${id}`, name: `Variation #${id}` });
  }, [productIds]);

  const selectedCustomers = useMemo(() => {
    const map = selectedCustomerMapRef.current;
    return customerIds.map((id) => map.get(id) ?? { id, name: `User #${id}` });
  }, [customerIds]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto p-2 sm:p-4 md:p-6">
      <button
        type="button"
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close overlay"
      />

      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative mx-auto my-2 flex w-full max-w-5xl max-h-[calc(100dvh-1rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === "create" ? "Add New Coupon" : "Edit Coupon"}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Advanced coupon rules (products + customers scope)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Main form */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title <span className="text-error-500">*</span>
                </p>
                <Input placeholder="New coupon" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code <span className="text-error-500">*</span>
                </p>
                <div className="flex gap-2">
                  <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
                  <Button variant="outline" onClick={() => setCode(makeRandomCode())} className="shrink-0">
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</p>
                <Select
                  key={`dt-${discountType}`}
                  options={DISCOUNT_TYPE_OPTIONS}
                  placeholder="Select type"
                  defaultValue={discountType}
                  onChange={(v) => setDiscountType(v as DiscountType)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount <span className="text-error-500">*</span>
                </p>
                <Input
                  type="number"
                  value={String(discountValue)}
                  onChange={(e) => setDiscountValue(safeNumber(e.target.value, 0))}
                  placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 200"}
                />
                {discountType === "percent" && discountValue > 100 ? (
                  <p className="text-xs text-error-500">Percent cannot be more than 100</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Purchase (৳)</p>
                <Input type="number" value={String(minPurchase)} onChange={(e) => setMinPurchase(safeNumber(e.target.value, 0))} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Discount (৳)</p>
                <Input
                  type="number"
                  value={String(maxDiscount)}
                  onChange={(e) => setMaxDiscount(safeNumber(e.target.value, 0))}
                  disabled={discountType !== "percent"}
                />
                {discountType !== "percent" ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Only for percent discount</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Limit per user</p>
                <Input
                  type="number"
                  value={String(limitPerUser)}
                  onChange={(e) => setLimitPerUser(safeNumber(e.target.value, 1))}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</p>
                <DatePicker
                  value={startDate}
                  onChange={(v) => setStartDate(v || todayISO())}
                  placeholder="Select start date"
                  showToday
                  showClear={false}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Expire Date</p>
                <DatePicker
                  value={expireDate}
                  onChange={(v) => setExpireDate(v || startDate || todayISO())}
                  min={startDate}
                  placeholder="Select expire date"
                  showToday
                  showClear={false}
                />
                {startDate && expireDate && startDate > expireDate ? (
                  <p className="text-xs text-error-500">Expire date must be after start date</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      const base = startDate || todayISO();
                      setExpireDate(base);
                    }}
                  >
                    Same as start
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      const base = startDate || todayISO();
                      setExpireDate(addDaysISO(base, 7));
                    }}
                  >
                    +7 days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      const base = startDate || todayISO();
                      setExpireDate(addDaysISO(base, 30));
                    }}
                  >
                    +30 days
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                <div className="h-11 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{status ? "Active" : "Inactive"}</p>
                  <Switch label="" defaultChecked={status} onChange={(c) => setStatus(c)} />
                </div>
              </div>
            </div>
          </div>

          {/* Product scope */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Product Scope</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Apply coupon on {productScope === "all" ? "all products" : "specified products"} (selected:{" "}
                  <span className="font-semibold">{productScope === "all" ? "All" : productIds.length}</span>)
                </p>
              </div>

              <div className="w-full md:w-[240px]">
                <Select
                  key={`ps-${productScope}`}
                  options={SCOPE_OPTIONS}
                  placeholder="Select scope"
                  defaultValue={productScope}
                  onChange={(v) => setProductScope(v as CouponScope)}
                />
              </div>
            </div>

            {productScope === "specified" ? (
              <div className="mt-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:w-[340px]">
                    <Input
                      startIcon={<Search size={16} className="text-gray-400" />}
                      className="pl-9"
                      placeholder="Search product by sku / name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" disabled={productIds.length === 0} onClick={() => setProductIds([])}>
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!productQuery.hasNextPage || productQuery.isFetchingNextPage}
                      onClick={() => productQuery.fetchNextPage()}
                    >
                      {productQuery.isFetchingNextPage ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedProducts.map((p) => (
                    <span
                      key={`sp-${p.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {p.sku || `#${p.id}`}
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setProductIds((prev) => prev.filter((x) => x !== p.id))}
                        aria-label="Remove"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-4 max-h-[260px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  {productOptions.map((p) => {
                    const checked = productIds.includes(p.id);
                    if (checked) selectedProductMapRef.current.set(p.id, p);

                    return (
                      <label
                        key={`p-${p.id}`}
                        className="flex cursor-pointer items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 dark:border-gray-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">{p.name}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.sku}</p>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setProductIds((prev) => toggleId(prev, p.id))}
                          className="h-4 w-4 accent-[var(--brand-500)]"
                        />
                      </label>
                    );
                  })}

                  {productQuery.isLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading products...
                    </div>
                  ) : null}

                  {!productQuery.isLoading && productOptions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No products found.
                    </div>
                  ) : null}
                </div>

                {productIds.length === 0 ? (
                  <p className="mt-2 text-xs text-error-500">Select at least one product.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Customer scope */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Customer Scope</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Apply coupon for {customerScope === "all" ? "all customers" : "specified customers"} (selected:{" "}
                  <span className="font-semibold">{customerScope === "all" ? "All" : customerIds.length}</span>)
                </p>
              </div>

              <div className="w-full md:w-[240px]">
                <Select
                  key={`cs-${customerScope}`}
                  options={SCOPE_OPTIONS}
                  placeholder="Select scope"
                  defaultValue={customerScope}
                  onChange={(v) => setCustomerScope(v as CouponScope)}
                />
              </div>
            </div>

            {customerScope === "specified" ? (
              <div className="mt-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:w-[340px]">
                    <Input
                      startIcon={<Search size={16} className="text-gray-400" />}
                      className="pl-9"
                      placeholder="Search customer by name / phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" disabled={customerIds.length === 0} onClick={() => setCustomerIds([])}>
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!customerQuery.hasNextPage || customerQuery.isFetchingNextPage}
                      onClick={() => customerQuery.fetchNextPage()}
                    >
                      {customerQuery.isFetchingNextPage ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 max-h-[260px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  {customerOptions.map((c) => {
                    const checked = customerIds.includes(c.id);
                    if (checked) selectedCustomerMapRef.current.set(c.id, c);

                    return (
                      <label
                        key={`c-${c.id}`}
                        className="flex cursor-pointer items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 dark:border-gray-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">{c.name}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {c.phone ? c.phone : c.email ? c.email : `User #${c.id}`}
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setCustomerIds((prev) => toggleId(prev, c.id))}
                          className="h-4 w-4 accent-[var(--brand-500)]"
                        />
                      </label>
                    );
                  })}

                  {customerQuery.isLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading customers...
                    </div>
                  ) : null}

                  {!customerQuery.isLoading && customerOptions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No customers found.
                    </div>
                  ) : null}
                </div>

                {customerIds.length === 0 ? (
                  <p className="mt-2 text-xs text-error-500">Select at least one customer.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || isSaving}>
            {isSaving ? "Saving..." : mode === "create" ? "Create Coupon" : "Update Coupon"}
          </Button>
        </div>
      </div>
    </div>
  );
}
