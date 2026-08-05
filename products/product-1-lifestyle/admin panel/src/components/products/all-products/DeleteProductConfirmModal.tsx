// src/components/products/all-products/modals/DeleteProductConfirmModal.tsx
"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import BaseModal from "./BaseModal";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  productName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteProductConfirmModal({
  open,
  productName,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <BaseModal
      open={open}
      title={t("products.confirmDelete.title")}
      description={t("products.confirmDelete.description", { name: productName ?? "this product" })}
      widthClassName="w-[520px]"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-error-600 hover:bg-error-700"
          >
            {loading ? t("products.confirmDelete.deleting") : t("common.delete")}
          </Button>
        </div>
      }
    >
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
        {t("products.confirmDelete.description", { name: productName ?? "this product" })}
      </div>
    </BaseModal>
  );
}
