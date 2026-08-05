// src/components/customers/customers-list/CustomersListPage.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  RefreshCcw,
  Search,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldX,
  KeyRound,
  KeySquare,
  UserCheck,
  UserX,
} from "lucide-react";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { Pagination, Tabs } from "@/components/ui";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import StatusToggle from "@/components/ui/button/StatusToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

import { cn } from "@/lib/utils";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";

import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserStatus,
  restoreAdminUser,
  type AdminUserEntity,
  type AdminUserStatus,
} from "@/api/admin-users.api";

import EditCustomerModal from "./EditCustomerModal";
import type { CustomerRow, TabConfig, UserStatusTab } from "./types";

type Option = { value: string; label: string };

const TABS: TabConfig[] = [
  { key: "ALL", label: "ALL" },
  { key: "ACTIVE", label: "ACTIVE" },
  { key: "INACTIVE", label: "INACTIVE" },
  { key: "SUSPENDED", label: "SUSPENDED" },
  { key: "DELETED", label: "DELETED" },
];

const PAGE_SIZE_OPTIONS: Option[] = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
];

function formatBdt(n: number): string {
  const fixed = Number(n ?? 0).toFixed(2);
  const [i = "0", d = "00"] = fixed.split(".");
  const withComma = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${withComma}.${d}`;
}

function normalizeStatus(s: string): AdminUserStatus | string {
  const v = String(s ?? "").toLowerCase();
  if (v === "active" || v === "inactive" || v === "suspended") return v;
  return v;
}

function toCustomerRow(u: AdminUserEntity): CustomerRow {
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();

  const firstPhone = u.phones?.[0];
  const phone = firstPhone?.phone_number ?? null;

  const phone_verified = Boolean(
    firstPhone?.is_verified === true || firstPhone?.is_verified === 1,
  );

  const deleted_at = u.deleted_at ?? null;
  const isDeleted = Boolean(deleted_at);

  return {
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    name: name || u.email,

    img_path: u.img_path ?? null,

    status: normalizeStatus(String(u.status ?? "")),
    gender: String(u.gender ?? "unspecified"),
    dob: u.dob ?? null,

    is_email_verified: Boolean(u.is_email_verified),
    is_fully_verified: Boolean(u.is_fully_verified),
    has_password: Boolean(u.has_password),

    total_spent: Number(u.total_spent ?? 0),

    phone,
    phone_verified,

    created_at: u.created_at,
    deleted_at,
    isDeleted,
  };
}

function deletedBadgeColor(isDeleted: boolean): "error" | "success" {
  return isDeleted ? "error" : "success";
}

/** Small icon pill for verification indicators */
function VerifyIcon({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}): React.ReactNode {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
        ok ? "bg-success-600 text-white" : "bg-error-600 text-white",
      )}
      title={label}
      aria-label={label}
    >
      <Icon size={12} />
    </span>
  );
}

function IconBadge({
  ok,
  label,
  okIcon,
  badIcon,
}: {
  ok: boolean;
  label: string;
  okIcon: React.ReactNode;
  badIcon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold",
        ok
          ? "border-success-200 bg-success-50 text-success-700 dark:border-success-900/40 dark:bg-success-500/10 dark:text-success-300"
          : "border-error-200 bg-error-50 text-error-700 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300",
      )}
      title={label}
      aria-label={label}
    >
      {ok ? okIcon : badIcon}
      <span className="truncate">{label}</span>
    </div>
  );
}

export default function CustomersListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<UserStatusTab>("ALL");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce: wait 350ms after the user stops typing before querying
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val.trim());
      setPage(1);
    }, 350);
  };

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  // delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);

  // restore confirm
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<CustomerRow | null>(null);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);


  // Map tab to API params
  const statusParam = activeTab === "ALL" || activeTab === "DELETED" ? undefined : activeTab.toLowerCase();
  const isDeletedParam = activeTab === "DELETED" ? true : undefined;

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const usersQuery = useQuery({
    queryKey: ["adminUsers", { limit: pageSize, offset, search: debouncedSearch, status: statusParam, is_deleted: isDeletedParam }],
    queryFn: () =>
      getAdminUsers({
        limit: pageSize,
        offset,
        search: debouncedSearch || undefined,
        status: statusParam,
        is_deleted: isDeletedParam,
      }),
    retry: 1,
  });

  const rows: CustomerRow[] = useMemo(() => {
    const list = usersQuery.data?.users ?? [];
    return list.map(toCustomerRow);
  }, [usersQuery.data]);

  // Tab counts: use the meta total for ALL; others rely on what the server returns for that filter
  const counts = useMemo(() => {
    const map: Record<UserStatusTab, number> = {
      ALL: usersQuery.data?.meta?.total ?? rows.length,
      ACTIVE: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
      DELETED: 0,
    };
    for (const r of rows) {
      const s = String(r.status).toLowerCase();
      if (s === "active") map.ACTIVE += 1;
      if (s === "inactive") map.INACTIVE += 1;
      if (s === "suspended") map.SUSPENDED += 1;
      if (r.isDeleted) map.DELETED += 1;
    }
    return map;
  }, [rows, usersQuery.data]);

  // No client-side filtering — backend does it all; just use rows directly
  const filtered = rows;

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

  const headerTime = useMemo(() => {
    const d = refreshedAt;
    const month = d.toLocaleString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${month} ${day}, ${year} at ${time}`;
  }, [refreshedAt]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["adminUsers"] }).catch(() => undefined);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success("User deactivated");
      setDeleteOpen(false);
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to deactivate user";
      toast.error(msg);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreAdminUser(id),
    onSuccess: () => {
      toast.success("User restored");
      setRestoreOpen(false);
      setRestoreTarget(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to restore user";
      toast.error(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminUserStatus }) =>
      updateAdminUserStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update status";
      toast.error(msg);
    },
  });

  const openDelete = (row: CustomerRow) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const openRestore = (row: CustomerRow) => {
    setRestoreTarget(row);
    setRestoreOpen(true);
  };

  const openEdit = (row: CustomerRow) => {
    setEditId(row.id);
    setEditOpen(true);
  };

  const totalItems = usersQuery.data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Tabs + Filters */}
      <div className="rounded-[6px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            tabs={TABS.map((t) => ({ id: t.key, label: t.label, count: counts[t.key] }))}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div className="w-full lg:max-w-sm">
            <div className="relative">
              <Input
                startIcon={<Search size={16} className="text-gray-400" />}
                className="h-11 rounded-[6px] border border-gray-200 bg-white pl-9 dark:border-gray-800 dark:bg-gray-950"
                placeholder="Search name, email, phone, id..."
                value={search}
                onChange={(e) => handleSearchChange(String(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[6px] border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table className="min-w-[1500px] border-collapse whitespace-nowrap text-sm">
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                {[
                  t("customers.table.customer"),
                  t("customers.table.status"),
                  t("customers.table.deleted"),
                  t("customers.table.verification"),
                  t("customers.table.totalSpent"),
                  t("customers.table.gender"),
                  t("customers.table.dob"),
                  t("customers.table.created"),
                  t("customers.table.actions"),
                ].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="px-3 py-3 text-left text-xs font-semibold text-brand-500"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {usersQuery.isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const fallback = imageFallbackSvgDataUri(row.name);
                  const imgUrl = row.img_path
                    ? toPublicUrl(row.img_path)
                    : fallback;

                  const verified = Boolean(
                    row.is_fully_verified || row.is_email_verified,
                  );
                  const statusLower = String(row.status).toLowerCase();
                  const isSuspended = statusLower === "suspended";

                  // Toggle only supports active/inactive
                  const toggleValue =
                    statusLower === "active" ? "active" : "inactive";

                  const disableToggle =
                    row.isDeleted || isSuspended || statusMutation.isPending;

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      {/* CUSTOMER */}
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={row.name}
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

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-brand-500">
                              {row.name}
                            </p>
                            <p className="mt-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-500">
                              #{row.id}
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Mail size={14} />
                              <span className="truncate">{row.email}</span>

                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                )}
                                title={
                                  row.is_email_verified
                                    ? "Phone Verified"
                                    : "Phone Unverified"
                                }
                              >
                                {row.is_email_verified ? (
                                  <CheckCircle2
                                    size={12}
                                    className="text-success-600"
                                  />
                                ) : (
                                  <XCircle
                                    size={12}
                                    className="text-error-600"
                                  />
                                )}
                              </span>
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Phone size={14} />
                              <span className="truncate">
                                {row.phone ?? "—"}
                              </span>

                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                )}
                                title={
                                  row.phone_verified
                                    ? "Phone Verified"
                                    : "Phone Unverified"
                                }
                              >
                                {row.phone_verified ? (
                                  <CheckCircle2
                                    size={12}
                                    className="text-success-600"
                                  />
                                ) : (
                                  <XCircle
                                    size={12}
                                    className="text-error-600"
                                  />
                                )}
                              </span>
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* STATUS (Toggle Only) */}
                      <TableCell className="px-3 py-3">
                        <StatusToggle
                          value={toggleValue}
                          disabled={disableToggle}
                          onChange={(v) => {
                            if (row.isDeleted) return;
                            if (isSuspended) return;

                            statusMutation.mutate({
                              id: row.id,
                              status: v as AdminUserStatus,
                            });
                          }}
                        />
                      </TableCell>

                      {/* DELETED */}
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant="solid"
                            color={deletedBadgeColor(row.isDeleted)}
                            size="sm"
                          >
                            {row.isDeleted ? "Deleted" : "Not Deleted"}
                          </Badge>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {row.isDeleted && row.deleted_at
                              ? `Deleted at: ${new Date(
                                row.deleted_at,
                              ).toLocaleString()}`
                              : "—"}
                          </p>
                        </div>
                      </TableCell>

                      {/* ✅ VERIFICATION (replace text badges with icon tiles) */}
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <IconBadge
                            ok={row.is_email_verified}
                            label="Email"
                            okIcon={<Mail size={16} />}
                            badIcon={<Mail size={16} />}
                          />

                          <IconBadge
                            ok={row.is_fully_verified}
                            label="Full"
                            okIcon={<ShieldCheck size={16} />}
                            badIcon={<ShieldX size={16} />}
                          />

                          <IconBadge
                            ok={row.has_password}
                            label="Password"
                            okIcon={<KeyRound size={16} />}
                            badIcon={<KeySquare size={16} />}
                          />
                        </div>
                      </TableCell>

                      {/* TOTAL SPENT */}
                      <TableCell className="px-3 py-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatBdt(row.total_spent)}{" "}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            BDT
                          </span>
                        </div>
                      </TableCell>

                      {/* GENDER */}
                      <TableCell className="px-3 py-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {row.gender}
                        </p>
                      </TableCell>

                      {/* DOB */}
                      <TableCell className="px-3 py-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {row.dob
                            ? new Date(row.dob).toLocaleDateString()
                            : "—"}
                        </p>
                      </TableCell>

                      {/* CREATED */}
                      <TableCell className="px-3 py-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {new Date(row.created_at).toLocaleString()}
                        </p>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className={cn(
                              "inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-theme-xs",
                              row.isDeleted
                                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]",
                            )}
                            onClick={() => {
                              if (row.isDeleted) return;
                              openEdit(row);
                            }}
                            aria-label="Edit"
                            title={
                              row.isDeleted
                                ? "Cannot edit deleted user"
                                : "Edit"
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          {row.isDeleted ? (
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-xl border border-success-200 bg-success-50 text-success-700 shadow-theme-xs hover:bg-success-100 dark:border-success-900/40 dark:bg-success-500/10 dark:text-success-300 dark:hover:bg-success-500/20"
                              onClick={() => openRestore(row)}
                              aria-label="Restore user"
                              title="Restore user"
                            >
                              <UserCheck size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-xl border border-warning-200 bg-warning-50 text-warning-700 shadow-theme-xs hover:bg-warning-100 dark:border-warning-900/40 dark:bg-warning-500/10 dark:text-warning-300 dark:hover:bg-warning-500/20"
                              onClick={() => openDelete(row)}
                              aria-label="Deactivate user"
                              title="Deactivate user"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {!usersQuery.isLoading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <Pagination
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Deactivate User"
        message={
          deleteTarget
            ? `Are you sure you want to deactivate "${deleteTarget.name}"?`
            : "Are you sure you want to deactivate this user?"
        }
        confirmText={
          deleteMutation.isPending ? "Deactivating..." : "Deactivate"
        }
        cancelText="Cancel"
        tone="danger"
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
      />

      {/* Restore Confirm */}
      <ConfirmDialog
        open={restoreOpen}
        title="Restore User"
        message={
          restoreTarget
            ? `Do you want to restore "${restoreTarget.name}"?`
            : "Do you want to restore this user?"
        }
        confirmText={restoreMutation.isPending ? "Restoring..." : "Restore"}
        cancelText="Cancel"
        tone="success"
        onClose={() => {
          if (restoreMutation.isPending) return;
          setRestoreOpen(false);
          setRestoreTarget(null);
        }}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate(restoreTarget.id);
        }}
      />

      {/* Edit Modal */}
      <EditCustomerModal
        open={editOpen}
        userId={editId}
        onClose={() => {
          setEditOpen(false);
          setEditId(null);
        }}
        onUpdated={invalidate}
      />
    </div>
  );
}
