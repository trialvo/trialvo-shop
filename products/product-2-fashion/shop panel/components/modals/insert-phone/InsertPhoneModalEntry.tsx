"use client";

import type { ModalEntryProps } from "@/components/modals/ModalRegistry";
import { useAuth } from "@/hooks/useAuth";
import { phoneKeys, usePhone } from "@/hooks/usePhone";
import { phoneService } from "@/lib/api/phone/service";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import InsertPhoneModal from "./InsertPhoneModal";

export type InsertPhonePayload = {
    title?: string;
    description?: string;
    cancelText?: string;
    confirmText?: string;
    defaultPhone?: string;
};

const InsertPhoneModalEntry: React.FC<ModalEntryProps> = ({ modalId, isTop, zIndex, payload }) => {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { updateProfile } = useAuth();
    const { phones, verifyPhone, verifyPhoneOTP } = usePhone();
    const data = (payload ?? {}) as InsertPhonePayload;

    const findPhoneId = (list: typeof phones, phone: string) =>
        list?.find((p) => p?.phone_number === phone)?.id ??
        list?.find((p) => p?.id != null)?.id;

    return (
        <InsertPhoneModal
            open
            isTop={isTop}
            zIndex={zIndex}
            title={data.title}
            description={data.description}
            cancelText={data.cancelText}
            confirmText={data.confirmText}
            defaultPhone={data.defaultPhone}
            onOpenChange={(v) => {
                if (!v) dispatch(closeModalById(modalId));
            }}
            onConfirm={async (phone) => {
                const res = await updateProfile({
                    phone
                });

                if (!res?.success) return;

                if (typeof window !== "undefined") {
                    localStorage.setItem("phone_number", phone);
                }

                let phoneId = findPhoneId(phones, phone);

                if (!phoneId) {
                    const listRes = await phoneService.getPhones();
                    const list = Array.isArray(listRes?.phones) ? listRes.phones : [];
                    queryClient.setQueryData(phoneKeys.list(), list);

                    phoneId = findPhoneId(list, phone);
                }

                if (!phoneId) {
                    dispatch(closeModalById(modalId));
                    return;
                }

                await verifyPhone(phoneId);

                openVerifyIdentity(
                    dispatch,
                    {
                        onVerify: async (code) => {
                            await verifyPhoneOTP(phoneId, code);
                        },
                        onResend: async () => {
                            await verifyPhone(phoneId);
                        }
                    },
                    {
                        maskedTarget: phone,
                        title: "Verify Mobile Number",
                        description: "Enter the OTP sent to your phone."
                    },
                );

                dispatch(closeModalById(modalId));
            }}
        />
    );
};

export default InsertPhoneModalEntry;
