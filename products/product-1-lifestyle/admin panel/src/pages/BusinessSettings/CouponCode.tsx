import CouponCodePage from "@/components/business-settings/coupon-code/CouponCodePage";
import PageMeta from "@/components/common/PageMeta";

export default function CouponCode() {
  return (
    <>
      <PageMeta
        title="Coupon Code"
        description="Create and manage advanced coupon codes"
      />
      <CouponCodePage />
    </>
  );
}
