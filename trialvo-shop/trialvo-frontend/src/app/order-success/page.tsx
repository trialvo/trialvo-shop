import { Suspense } from "react";
import OrderSuccessPage from "@/views/OrderSuccessPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessPage />
    </Suspense>
  );
}
