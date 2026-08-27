"use client";

import { useSubscribe } from "@/hooks/useSubscribe";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch } from "@/redux/hooks";
import { setError as setUiError, setSuccess } from "@/redux/slices/uiSlice";
import React from "react";
import { useForm } from "react-hook-form";
import { FiArrowRight } from "react-icons/fi";

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
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                {t("footer.subscribe.title")}
            </h4>

            <p className="mb-5 text-sm leading-relaxed text-white/55">
                {t("footer.subscribe.body")}
            </p>

            <form
                onSubmit={handleSubmit(handleValidSubmit, (formErrors) => {
                    const message = formErrors.email?.message;
                    if (message) dispatch(setUiError(message));
                })}
                className="flex border border-white/15 bg-white/5"
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
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35"
                    aria-invalid={Boolean(errors.email)}
                    disabled={isSubscribing}
                />
                <button
                    type="submit"
                    className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubscribing}
                    aria-label={t("footer.subscribe.title")}
                >
                    <FiArrowRight className="h-4 w-4" />
                </button>
            </form>
        </div>
    );
};

export default FooterSubscribe;
