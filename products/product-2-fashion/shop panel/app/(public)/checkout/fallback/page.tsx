import PaymentFallbackClient from "./PaymentFallbackClient";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PaymentFallbackPage({ searchParams }: Props) {
  const statusRaw = (await searchParams)?.status;
  const id = (await searchParams)?.orderId;

  const orderIdRaw = id ?? id;

  const status = Array.isArray(statusRaw) ? statusRaw[0] : statusRaw;
  const orderId = Array.isArray(orderIdRaw) ? orderIdRaw[0] : orderIdRaw;

  return <PaymentFallbackClient status={status ?? ""} orderId={orderId ?? ""} />;
}
