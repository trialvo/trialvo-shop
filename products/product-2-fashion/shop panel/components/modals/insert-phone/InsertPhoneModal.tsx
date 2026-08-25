"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = {
    open: boolean;
    isTop: boolean;
    zIndex: number;

    title?: string;
    description?: string;
    cancelText?: string;
    confirmText?: string;

    defaultPhone?: string;

    onOpenChange: (open: boolean) => void;
    onConfirm: (phone: string) => void | Promise<void>;
};

const BD_PHONE_REGEX = /^01\d{9}$/;

const InsertPhoneModal: React.FC<Props> = ({
    open,
    isTop,
    zIndex,
    title = "",
    description = "",
    cancelText = "",
    confirmText = "",
    defaultPhone,
    onOpenChange,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const resolvedTitle = title || t("account.personalProfile.addMobileTitle");
    const resolvedDescription = description || t("account.personalProfile.useBDNumber");
    const resolvedCancelText = cancelText || t("account.personalProfile.cancel");
    const resolvedConfirmText = confirmText || t("account.personalProfile.save");
    const [phone, setPhone] = React.useState<string>(defaultPhone ?? "");
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState<boolean>(false);

    React.useEffect(() => {
        setPhone(defaultPhone ?? "");
        setError(null);
        setSubmitting(false);
    }, [defaultPhone, open]);

    const validate = (v: string): string | null => {
        const trimmed = v.trim();
        if (!trimmed) return t("insertPhone.phoneRequired");
        if (!BD_PHONE_REGEX.test(trimmed)) return t("insertPhone.phoneInvalid");
        return null;
    };

    const handleSubmit = async () => {
        const err = validate(phone);
        setError(err);
        if (err) return;

        setSubmitting(true);
        try {
            await onConfirm(phone.trim());
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onOpenChange={onOpenChange}
            isTop={isTop}
            zIndex={zIndex}
            contentClassName="max-w-md"
        >
            <div className="border-b border-[#EDEDED] px-5 py-4">
                <h2 className="text-base font-semibold text-black">{resolvedTitle}</h2>
                {resolvedDescription ? <p className="mt-1 text-sm text-muted-foreground">{resolvedDescription}</p> : null}
            </div>

            <div className="px-5 py-4 space-y-2">
                <label className="text-sm font-medium text-black">{t("insertPhone.mobileNumber")}</label>

                <Input
                    value={phone}
                    onChange={(e) => {
                        setPhone(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                />

                {error ? <p className="text-xs text-[#E52D2D]">{error}</p> : null}
            </div>

            <div className={cn("flex items-center justify-end gap-3 border-t border-[#EDEDED] px-5 py-4")}>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-none border-[#999999]"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                >
                    {resolvedCancelText}
                </Button>

                <Button
                    type="button"
                    className="h-10 rounded-none bg-black text-white hover:bg-black/90"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? t("insertPhone.saving") : resolvedConfirmText}
                </Button>
            </div>
        </ModalShell>
    );
};

export default InsertPhoneModal;
