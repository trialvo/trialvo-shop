// src/components/coupon-code/CouponCodePage.tsx

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { Pagination } from "@/components/ui";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

import CouponModal from "./CouponModal";
import type { CouponRow, DiscountType, Option, CouponScope } from "./types";
import {
  mapApiCouponListItemToRow,
  normalizeCode,
  toApiCouponScope,
  toApiDiscountType,
} from "./types";

import { cn } from "@/lib/utils";
import {
  deleteCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  type ApiCouponPayload,
  type ApiCouponScope,
  type ApiDiscountType,
} from "@/api/coupon.api";

const DISCOUNT_TYPE_OPTIONS: Option[] = [
  { value: "all", label: "All Types" },
  { value: "flat", label: "Flat (৳)" },
  { value: "percent", label: "Percent (%)" },
];

const SCOPE_OPTIONS: Option[] = [
  { value: "all", label: "All Scope" },
  { value: "all_only", label: "All" },
  { value: "specified_only", label: "Specified" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function toScopeFilter(v: string): ApiCouponScope | undefined {
  if (v === "all_only") return "all";
  if (v === "specified_only") return "specified";
  return undefined;
}

function toDiscountTypeFilter(v: string): ApiDiscountType | undefined {
  if (v === "flat") return 0;
  if (v === "percent") return 1;
  return undefined;
}

function toStatusFilter(v: string): boolean | undefined {
  if (v === "active") return true;
  if (v === "inactive") return false;
  return undefined;
}

export default function CouponCodePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");

  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>("all");
  const [productScopeFilter, setProductScopeFilter] = useState<string>("all");
  const [customerScopeFilter, setCustomerScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [limit] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null);

  const couponsQuery = useQuery({
    queryKey: [
      "coupons",
      {
        search,
        discountTypeFilter,
        productScopeFilter,
        customerScopeFilter,
        statusFilter,
        limit,
        page,
      },
    ],
    queryFn: () =>
      getCoupons({
        search: search.trim() ? search.trim() : undefined,
        discount_type: toDiscountTypeFilter(discountTypeFilter),
        product_scope: toScopeFilter(productScopeFilter),
        customer_scope: toScopeFilter(customerScopeFilter),
        status: toStatusFilter(statusFilter),
        limit,
        offset: page * limit,
      }),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const rows: CouponRow[] = useMemo(() => {
    const data = couponsQuery.data?.data ?? [];
    return data.map(mapApiCouponListItemToRow);
  }, [couponsQuery.data]);

  const total = couponsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (row: CouponRow) => {
    setModalMode("edit");
    setEditingId(row.id);
    setModalOpen(true);
  };

  const openDelete = (row: CouponRow) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["coupons"] }).catch(() => undefined);

  const toggleStatusMutation = useMutation({
    mutationFn: (p: { id: number; status: boolean }) =>
      updateCoupon(p.id, { status: p.status } satisfies ApiCouponPayload),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("businessSettings.coupon.statusUpdated"));
        invalidate();
        return;
      }
      toast.error(res?.error ?? res?.message ?? t("businessSettings.coupon.failedUpdate"));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("businessSettings.coupon.couponDeleted"));
        invalidate();
        return;
      }
      toast.error(res?.error ?? res?.message ?? t("businessSettings.coupon.failedDelete"));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to delete";
      toast.error(msg);
    },
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const getProductScopeLabel = (r: CouponRow) =>
    r.productScope === "all" ? t("businessSettings.coupon.allProducts") : `${r.productCount} ${t("businessSettings.coupon.products")}`;

  const getCustomerScopeLabel = (r: CouponRow) =>
    r.customerScope === "all"
      ? t("businessSettings.coupon.allCustomers")
      : `${r.customerCount} ${t("businessSettings.coupon.customers")}`;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Button onClick={openCreate} startIcon={<Plus size={16} />}>
          {t("businessSettings.coupon.addNew")}
        </Button>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-[320px]">
            <Input
              startIcon={<Search size={16} className="text-gray-400" />}
              className="pl-9"
              placeholder={t("businessSettings.coupon.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <Button
            variant="outline"
            startIcon={<Download size={16} />}
            onClick={() => console.log("Export coupons")}
          >
            {t("common.export")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Select
            key={`dt-${discountTypeFilter}`}
            options={DISCOUNT_TYPE_OPTIONS}
            placeholder="Discount Type"
            defaultValue={discountTypeFilter}
            onChange={(v) => {
              setDiscountTypeFilter(String(v));
              setPage(0);
            }}
          />
        </div>

        <div>
          <Select
            key={`ps-${productScopeFilter}`}
            options={[
              { value: "all", label: "Product Scope (All)" },
              { value: "all_only", label: "Product: All" },
              { value: "specified_only", label: "Product: Specified" },
            ]}
            placeholder="Product Scope"
            defaultValue={productScopeFilter}
            onChange={(v) => {
              setProductScopeFilter(String(v));
              setPage(0);
            }}
          />
        </div>

        <div>
          <Select
            key={`cs-${customerScopeFilter}`}
            options={[
              { value: "all", label: "Customer Scope (All)" },
              { value: "all_only", label: "Customer: All" },
              { value: "specified_only", label: "Customer: Specified" },
            ]}
            placeholder="Customer Scope"
            defaultValue={customerScopeFilter}
            onChange={(v) => {
              setCustomerScopeFilter(String(v));
              setPage(0);
            }}
          />
        </div>

        <div>
          <Select
            key={`st-${statusFilter}`}
            options={STATUS_OPTIONS}
            placeholder="Status"
            defaultValue={statusFilter}
            onChange={(v) => {
              setStatusFilter(String(v));
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("businessSettings.coupon.couponList")}
            </h3>
            <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {total}
            </span>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("pagination.page")} <span className="font-semibold">{page + 1}</span> /{" "}
            {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                {[
                  "SL",
                  "Title",
                  "Code",
                  "Type",
                  "Discount",
                  "Min Purchase",
                  "Max Discount",
                  "Products",
                  "Customers",
                  "Start",
                  "Expire",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-4 text-left text-xs font-semibold text-brand-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {couponsQuery.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td colSpan={13} className="px-4 py-6">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
                : rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {page * limit + idx + 1}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {r.title}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {normalizeCode(r.code)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {r.discountType === "flat" ? t("businessSettings.coupon.flat") : t("businessSettings.coupon.percent")}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {r.discountType === "flat"
                        ? `৳ ${r.discountValue}`
                        : `${r.discountValue}%`}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      ৳ {r.minPurchase}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {r.discountType === "percent"
                        ? `৳ ${r.maxDiscount}`
                        : "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {getProductScopeLabel(r)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {getCustomerScopeLabel(r)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {r.startDate}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {r.expireDate}
                    </td>

                    <td className="px-4 py-4">
                      <Switch
                        label=""
                        defaultChecked={r.status}
                        disabled={toggleStatusMutation.isPending}
                        onChange={(checked) =>
                          toggleStatusMutation.mutate({
                            id: r.id,
                            status: checked,
                          })
                        }
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                          onClick={() => openEdit(r)}
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-error-200 bg-white text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-900/40 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10"
                          onClick={() => openDelete(r)}
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!couponsQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("businessSettings.coupon.noCoupons")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          totalItems={total}
          page={page + 1}
          pageSize={limit}
          onPageChange={(next) => setPage(Math.max(0, next - 1))}
          className="shadow-none"
        />
      </div>

      <CouponModal
        open={modalOpen}
        mode={modalMode}
        couponId={editingId}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          setEditingId(null);
          invalidate();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t("businessSettings.coupon.deleteCoupon")}
        message={
          deleteTarget
            ? t("businessSettings.coupon.confirmDeleteNamed", { name: deleteTarget.title })
            : t("businessSettings.coupon.confirmDelete")
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        tone="danger"
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
