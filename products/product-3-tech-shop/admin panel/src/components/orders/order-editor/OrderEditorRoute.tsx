import type React from "react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import OrdersSelectionPage from "@/components/orders/order-editor/OrdersSelectionPage";
import OrderEditorPage from "@/components/orders/order-editor/OrderEditorPage";
import type { OrdersListParams } from "@/api/orders.api";

type Props = {
  orderId: number | null;
};

function parseNum(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function readParams(sp: URLSearchParams): OrdersListParams {
  return {
    order_type: sp.get("order_type") || undefined,
    customer_phone: sp.get("customer_phone") || undefined,
    customer_email: sp.get("customer_email") || undefined,

    order_status: sp.get("order_status") || undefined,
    payment_status: sp.get("payment_status") || undefined,

    payment_provider: sp.get("payment_provider") || undefined,
    payment_type: sp.get("payment_type") || undefined,

    is_fraud: sp.get("is_fraud") || undefined,
    min_total: sp.get("min_total") ? parseNum(sp.get("min_total"), 0) : undefined,
    max_total: sp.get("max_total") ? parseNum(sp.get("max_total"), 0) : undefined,

    date_from: sp.get("date_from") || undefined,
    date_to: sp.get("date_to") || undefined,

    limit: sp.get("limit") ? parseNum(sp.get("limit"), 10) : 10,
    offset: sp.get("offset") ? parseNum(sp.get("offset"), 0) : 0,
  };
}

function writeParams(sp: URLSearchParams, params: OrdersListParams) {
  const setOrDel = (k: string, v: any) => {
    if (v === undefined || v === null || v === "") sp.delete(k);
    else sp.set(k, String(v));
  };

  setOrDel("order_type", params.order_type);
  setOrDel("customer_phone", params.customer_phone);
  setOrDel("customer_email", params.customer_email);

  setOrDel("order_status", params.order_status);
  setOrDel("payment_status", params.payment_status);

  setOrDel("payment_provider", params.payment_provider);
  setOrDel("payment_type", params.payment_type);

  setOrDel("is_fraud", params.is_fraud);
  setOrDel("min_total", params.min_total);
  setOrDel("max_total", params.max_total);

  setOrDel("date_from", params.date_from);
  setOrDel("date_to", params.date_to);

  setOrDel("limit", params.limit ?? 10);
  setOrDel("offset", params.offset ?? 0);
}

const OrderEditorRoute: React.FC<Props> = ({ orderId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const params = useMemo(() => readParams(searchParams), [searchParams]);

  const updateUrlParams = (next: OrdersListParams) => {
    const sp = new URLSearchParams(searchParams.toString());
    writeParams(sp, next);
    navigate({ pathname: "/order-editor", search: sp.toString() }, { replace: true });
  };

  const handleSelectOrder = (id: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("orderId", String(id));
    navigate({ pathname: "/order-editor", search: sp.toString() });
  };

  const handleBack = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("orderId");
    navigate({ pathname: "/order-editor", search: sp.toString() });
  };

  if (!orderId) {
    return (
      <OrdersSelectionPage
        params={params}
        onChangeParams={(patch) => updateUrlParams({ ...params, ...patch })}
        onApply={() => void 0}
        onReset={() =>
          updateUrlParams({
            limit: 10,
            offset: 0,
          })
        }
        onSelectOrder={handleSelectOrder}
      />
    );
  }

  return <OrderEditorPage orderId={orderId} onBack={handleBack} />;
};

export default OrderEditorRoute;
