"use client";

import React, { useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "AM" | "PM";
type TimeSelectSize = "sm" | "md" | "lg";

type TimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  size?: TimeSelectSize;
  disabled?: boolean;
  showPresets?: boolean;
  className?: string;
};

// ─── Size config ──────────────────────────────────────────────────────────────

type SizeConfig = {
  wrapper: string;
  selectClass: string;
  pillHeight: string;
  pillInner: string;
  pillWidth: string;
  pillText: string;
  labelText: string;
  previewText: string;
  previewIcon: number;
  separator: string;
  presetText: string;
};

const SIZE_CONFIG: Record<TimeSelectSize, SizeConfig> = {
  sm: {
    wrapper: "gap-2",
    selectClass: "h-8 min-w-[52px] rounded-lg px-2 text-xs",
    pillHeight: "h-8",
    pillInner: "h-[24px] w-[28px]",
    pillWidth: "w-[30px]",
    pillText: "text-[10px]",
    labelText: "text-[9px]",
    previewText: "text-xs",
    previewIcon: 11,
    separator: "text-base",
    presetText: "text-[9px]",
  },
  md: {
    wrapper: "gap-2.5",
    selectClass: "h-9 min-w-[56px] rounded-lg px-2.5 text-sm",
    pillHeight: "h-9",
    pillInner: "h-[28px] w-[30px]",
    pillWidth: "w-[32px]",
    pillText: "text-[11px]",
    labelText: "text-[10px]",
    previewText: "text-sm",
    previewIcon: 13,
    separator: "text-lg",
    presetText: "text-[10px]",
  },
  lg: {
    wrapper: "gap-3",
    selectClass: "h-10 min-w-[60px] rounded-lg px-3 text-sm",
    pillHeight: "h-10",
    pillInner: "h-[32px] w-[32px]",
    pillWidth: "w-[34px]",
    pillText: "text-xs",
    labelText: "text-[11px]",
    previewText: "text-base",
    previewIcon: 14,
    separator: "text-xl",
    presetText: "text-[11px]",
  },
};

// ─── Time constants ───────────────────────────────────────────────────────────

const HOURS_12: readonly number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_INTERVALS: readonly number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type PresetEntry = { label: string; h24: string };

const TIME_PRESETS: readonly PresetEntry[] = [
  { label: "12 AM",    h24: "00:00" },
  { label: "6 AM",     h24: "06:00" },
  { label: "9 AM",     h24: "09:00" },
  { label: "12 PM",    h24: "12:00" },
  { label: "3 PM",     h24: "15:00" },
  { label: "6 PM",     h24: "18:00" },
  { label: "9 PM",     h24: "21:00" },
  { label: "11:59 PM", h24: "23:59" },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function to12(hour24: number): { hour12: number; period: Period } {
  const period: Period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour12, period };
}

