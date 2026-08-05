"use client";

import { consumeConfirmDeleteCallback, removeConfirmDeleteCallback } from "@/lib/modal/confirm-delete";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import React from "react";
import type { ModalEntryProps } from "../ModalRegistry";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export type ConfirmDeletePayload = {
    callbackId: string;
    title?: string;
    description?: string;
    cancelText?: string;
    confirmText?: string;
};

const ConfirmDeleteModalEntry: React.FC<ModalEntryProps> = ({
    modalId,
    isTop,
    zIndex,
    payload,
}) => {
    const dispatch = useAppDispatch();
    const data = (payload ?? {}) as ConfirmDeletePayload;

    const [loading, setLoading] = React.useState<boolean>(false);

    const handleClose = () => {
        if (data.callbackId) removeConfirmDeleteCallback(data.callbackId);
        dispatch(closeModalById(modalId));
    };

    return (
        <ConfirmDeleteModal
            open
            isTop={isTop}
            zIndex={zIndex}
            title={data.title}
            description={data.description}
            cancelText={data.cancelText}
            confirmText={data.confirmText}
            onOpenChange={(v) => {
                if (!v) handleClose();
            }}
            onConfirm={async () => {
                if (!data.callbackId || loading) return;

                const cb = consumeConfirmDeleteCallback(data.callbackId);
                if (!cb) {
                    dispatch(closeModalById(modalId));
                    return;
                }

                try {
                    setLoading(true);
                    await cb();
                    dispatch(closeModalById(modalId));
                } finally {
                    setLoading(false);
                }
            }}
        />
    );
};

export default ConfirmDeleteModalEntry;
