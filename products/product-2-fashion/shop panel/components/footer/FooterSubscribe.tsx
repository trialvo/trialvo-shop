"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { useSubscribe } from "@/hooks/useSubscribe";
import { useAppDispatch } from "@/redux/hooks";
import { setError as setUiError, setSuccess } from "@/redux/slices/uiSlice";
import React from "react";
import { useForm } from "react-hook-form";
import { FaArrowRight } from "react-icons/fa6";

const FooterSubscribe: React.FC = () => {
    const { t } = useTranslation();
    const { subscribe, isSubscribing } = useSubscribe();
    const dispatch = useAppDispatch();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ email: string }>({
        defaultValues: { email: "" },
        mode: "onSubmit",
    });

    const handleValidSubmit = async (values: { email: string }) => {
        const res = await subscribe({ email: values.email.trim() });
        if (res?.error) {
            dispatch(setUiError(res.error));
            return;
        }
        dispatch(setSuccess(res?.message || t("footer.subscribe.successMessage")));
        reset();
    };

    return (
        <div>
            <h4 className="text-base mb-7 font-semibold uppercase tracking-wide">
                {t("footer.subscribe.title")}
            </h4>

            <p className="text-sm text-white font-normal leading-relaxed mb-6">
                {t("footer.subscribe.body")}
            </p>

            <form
                onSubmit={handleSubmit(handleValidSubmit, (formErrors) => {
                    const message = formErrors.email?.message;
                    if (message) dispatch(setUiError(message));
                })}
                className="flex bg-[#424141] mb-2"
            >
                <input
                    type="email"
                    placeholder={t("footer.subscribe.emailPlaceholder")}
                    {...register("email", {
                        required: t("footer.subscribe.emailRequired"),
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: t("footer.subscribe.emailInvalid"),
                        },
                    })}
                    className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-white placeholder:text-white transition-shadow duration-200 focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
                    aria-invalid={Boolean(errors.email)}
                    disabled={isSubscribing}
                />
                <button
                    type="submit"
                    className="px-4 text-white text-xl cursor-pointer transition-colors duration-200 hover:text-[#EDEDED]"
                    disabled={isSubscribing}
                    aria-label={t("footer.subscribe.title")}
                >
                    <FaArrowRight />
                </button>
            </form>
        </div>
    );
};

export default FooterSubscribe;
