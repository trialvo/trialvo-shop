import * as React from "react";
import { Pencil, Pin, PinOff } from "lucide-react";
import toast from "react-hot-toast";

import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "@/components/form/input/InputField";
import { cn } from "@/lib/utils";
import type { ApiQuickAccessItem, UpdateQuickAccessPayload } from "@/api/quick-access.api";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;

  items: ApiQuickAccessItem[];

  onTogglePin: (item: ApiQuickAccessItem) => void;
  onUpdateItem: (item: ApiQuickAccessItem, payload: UpdateQuickAccessPayload) => void;

  updatingId?: number | null;
}

const MAX_PIN = 6;

type EditFormState = {
  title: string;
  sort_order: string; // keep as string for input, convert on save
  img_path: string;
  path: string;
};

function toEditState(item: ApiQuickAccessItem): EditFormState {
  return {
    title: item.title ?? "",
    sort_order: typeof item.sort_order === "number" ? String(item.sort_order) : "",
    img_path: item.img_path ?? "",
    path: item.path ?? "",
  };
}

function toNumberOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

const QuickAccessManageModal: React.FC<Props> = ({
  open,
  onClose,
  items,
  onTogglePin,
  onUpdateItem,
  updatingId,
}) => {
  const { t } = useTranslation();
  const pinnedCount = items.filter((i) => i.is_pinned).length;

  const sorted = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const ao = a.sort_order ?? 9999;
      const bo = b.sort_order ?? 9999;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });
  }, [items]);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiQuickAccessItem | null>(null);
  const [form, setForm] = React.useState<EditFormState>({
    title: "",
    sort_order: "",
    img_path: "",
    path: "",
  });

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  const openEdit = (item: ApiQuickAccessItem) => {
    setEditing(item);
    setForm(toEditState(item));
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editing) return;

    const nextSort = toNumberOrNull(form.sort_order);
    if (form.sort_order.trim() && nextSort === null) {
      toast.error(t("dashboard.manageQuickAccess.sortOrderInvalid"));
      return;
    }

    const payload: UpdateQuickAccessPayload = {
      title: form.title.trim(),
      sort_order: nextSort,
      img_path: form.img_path.trim() ? form.img_path.trim() : null,
      path: form.path.trim() ? form.path.trim() : null,
    };

    // NOTE: pin/unpin is handled separately; here we update only the "rest of things"
    onUpdateItem(editing, payload);
    closeEdit();
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        className={cn("w-full max-w-[760px] max-h-[720px] overflow-hidden")}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("dashboard.manageQuickAccess.title")}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("dashboard.manageQuickAccess.subtitle", { count: MAX_PIN })}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(720px-84px)] overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {sorted.map((item) => {
              const disablePin = !item.is_pinned && pinnedCount >= MAX_PIN;
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn("flex items-center justify-between gap-3 rounded-xl border p-3", "dark:border-gray-800")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-gray-50",
                        "dark:border-gray-800 dark:bg-gray-800"
                      )}
                    >
                      {item.img_path ? (
                        <img
                          src={toPublicUrl(item.img_path)}
                          alt={item.title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                          {item.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>

                        {item.is_pinned ? (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                            {t("dashboard.manageQuickAccess.pinned")}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <span>
                          {t("dashboard.manageQuickAccess.idLabel")}: {item.id}
                        </span>
                        {typeof item.sort_order === "number" ? (
                          <span>
                            {t("dashboard.manageQuickAccess.orderLabel")}: {item.sort_order}
                          </span>
                        ) : null}
                        {item.path ? (
                          <span className="truncate">
                            {t("dashboard.manageQuickAccess.pathLabel")}: {item.path}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => openEdit(item)}
                      className="px-2"
                      title={t("dashboard.manageQuickAccess.edit")}
                    >
                      <Pencil size={16} />
                    </Button>

                    {/* Pin / Unpin */}
                    <Button
                      size="sm"
                      variant={item.is_pinned ? "outline" : "primary"}
                      disabled={disablePin || isUpdating}
                      onClick={() => {
                        if (disablePin) {
                          toast.error(t("dashboard.manageQuickAccess.maxPinnedNotice", { count: MAX_PIN }));
                          return;
                        }
                        onTogglePin(item);
                      }}
                      className={cn(
                        "px-2",
                        item.is_pinned ? "text-red-600 ring-red-300 hover:bg-red-50 dark:text-red-400" : ""
                      )}
                      isLoading={isUpdating}
                      title={item.is_pinned ? t("dashboard.manageQuickAccess.unpin") : t("dashboard.manageQuickAccess.pin")}
                    >
                      {item.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </Button>
                  </div>
                </div>
              );
            })}

            {items.length === 0 ? (
              <div className="rounded-xl border p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {t("dashboard.manageQuickAccess.noItems")}
              </div>
            ) : null}

            {pinnedCount >= MAX_PIN ? (
              <p className="pt-1 text-xs text-red-500">
                {t("dashboard.manageQuickAccess.maxPinnedNotice", { count: MAX_PIN })}
              </p>
            ) : null}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editOpen}
        onClose={closeEdit}
        className={cn("w-full max-w-[640px] overflow-hidden")}
      >
        <div className="border-b px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("dashboard.manageQuickAccess.updateTitle")}
          </h3>
          {editing ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("dashboard.manageQuickAccess.idLabel")}: {editing.id}
            </p>
          ) : null}
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.manageQuickAccess.titleLabel")}
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={t("dashboard.manageQuickAccess.titlePlaceholder")}
              />
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.manageQuickAccess.sortOrderLabel")}
              </label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                placeholder={t("dashboard.manageQuickAccess.sortOrderPlaceholder")}
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {t("dashboard.manageQuickAccess.sortOrderHint")}
              </p>
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.manageQuickAccess.pathInputLabel")}
              </label>
              <Input
                value={form.path}
                onChange={(e) => setForm((p) => ({ ...p, path: e.target.value }))}
                placeholder={t("dashboard.manageQuickAccess.pathPlaceholder")}
              />
            </div>

            <div className="col-span-12">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.manageQuickAccess.imagePathLabel")}
              </label>
              <Input
                value={form.img_path}
                onChange={(e) => setForm((p) => ({ ...p, img_path: e.target.value }))}
                placeholder={t("dashboard.manageQuickAccess.imagePathPlaceholder")}
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {t("dashboard.manageQuickAccess.imagePathHint", { example: "/images/xxx.png" })}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeEdit}>
              {t("dashboard.manageQuickAccess.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("dashboard.manageQuickAccess.update")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QuickAccessManageModal;
