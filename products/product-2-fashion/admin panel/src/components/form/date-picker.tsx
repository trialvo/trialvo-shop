import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
const GAP = 6;
const VIEWPORT_PAD = 8;
const POPUP_W = 320;

type BaseProps = {
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  showClear?: boolean;
  showToday?: boolean;
  yearRange?: { from: number; to: number };
};

type IsoProps = BaseProps & {
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  valueType?: "iso";
};

type DateProps = BaseProps & {
  value?: Date | null;
  onChange: (value: Date | null) => void;
  min?: Date;
  max?: Date;
  valueType: "date";
};

type Props = IsoProps | DateProps;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromISO(v?: string): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const dt = new Date(y, mo, da);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== da) return null;
  return dt;
}
function formatDisplay(v?: string) {
  const d = fromISO(v);
  if (!d) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatDisplayDate(d?: Date | null) {
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isBeforeISO(aISO: string, bISO: string) {
  return aISO < bISO;
}
function isAfterISO(aISO: string, bISO: string) {
  return aISO > bISO;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DatePicker({
  placeholder = "Select date",
  disabled = false,
  error = false,
  hint,
  className,
  showClear = true,
  showToday = true,
  yearRange,
  ...props
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const openRafRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);

  const isoValue = (props as IsoProps).value;
  const dateValue = (props as DateProps).value;
  const minDateValue = (props as DateProps).min;
  const maxDateValue = (props as DateProps).max;
  const minIsoValue = (props as IsoProps).min;
  const maxIsoValue = (props as IsoProps).max;

  const isDateMode = props.valueType === "date";
  const valueISO = useMemo(() => {
    if (isDateMode) {
      const v = dateValue;
      if (!v || Number.isNaN(v.getTime())) return "";
      return toISO(v);
    }
    return isoValue ?? "";
  }, [dateValue, isDateMode, isoValue]);

  const selectedDate = useMemo(() => fromISO(valueISO), [valueISO]);

  const [view, setView] = useState<Date>(() => {
    const base = selectedDate ?? new Date();
    return startOfMonth(base);
  });

  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    setView(startOfMonth(selectedDate));
  }, [selectedDate]);

  const cancelRaf = useCallback(() => {
    if (openRafRef.current !== null) {
      window.cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }
  }, []);

  const openPopup = useCallback(() => {
    if (open) return;
    setOpen(true);
    setIsMounted(true);
    cancelRaf();
    openRafRef.current = window.requestAnimationFrame(() => {
      openRafRef.current = window.requestAnimationFrame(() => {
        setIsVisible(true);
        openRafRef.current = null;
      });
    });
  }, [cancelRaf, open]);

  const closePopup = useCallback(() => {
    cancelRaf();
    setOpen(false);
    setIsVisible(false);
    setMonthOpen(false);
    setYearOpen(false);
  }, [cancelRaf]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) setIsMounted(false);
  }, [open]);

  useEffect(() => () => cancelRaf(), [cancelRaf]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popupRef.current?.contains(t)) return;
      closePopup();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closePopup]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePopup();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePopup]);

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const popupH = popupRef.current?.getBoundingClientRect().height ?? 380;
    const availBottom = window.innerHeight - rect.bottom - VIEWPORT_PAD;
    const availTop = rect.top - VIEWPORT_PAD;
    const placement = availBottom < popupH && availTop > availBottom ? "top" : "bottom";

    const top = placement === "bottom"
      ? rect.bottom + GAP
      : rect.top - GAP - popupH;

    const left = Math.max(VIEWPORT_PAD, Math.min(rect.left, window.innerWidth - POPUP_W - VIEWPORT_PAD));
    setPopupPos({ top, left, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const raf = window.requestAnimationFrame(computePosition);
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [computePosition, open]);

  const minISO = useMemo(() => {
    if (isDateMode) {
      const minDate = minDateValue;
      if (!minDate || Number.isNaN(minDate.getTime())) return undefined;
      return toISO(minDate);
    }
    return minIsoValue;
  }, [isDateMode, minDateValue, minIsoValue]);

  const maxISO = useMemo(() => {
    if (isDateMode) {
      const maxDate = maxDateValue;
      if (!maxDate || Number.isNaN(maxDate.getTime())) return undefined;
      return toISO(maxDate);
    }
    return maxIsoValue;
  }, [isDateMode, maxDateValue, maxIsoValue]);

  const withinRange = (iso: string) => {
    if (minISO && isBeforeISO(iso, minISO)) return false;
    if (maxISO && isAfterISO(iso, maxISO)) return false;
    return true;
  };

  const selectISO = (iso: string) => {
    if (!withinRange(iso)) return;
    if (isDateMode) {
      const dt = fromISO(iso);
      if (!dt) return;
      (props as DateProps).onChange(dt);
    } else {
      (props as IsoProps).onChange(iso);
    }
    closePopup();
  };

  const grid = useMemo(() => {
    const first = startOfMonth(view);
    const startWeekday = first.getDay();
    const totalDays = daysInMonth(view);

    const cells: Array<{ date: Date | null; iso?: string }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(view.getFullYear(), view.getMonth(), day);
      cells.push({ date: d, iso: toISO(d) });
    }

    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [view]);

  const years = useMemo(() => {
    const nowY = new Date().getFullYear();
    const from = yearRange?.from ?? nowY - 50;
    const to = yearRange?.to ?? nowY + 10;
    const list: number[] = [];
    for (let y = to; y >= from; y--) list.push(y);
    return list;
  }, [yearRange]);

  const yearListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!yearOpen) return;
    const y = view.getFullYear();
    const idx = years.indexOf(y);
    if (idx < 0) return;
    const el = yearListRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, idx * 36 - 72);
  }, [yearOpen, years, view]);

  const display = isDateMode
    ? formatDisplayDate(dateValue)
    : valueISO
      ? formatDisplay(valueISO)
      : "";
  const viewMonth = view.getMonth();
  const viewYear = view.getFullYear();

  return (
    <div ref={rootRef} className={cn("w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && (open ? closePopup() : openPopup())}
        className={cn(
          "relative flex h-10 w-full items-center rounded-xl border bg-white pl-10 pr-9 text-left text-sm",
          "transition-all duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-1",
          "dark:bg-gray-900",
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
            : error
              ? "border-error-500 text-gray-900 dark:border-error-500 dark:text-white/90"
              : "border-gray-200 text-gray-900 hover:border-gray-300 dark:border-gray-700 dark:text-white/90 dark:hover:border-gray-600",
        )}
        aria-label={placeholder}
      >
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30">
          <Calendar size={16} />
        </span>

        {display ? (
          <span className="block truncate font-medium">{display}</span>
        ) : (
          <span className="block truncate text-gray-400 dark:text-white/30">{placeholder}</span>
        )}

        {showClear && valueISO && !disabled ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isDateMode) {
                  (props as DateProps).onChange(null);
                } else {
                  (props as IsoProps).onChange("");
                }
              }}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors",
                "hover:bg-gray-100 hover:text-gray-600",
                "dark:hover:bg-gray-800 dark:hover:text-gray-300",
              )}
              aria-label="Clear date"
            >
              <X size={13} />
            </button>
          </span>
        ) : null}
      </button>

      {hint ? (
        <p className={cn("mt-1.5 text-xs", error ? "text-error-500" : "text-gray-500 dark:text-gray-400")}>
          {hint}
        </p>
      ) : null}

      {isMounted
        ? createPortal(
            <div
              ref={popupRef}
              onTransitionEnd={handleTransitionEnd}
              className={cn(
                "fixed z-[9999] w-[min(320px,calc(100vw-16px))] rounded-2xl border bg-white/95 backdrop-blur-xl",
                "border-gray-200 dark:border-gray-700 dark:bg-gray-900/95",
                "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.03)]",
                "dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)]",
              )}
              style={{
                top: popupPos?.top ?? 0,
                left: popupPos?.left ?? 0,
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? "scale(1) translateY(0)"
                  : popupPos?.placement === "top"
                    ? "scale(0.96) translateY(6px)"
                    : "scale(0.96) translateY(-6px)",
                transformOrigin: popupPos?.placement === "top" ? "bottom center" : "top center",
                transition: isVisible
                  ? `opacity 200ms ease, transform 320ms ${SPRING}`
                  : `opacity 120ms ${EASE_IN}, transform 120ms ${EASE_IN}`,
                pointerEvents: isVisible ? "auto" : "none",
              }}
            >
              <div className="flex items-center justify-between gap-1 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setView((v) => addMonths(v, -1))}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors",
                    "hover:bg-gray-100 hover:text-gray-700",
                    "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                  )}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="relative flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMonthOpen((s) => !s);
                      setYearOpen(false);
                    }}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-gray-800 transition-colors",
                      "hover:bg-gray-100",
                      "dark:text-gray-200 dark:hover:bg-gray-800",
                      monthOpen && "bg-gray-100 dark:bg-gray-800",
                    )}
                  >
                    <span className="truncate">{MONTHS[viewMonth]}</span>
                    <ChevronDown size={12} className={cn("transition-transform", monthOpen && "rotate-180")} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setYearOpen((s) => !s);
                      setMonthOpen(false);
                    }}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-gray-800 transition-colors",
                      "hover:bg-gray-100",
                      "dark:text-gray-200 dark:hover:bg-gray-800",
                      yearOpen && "bg-gray-100 dark:bg-gray-800",
                    )}
                  >
                    <span className="truncate">{viewYear}</span>
                    <ChevronDown size={12} className={cn("transition-transform", yearOpen && "rotate-180")} />
                  </button>

                  {monthOpen ? (
                    <div className="absolute left-1/2 top-10 z-50 w-[min(280px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {MONTHS.map((m, idx) => {
                          const active = idx === viewMonth;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setView(new Date(viewYear, idx, 1));
                                setMonthOpen(false);
                              }}
                              className={cn(
                                "h-8 rounded-lg text-xs font-medium transition-colors",
                                active
                                  ? "bg-brand-500 text-white shadow-sm"
                                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                              )}
                            >
                              {m.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {yearOpen ? (
                    <div className="absolute left-1/2 top-10 z-50 w-[min(240px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <div ref={yearListRef} className="max-h-52 overflow-auto p-2">
                        <div className="grid grid-cols-3 gap-1">
                          {years.map((y) => {
                            const active = y === viewYear;
                            return (
                              <button
                                key={y}
                                type="button"
                                onClick={() => {
                                  setView(new Date(y, viewMonth, 1));
                                  setYearOpen(false);
                                }}
                                className={cn(
                                  "h-8 rounded-lg text-xs font-medium transition-colors",
                                  active
                                    ? "bg-brand-500 text-white shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                                )}
                              >
                                {y}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setView((v) => addMonths(v, 1))}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors",
                    "hover:bg-gray-100 hover:text-gray-700",
                    "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                  )}
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {(showToday || showClear) ? (
                <div className="flex items-center gap-1.5 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
                  {showToday ? (
                    <button
                      type="button"
                      onClick={() => selectISO(toISO(new Date()))}
                      className={cn(
                        "h-7 rounded-lg px-2.5 text-[11px] font-semibold text-gray-600 transition-colors",
                        "hover:bg-gray-100",
                        "dark:text-gray-400 dark:hover:bg-gray-800",
                      )}
                    >
                      Today
                    </button>
                  ) : null}

                  {showClear && valueISO ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isDateMode) {
                          (props as DateProps).onChange(null);
                        } else {
                          (props as IsoProps).onChange("");
                        }
                        closePopup();
                      }}
                      className={cn(
                        "h-7 rounded-lg px-2.5 text-[11px] font-semibold text-gray-600 transition-colors",
                        "hover:bg-gray-100",
                        "dark:text-gray-400 dark:hover:bg-gray-800",
                      )}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-7 px-3 pt-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                {grid.map((cell, idx) => {
                  if (!cell.date || !cell.iso) return <div key={idx} className="h-8" />;

                  const iso = cell.iso;
                  const disabledDay = !withinRange(iso);
                  const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
                  const isToday = isSameDay(cell.date, new Date());

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => selectISO(iso)}
                      className={cn(
                        "h-8 rounded-lg text-sm font-medium transition-all",
                        "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
                        disabledDay && "cursor-not-allowed opacity-30",
                        isSelected
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                        !isSelected && isToday && "ring-1 ring-brand-500 ring-inset",
                      )}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
