// src/components/contact-messages/ReplyModal.tsx
"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import { cn } from "@/lib/utils";

export type ReplyType = "email" | "sms";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (args: { replyText: string; type: ReplyType }) => void;
  isSubmitting?: boolean;
  defaultType?: ReplyType;
  toLabel?: string;
};

export default function ReplyModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  defaultType = "sms",
  toLabel,
}: Props) {
  const { t } = useTranslation();
  const [type, setType] = React.useState<ReplyType>(defaultType);
  const [text, setText] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setText("");
  }, [open, defaultType]);

  const canSubmit = text.trim().length > 0 && !isSubmitting;

  const typeOptions = React.useMemo(
    () => [
      { value: "email", label: t("contactMessages.reply.typeEmail") },
      { value: "sms", label: t("contactMessages.reply.typeSms") },
    ],
    [t]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("contactMessages.reply.title")}
      description={
        toLabel
          ? t("contactMessages.reply.toLabel", { to: toLabel })
          : t("contactMessages.reply.toThis")
      }
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("contactMessages.reply.cancel")}
          </Button>
          <Button onClick={() => onSubmit({ replyText: text, type })} disabled={!canSubmit}>
            {isSubmitting ? t("contactMessages.reply.sending") : t("contactMessages.reply.send")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              {t("contactMessages.reply.typeLabel")}
            </p>
            <Select
              options={typeOptions}
              value={type}
              onChange={(v) => setType(v as ReplyType)}
              placeholder={t("contactMessages.reply.typePlaceholder")}
            />
          </div>

          <div className={cn("hidden sm:block")}>{/* spare column for balance */}</div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("contactMessages.reply.messageLabel")}
          </p>
          <TextArea
            rows={6}
            value={text}
            onChange={setText}
            placeholder={t("contactMessages.reply.messagePlaceholder")}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("contactMessages.reply.tip")}
          </p>
        </div>
      </div>
    </Modal>
  );
}
