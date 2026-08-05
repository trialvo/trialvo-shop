"use client";

import type { ModalEntryProps } from "@/components/modals/ModalRegistry";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import * as React from "react";
import CustomerInfoModal from "./CustomerInfoModal";

export type InsertPhonePayload = {
    title?: string;
    description?: string;
    cancelText?: string;
    confirmText?: string;
    defaultPhone?: string;
};

const CustomerModalEntry: React.FC<ModalEntryProps> = ({ modalId, isTop, zIndex, payload }) => {
    const dispatch = useAppDispatch();

    return (
        <CustomerInfoModal
            open
            isTop={isTop}
            zIndex={zIndex}
            onOpenChange={(v) => {
                if (!v) dispatch(closeModalById(modalId));
            }}
        />
    );
};

export default CustomerModalEntry;
