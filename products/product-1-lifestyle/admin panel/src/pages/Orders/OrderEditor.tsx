// src/pages/OrderEditor.tsx

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";
import OrderEditorRoute from "@/components/orders/order-editor/OrderEditorRoute";

export default function OrderEditor() {
  const [params] = useSearchParams();
  const orderIdRaw = params.get("orderId") ?? "";

  const orderId = useMemo(() => {
    const n = Number(orderIdRaw);
    return Number.isFinite(n) ? n : null;
  }, [orderIdRaw]);

  return (
    <>
      <PageMeta title="Order Editor" description="Order Management - Editor" />
      <OrderEditorRoute orderId={orderId} />
    </>
  );
}
