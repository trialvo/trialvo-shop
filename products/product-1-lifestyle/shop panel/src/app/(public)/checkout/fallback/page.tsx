import { Suspense } from "react";
import PaymentFallbackClient from "../PaymentFallbackClient";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentFallbackPage({ searchParams }: Props) {
  const params = await searchParams;

  const statusRaw = params?.status;
  const orderIdRaw = params?.orderId;

  const status = Array.isArray(statusRaw) ? statusRaw[0] ?? "" : statusRaw ?? "";
  const orderId = Array.isArray(orderIdRaw) ? orderIdRaw[0] ?? "" : orderIdRaw ?? "";

  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <PaymentFallbackClient status={status} orderId={orderId} />
    </Suspense>
  );
}
