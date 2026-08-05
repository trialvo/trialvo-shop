import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

export type UiSelectOption = {
  id: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: UiSelectOption[];
  className?: string;
  variant?: "pill" | "cell";
};

/* -------------------------------- COLORS -------------------------------- */

function statusColor(label: string) {
  const key = label.toLowerCase();

  if (key === "paid") return "text-success-600";
  if (key === "unpaid") return "text-error-600";

  if (key === "new") return "text-blue-light-500";
  if (key === "approved") return "text-brand-500";
  if (key === "processing") return "text-orange-500";
  if (key === "packaging") return "text-blue-light-700";
  if (key === "shipped") return "text-blue-light-600";
  if (key === "out of delivery") return "text-blue-light-800";
  if (key === "delivered") return "text-success-600";
  if (key === "returned") return "text-orange-600";
  if (key === "cancelled") return "text-error-600";
  if (key === "on hold") return "text-gray-700";
  if (key === "trash") return "text-gray-600";

  return "text-gray-600 dark:text-gray-300";
}

function pillClass(label: string) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition border";

  const key = label.toLowerCase();

  if (key === "paid") return `${base} bg-success-600 text-white border-success-600`;
  if (key === "unpaid") return `${base} bg-error-600 text-white border-error-600`;

  if (key === "new") return `${base} bg-blue-light-500 text-white border-blue-light-500`;
  if (key === "approved") return `${base} bg-brand-500 text-white border-brand-500`;
  if (key === "processing") return `${base} bg-orange-500 text-white border-orange-500`;
  if (key === "packaging") return `${base} bg-blue-light-700 text-white border-blue-light-700`;
  if (key === "shipped") return `${base} bg-blue-light-600 text-white border-blue-light-600`;
  if (key === "out of delivery") return `${base} bg-blue-light-800 text-white border-blue-light-800`;
  if (key === "delivered") return `${base} bg-success-600 text-white border-success-600`;
  if (key === "returned") return `${base} bg-orange-600 text-white border-orange-600`;
  if (key === "cancelled") return `${base} bg-error-600 text-white border-error-600`;
  if (key === "on hold") return `${base} bg-gray-700 text-white border-gray-700`;
  if (key === "trash") return `${base} bg-gray-600 text-white border-gray-600`;

  return `${base} bg-gray-200 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-800`;
}

/* ------------------------------------------------------------------------ */

export default function OrderSelectDropdown({
  value,
  onChange,
  options,
  className = "",
  variant = "pill",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? options[0],
    [options, value]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={
          variant === "pill"
            ? pillClass(selected?.label ?? "")
            : "inline-flex h-9 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/[0.03]"
        }
      >
        <span className="capitalize">{selected?.label}</span>
        <ChevronDown size={14} className="opacity-80" />
      </button>

      {/* Dropdown */}
      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-52 p-2">
        <div className="max-h-64 overflow-auto custom-scrollbar">
          {options.map((o) => {
            const active = o.id === value;
            const colorClass = statusColor(o.label);

            return (
              <DropdownItem
                key={o.id}
                onItemClick={() => {
                  onChange(o.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-gray-100 dark:bg-white/5"
                    : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
                baseClassName=""
              >
                <span className={`capitalize font-semibold ${colorClass}`}>
                  {o.label}
                </span>

                {active ? (
                  <Check size={14} className={colorClass} />
                ) : null}
              </DropdownItem>
            );
          })}
        </div>
      </Dropdown>
    </div>
  );
}
