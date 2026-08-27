"use client";

import VerificationIdentityCard from "@/components/auth/VerificationIdentityCard";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FiShield } from "react-icons/fi";
import ModalShell from "../ModalShell";

type Props = {
    open: boolean;
    isTop: boolean;
    zIndex: number;
    onOpenChange: (open: boolean) => void;
    onClose?: () => void;

    maskedTarget?: string;
    length?: number;
    signInHref?: string;

    onResend?: () => Promise<void> | void;
    onVerify?: (code: string) => Promise<void> | void;

    title?: string;
    description?: string;
    contentClassName?: string;
};

const VerifyIdentityModal: React.FC<Props> = ({
    open,
    isTop,
    zIndex,
    onOpenChange,
    onClose,
    maskedTarget,
    length,
    signInHref,
    onResend,
    onVerify,
    title,
    contentClassName,
}) => {
    const { t } = useTranslation();
    const [phoneNumber] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("phone_number") ?? "";
    });

    const pathname = usePathname();
    const initialPathRef = React.useRef(pathname);
    useEffect(() => {
        if (pathname !== initialPathRef.current) {
            onClose?.();
            onOpenChange(false);
        }
    }, [pathname, onClose, onOpenChange]);

    const handleClose = () => {
        onClose?.();
        onOpenChange(false);
    };

    return (
        <ModalShell
            open={open}
            onOpenChange={(v) => { if (!v) handleClose(); }}
            isTop={isTop}
            zIndex={zIndex}
            closeOnOutsideClick={false}
            title={title ?? t("auth.verifyIdentityTitle")}
            icon={<FiShield className="h-4 w-4" strokeWidth={1.75} />}
            contentClassName={cn("max-w-[520px]", contentClassName)}
        >
            <VerificationIdentityCard
                maskedTarget={maskedTarget || phoneNumber}
                length={length}
                onResend={onResend}
                onVerify={onVerify}
                signInHref={signInHref}
                hideTitle
                cardClass="px-5 py-5"
            />
        </ModalShell>
    );
};

export default VerifyIdentityModal;
