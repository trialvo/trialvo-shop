import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Pagination } from "@/components/ui";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

import EditAdminModal from "./EditAdminModal";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { AdminRole, AdminListRow, ROLE_ID_BY_LABEL } from "../types";
import { toPublicUrl } from "@/config/env";
import {
  useAdminById,
  useAdmins,
  useSoftDeleteAdmin,
  useUpdateAdmin,
  useUploadAdminProfile,
} from "@/hooks/useAdmins";
import type { AdminByIdResponse, AdminListResponse } from "@/api/admin.api";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "A";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

const ROLE_LABELS: Record<string, AdminRole> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ORDER_MANAGER: "Order Manager",
  CATALOG_MANAGER: "Catalog Manager",
  READ_ONLY_ADMIN: "Read Only Admin",
};

const normalizeRoleLabel = (role?: string | null): AdminRole => {
  if (!role) return "Admin";
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const label = role
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return (label as AdminRole) ?? "Admin";
};

const toJoinDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

type ApiMaybeError = {
  flag?: number;
  error?: string;
  message?: string;
  success?: boolean;
};

const assertApiSuccess = (res: unknown, fallback: string) => {
  if (!res) {
    throw new Error(fallback);
  }
  if (typeof res !== "object") return;

  const maybe = res as ApiMaybeError;
  if (maybe.flag && maybe.error) {
    throw new Error(maybe.error);
  }
  if (maybe.success === false) {
    throw new Error(maybe.message || fallback);
  }
};

