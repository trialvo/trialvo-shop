import OrderFailedClient from "@/components/order-failed/OrderFailedClient";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <OrderFailedClient />
    </Suspense>
  );
}
