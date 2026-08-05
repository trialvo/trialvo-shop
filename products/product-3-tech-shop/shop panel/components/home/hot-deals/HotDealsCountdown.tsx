"use client";

import { useCountdown } from "@/hooks/useCountdown";

type HotDealsCountdownProps = {
  endAt: string | null;
};

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hrs" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
] as const;

export function HotDealsCountdown({ endAt }: HotDealsCountdownProps) {
  const parts = useCountdown(endAt);

  if (!parts || parts.isExpired) {
    return (
      <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-wider">
        Ends soon
      </p>
    );
  }

  const values = {
    days: parts.days,
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: parts.seconds,
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {UNITS.map((unit) => {
        const isSeconds = unit.key === "seconds";
        return (
          <div key={unit.key} className="flex flex-col items-center min-w-[2.75rem]">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-sm flex items-center justify-center border ${
                isSeconds
                  ? "gradient-accent text-accent-foreground border-accent/40 animate-timer-tick"
                  : "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/15"
              }`}
            >
              <span className="text-base sm:text-lg font-bold font-heading tabular-nums">
                {String(values[unit.key]).padStart(2, "0")}
              </span>
            </div>
            <span className="text-[9px] text-primary-foreground/45 mt-1 uppercase font-bold tracking-wider">
              {unit.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
