import type { OrderStatus } from "@/types";
import { STATUS_STYLES } from "@/lib/theme";

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1 rounded-full ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
