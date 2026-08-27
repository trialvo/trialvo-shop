"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import * as React from "react";
import { FiSmartphone } from "react-icons/fi";

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
            title={resolvedTitle}
            icon={<FiSmartphone className="h-4 w-4" strokeWidth={1.75} />}
            contentClassName="max-w-[440px]"
            bodyClassName="space-y-2 px-5 py-4"
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[4px] border-[#E5E5E5] px-4 text-sm font-medium text-black hover:border-black hover:bg-white"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        {resolvedCancelText}
                    </Button>
                    <Button
                        type="button"
                        className="h-10 rounded-[4px] bg-black px-4 text-sm font-medium text-white hover:bg-black/90"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? t("insertPhone.saving") : resolvedConfirmText}
                    </Button>
                </>
            }
        >
            {resolvedDescription ? (
                <p className="text-sm text-black/55">{resolvedDescription}</p>
            ) : null}

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
        </ModalShell>
    );
};

export default InsertPhoneModal;
