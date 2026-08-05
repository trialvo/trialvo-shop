import React from "react";

import Button from "@/components/ui/button/Button";
import Modal from "./Modal";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "default" | "success";
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "default",
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      description={tone === "danger" ? "This action cannot be undone." : undefined}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={
              tone === "danger"
                ? "bg-error-500 hover:bg-error-600"
                : tone === "success"
                  ? "bg-success-500 hover:bg-success-600"
                  : undefined
            }
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