function to24(hour12: number, period: Period): number {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function parseTimeValue(raw: string): { hour24: number; minute: number } {
  const parts = (raw || "00:00").split(":");
  const hour24 = parseInt(parts[0] ?? "0", 10);
  const minute = parseInt(parts[1] ?? "0", 10);
  return {
    hour24: Number.isFinite(hour24) ? hour24 : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function formatPreview(hour24: number, minute: number): string {
  const { hour12, period } = to12(hour24);
  return `${hour12}:${pad2(minute)} ${period}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const selectBase =
  "appearance-none border border-gray-200 bg-white font-semibold text-gray-800 outline-none cursor-pointer transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  size = "md",
  disabled = false,
  showPresets = true,
  className,
}) => {
  const { hour24, minute } = parseTimeValue(value);
  const { hour12, period } = to12(hour24);
  const config = SIZE_CONFIG[size];

  const minuteOpts = useMemo(() => {
    const set = new Set<number>(MINUTE_INTERVALS);
    set.add(minute);
    return Array.from(set).sort((a, b) => a - b);
  }, [minute]);

  const preview = useMemo(() => formatPreview(hour24, minute), [hour24, minute]);

  const emit = (h24: number, m: number): void => {
    onChange(`${pad2(h24)}:${pad2(m)}`);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newH12 = parseInt(e.target.value, 10);
    if (!Number.isFinite(newH12)) return;
    emit(to24(newH12, period), minute);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newMin = parseInt(e.target.value, 10);
    if (!Number.isFinite(newMin)) return;
    emit(hour24, newMin);
  };

  const togglePeriod = (): void => {
    const newPeriod: Period = period === "AM" ? "PM" : "AM";
    emit(to24(hour12, newPeriod), minute);
  };

  return (
    <div
      className={cn(
        "inline-flex flex-col",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {/* ── Controls row ─────────────────────────────────────── */}
      <div className={cn("flex items-center", config.wrapper)}>
        {/* Hour */}
        <div className="flex flex-col">
          <span className={cn(
            "mb-1 font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none",
            config.labelText,
          )}>
            Hour
          </span>
          <select
            value={hour12}
            onChange={handleHourChange}
            disabled={disabled}
            className={cn(selectBase, config.selectClass)}
          >
            {HOURS_12.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* : separator */}
        <span className={cn(
          "mt-5 font-bold text-gray-300 dark:text-gray-600 select-none",
          config.separator,
        )}>
          :
        </span>

        {/* Minute */}
        <div className="flex flex-col">
          <span className={cn(
            "mb-1 font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none",
            config.labelText,
          )}>
            Min
          </span>
          <select
            value={minute}
            onChange={handleMinuteChange}
            disabled={disabled}
            className={cn(selectBase, config.selectClass)}
          >
            {minuteOpts.map((m) => (
              <option key={m} value={m}>{pad2(m)}</option>
            ))}
          </select>
        </div>

        {/* AM/PM */}
        <div className="flex flex-col">
          <span className={cn(
            "mb-1 font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none",
            config.labelText,
          )}>
            Period
          </span>
          <button
            type="button"
            onClick={togglePeriod}
            disabled={disabled}
            className={cn(
              "relative flex items-center rounded-lg overflow-hidden shrink-0",
              "bg-gray-100 dark:bg-gray-800",
              config.pillHeight,
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] rounded-md bg-brand-500 shadow-sm transition-all duration-300",
                config.pillInner,
                period === "AM" ? "left-[2px]" : "left-[calc(100%-2px)] -translate-x-full",
              )}
              style={{ transitionTimingFunction: SPRING }}
            />
            <span
              className={cn(
                "relative z-10 text-center font-bold transition-colors duration-200 select-none",
                config.pillWidth,
                config.pillText,
                period === "AM" ? "text-white" : "text-gray-400 dark:text-gray-500",
              )}
            >
              AM
            </span>
            <span
              className={cn(
                "relative z-10 text-center font-bold transition-colors duration-200 select-none",
                config.pillWidth,
                config.pillText,
                period === "PM" ? "text-white" : "text-gray-400 dark:text-gray-500",
              )}
            >
              PM
            </span>
          </button>
        </div>

        {/* Live preview */}
        <div className="flex flex-col">
          <span className={cn(
            "mb-1 font-semibold uppercase tracking-wider text-transparent select-none",
            config.labelText,
          )}>
            –
          </span>
          <div className={cn(
            "flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 dark:bg-brand-500/10",
            config.pillHeight,
          )}>
            <Clock size={config.previewIcon} className="shrink-0 text-brand-500 dark:text-brand-400" />
            <span className={cn(
              "font-semibold text-brand-700 dark:text-brand-300 whitespace-nowrap",
              config.previewText,
            )}>
              {preview}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick presets ─────────────────────────────────────── */}
      {showPresets && (
        <div className="mt-2 flex flex-wrap gap-1">
          {TIME_PRESETS.map((preset) => {
            const isActive = preset.h24 === `${pad2(hour24)}:${pad2(minute)}`;
            return (
              <button
                key={preset.h24}
                type="button"
                onClick={() => onChange(preset.h24)}
                disabled={disabled}
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold transition-all duration-200",
                  config.presetText,
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimeSelect;
export type { TimeSelectProps, TimeSelectSize };
