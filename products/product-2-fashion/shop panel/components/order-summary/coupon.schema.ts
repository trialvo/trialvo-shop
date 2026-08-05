import { z } from "zod";

export const couponSchema = z.object({
  coupon: z
    .string()
    .min(3, "Coupon must be at least 3 characters")
    .max(20, "Invalid coupon")
    // .regex(/^[A-Z0-9-_]+$/, "Invalid coupon format"),
});

export type CouponFormValues = z.infer<typeof couponSchema>;