export default function AdminsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminListRow[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminListRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminListRow | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const params = useMemo(
    () => ({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, pageSize]
  );

  const { data, isLoading, isError, refetch } = useAdmins(params);
  const { data: editAdmin, isError: isEditError } = useAdminById(editId);

  const updateMutation = useUpdateAdmin();
  const uploadProfileMutation = useUploadAdminProfile();
  const softDeleteMutation = useSoftDeleteAdmin();

  const toListRow = (
    admin: AdminListResponse["data"][number] | AdminByIdResponse
  ): AdminListRow => {
    const name =
      [admin.first_name, admin.last_name].filter(Boolean).join(" ") ||
      admin.email.split("@")[0] ||
      "Admin";

    return {
      id: admin.id,
      name,
      email: admin.email,
      role: normalizeRoleLabel(admin.roles?.[0]),
      joinDate: toJoinDate(admin.created_at),
      phone: admin.phone ?? "",
      status: admin.is_active ? "ACTIVE" : "INACTIVE",
      address: admin.address ?? "",
      avatarUrl: toPublicUrl(admin.profile_img_path) ?? undefined,
      passwordMasked: "************",
    };
  };

  useEffect(() => {
    if (!data?.data) return;
    setRows(data.data.map((admin) => toListRow(admin)));
  }, [data]);

  useEffect(() => {
    if (!editAdmin) return;
    setEditTarget(toListRow(editAdmin));
  }, [editAdmin]);

  useEffect(() => {
    if (!isEditError || !editId) return;
    toast.error("Failed to load admin details");
  }, [isEditError, editId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const paged = filtered;

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const openDelete = (row: AdminListRow) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await softDeleteMutation.mutateAsync({ id: deleteTarget.id });

      // Mark row as deleted (soft-delete — admin is deactivated, not removed)
      setRows((prev) =>
        prev.map((r) =>
          r.id === deleteTarget.id
            ? { ...r, status: "INACTIVE" as const, _softDeleted: true }
            : r
        )
      );

      toast.success("Admin soft-deleted and deactivated.");
      setDeleteOpen(false);
      setDeleteTarget(null);

      await refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to soft-delete admin";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (row: AdminListRow) => {
    setEditTarget(null);
    setEditId(row.id);
    setEditOpen(true);
  };

  const handleUpdateDetails = async (next: AdminListRow) => {
    try {
      const nameParts = next.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ") || null;

      const res = await updateMutation.mutateAsync({
        id: next.id,
        body: {
          email: next.email.trim(),
          first_name: firstName || null,
          last_name: lastName,
          phone: next.phone.trim() || null,
          address: next.address.trim() || null,
        },
      });
      assertApiSuccess(res, "Update failed");

      setRows((prev) =>
        prev.map((r) =>
          r.id === next.id
            ? {
              ...r,
              name: next.name.trim(),
              email: next.email.trim(),
              phone: next.phone.trim(),
              address: next.address.trim(),
              role: next.role,
            }
            : r
        )
      );

      toast.success("Admin details updated");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update admin";
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateStatus = async (
    id: number,
    isActive: boolean,
    roleId?: number,
    roleLabel?: AdminRole
  ) => {
    try {
      const resolvedRoleId =
        roleId ?? (roleLabel ? ROLE_ID_BY_LABEL[roleLabel] : undefined);
      if (!resolvedRoleId) {
        throw new Error("Role is required");
      }

      const res = await updateMutation.mutateAsync({
        id,
        body: {
          is_active: isActive,
          role_id: resolvedRoleId,
        },
      });
      assertApiSuccess(res, "Update failed");

      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: isActive ? "ACTIVE" : "INACTIVE" } : r
        )
      );

      toast.success("Admin status updated");

      // keep server list synced
      await refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update status";
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdatePassword = async (id: number, password: string) => {
    try {
      const res = await updateMutation.mutateAsync({
        id,
        body: { password },
      });
      assertApiSuccess(res, "Update failed");

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, passwordMasked: "************" } : r))
      );

      toast.success("Password updated");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update password";
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateAvatar = async (id: number, file: File) => {
    try {
      const res = await uploadProfileMutation.mutateAsync({ id, file });
      assertApiSuccess(res, "Failed to update profile image");
      const avatarUrl = toPublicUrl(res.profile_img_path) ?? undefined;

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, avatarUrl } : r)));

      toast.success("Profile image updated");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update profile image";
      toast.error(msg);
      throw err;
    }
  };

  const stickyHeaderCell =
    "sticky right-0 z-20 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-800";
  const stickyBodyCell =
    "sticky right-0 z-10 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800";

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button startIcon={<UserPlus size={16} />} onClick={() => navigate("/create-admin")}>
          Create User
        </Button>

        <div className="relative w-full md:max-w-sm">
          <Input
            startIcon={<Search size={16} className="text-gray-400" />}
            className="pl-9"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(String(e.target.value))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table className="min-w-[1200px] border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                {[
                  t("admins.table.snNo"),
                  t("admins.table.user"),
                  t("admins.table.role"),
                  t("admins.table.email"),
                  t("admins.table.pass"),
                  t("admins.table.joinDate"),
                  t("admins.table.phone"),
                  t("admins.table.status"),
                  t("admins.table.address"),
                  t("admins.table.actions"),
                ].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className={cn(
                      "px-4 py-4 text-left text-xs font-semibold text-brand-500",
                      h === "ACTIONS" ? stickyHeaderCell : ""
                    )}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paged.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {(page - 1) * pageSize + idx + 1}
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {row.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatarUrl}
                            alt={row.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(row.name)
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {row.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.role}
                  </TableCell>

                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.email}
                  </TableCell>

                  <TableCell className="px-4 py-4 text-sm font-semibold text-brand-500">
                    {row.passwordMasked}
                  </TableCell>

                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.joinDate}
                  </TableCell>

                  <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.phone || "-"}
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <Badge
                      variant="solid"
                      color={row.status === "ACTIVE" ? "success" : "error"}
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="line-clamp-1">{row.address || "-"}</span>
                  </TableCell>

                  {/* ✅ Sticky Actions */}
                  <TableCell className={cn("px-4 py-4", stickyBodyCell)}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                        onClick={() => openEdit(row)}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-error-200 bg-white text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-900/40 dark:bg-gray-900 dark:text-error-300 dark:hover:bg-error-500/10"
                        onClick={() => openDelete(row)}
                        aria-label="Delete"
                        title="Delete"
                        disabled={deleting}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {paged.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {isError ? "Failed to load admins." : "No admins found."}
                  </TableCell>
                </TableRow>
              ) : null}

              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading admins...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <Pagination
          totalItems={search ? filtered.length : data?.total ?? filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Admin"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?`
            : "Are you sure you want to delete this admin?"
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        tone="danger"
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* Edit Modal */}
      <EditAdminModal
        open={editOpen}
        admin={editTarget}
        loading={Boolean(editId) && !editTarget}
        onClose={() => {
          setEditOpen(false);
          setEditTarget(null);
          setEditId(null);
        }}
        onUpdateDetails={handleUpdateDetails}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePassword={handleUpdatePassword}
        onUpdateAvatar={handleUpdateAvatar}
      />
    </div>
  );
}
