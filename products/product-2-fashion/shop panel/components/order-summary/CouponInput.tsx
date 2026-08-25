"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { CouponFormValues, couponSchema } from "./coupon.schema";

type Props = {
  onApply?: (coupon: string) => void;
  disabled: boolean;
  apiError?: string | null;
};

const CouponInput: React.FC<Props> = ({ onApply, disabled, apiError }) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      coupon: "",
    },
  });

  const onSubmit = (data: CouponFormValues) => {
    onApply?.(data.coupon);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-[#F3FAFF] p-4 px-2 space-y-2"
    >
      <div className="flex gap-2">
        <Input
          placeholder={t("orderSummary.couponPlaceholder")}
          {...register("coupon")}
          aria-invalid={!!errors.coupon}
        />

        <Button
          type="submit"
          className="h-11 rounded-[4px] bg-black text-white transition-colors hover:bg-black/75 disabled:cursor-not-allowed"
          disabled={isSubmitting || disabled}
        >
          {t("orderSummary.apply")}
        </Button>
      </div>

      {errors.coupon && (
        <p className="text-sm text-red-500">
          {errors.coupon.message}
        </p>
      )}

      {!errors.coupon && apiError && (
        <p className="text-sm text-red-500">
          {apiError}
        </p>
      )}
    </form>
  );
};

export default CouponInput;
