"use client";

import VerificationIdentityCard from "@/components/auth/VerificationIdentityCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
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
    description,
    contentClassName,
}) => {
    const [phoneNumber] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("phone_number") ?? "";
    });

    // Auto-close when the user navigates away
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
            contentClassName={cn("max-w-[620px]", contentClassName)}
        >
            <Button
                type="button"
                onClick={handleClose}
                className="absolute -right-5 -top-5 hidden h-10 w-10 rounded-none bg-black p-0 text-white sm:inline-flex"
                aria-label="Close"
            >
                <FiX className="h-5 w-5" />
            </Button>

            <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-none bg-black p-0 text-white sm:hidden"
            >
                <FiX className="h-5 w-5" />
            </button>

            <div className="max-h-[70vh] overflow-auto">
                <VerificationIdentityCard
                    maskedTarget={maskedTarget || phoneNumber}
                    length={length}
                    onResend={onResend}
                    onVerify={onVerify}
                    signInHref={signInHref}
                    cardClass="px-5 py-6"
                />
            </div>
        </ModalShell>
    );
};

export default VerifyIdentityModal;
