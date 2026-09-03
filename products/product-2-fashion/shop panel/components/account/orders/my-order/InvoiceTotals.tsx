import React from "react";
import type { OrderInvoiceTotals } from "./types";

const money = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type Props = {
  totals: OrderInvoiceTotals;
  currency: string;
};

const Line = ({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warn";
  strong?: boolean;
}) => (
  <div
    data-invoice-total-row
    className={
      strong
        ? "grid grid-cols-[minmax(0,1fr)_148px] items-center gap-x-4 border-t border-black/10 py-3"
        : "grid grid-cols-[minmax(0,1fr)_148px] items-center gap-x-4 border-b border-black/6 py-2.5 last:border-b-0"
    }
  >
    <div
      className={
        strong
          ? "text-[14px] font-bold text-[#191919]"
          : "text-[13px] text-[#5F5F5F]"
      }
    >
      {label}
    </div>
    <div
      data-invoice-total-value
      className={
        strong
          ? "text-right text-[14px] font-bold tabular-nums text-[#191919]"
          : tone === "positive"
            ? "text-right text-[13px] font-semibold tabular-nums text-[#1B7A3A]"
            : tone === "warn"
              ? "text-right text-[13px] font-semibold tabular-nums text-[#C45F00]"
              : "text-right text-[13px] font-semibold tabular-nums text-[#191919]"
      }
    >
      {value}
    </div>
  </div>
);

export const InvoiceTotals: React.FC<Props> = ({ totals, currency }) => {
  return (
    <div
      data-invoice-totals
      className="w-full overflow-hidden rounded-[4px] border border-black/8 bg-[#FAFAFA] px-3.5"
    >
      <Line label="Subtotal" value={money(currency, totals.subtotal)} />

      {(totals.discount ?? 0) > 0 ? (
        <Line
          label="Item discount"
          value={`−${money(currency, totals.discount)}`}
          tone="positive"
        />
      ) : null}

      {(totals.delivery ?? 0) > 0 ? (
        <Line label="Delivery" value={money(currency, totals.delivery!)} />
      ) : null}

      {(totals.weightExtraCharge ?? 0) > 0 ? (
        <Line
          label={`Weight surcharge${
            (totals.weightKg ?? 0) > 0 ? ` (${totals.weightKg} kg)` : ""
          }`}
          value={`+${money(currency, totals.weightExtraCharge!)}`}
          tone="warn"
        />
      ) : null}

      {(totals.bulkDiscount ?? 0) > 0 ? (
        <Line
          label="Bulk discount"
          value={`−${money(currency, totals.bulkDiscount!)}`}
          tone="positive"
        />
      ) : null}

      {(totals.comboDiscount ?? 0) > 0 ? (
        <Line
          label="Combo discount"
          value={`−${money(currency, totals.comboDiscount!)}`}
          tone="positive"
        />
      ) : null}

      {(totals.cartWideDiscount ?? 0) > 0 ? (
        <Line
          label="Cart discount"
          value={`−${money(currency, totals.cartWideDiscount!)}`}
          tone="positive"
        />
      ) : null}

      {(totals.couponDiscount ?? 0) > 0 ? (
        <Line
          label="Coupon discount"
          value={`−${money(currency, totals.couponDiscount!)}`}
          tone="positive"
        />
      ) : null}

      <Line
        label="Total"
        value={money(currency, totals.total)}
        strong
      />
    </div>
  );
};
