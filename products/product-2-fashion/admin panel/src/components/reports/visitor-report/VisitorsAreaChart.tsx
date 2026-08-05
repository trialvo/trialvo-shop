// src/components/reports/visitor-report/VisitorsAreaChart.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { VisitorDayPoint } from "./types";

type Props = {
  title: string;
  legend: string;
  points: VisitorDayPoint[];
  metaText?: string;
};

function toXY(points: VisitorDayPoint[], w: number, h: number, pad: number) {
  const max = Math.max(1, ...points.map((p) => p.visitors));
  const step = (w - pad * 2) / Math.max(1, points.length - 1);

  return points.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (1 - p.visitors / max) * (h - pad * 2);
    return { x, y, v: p.visitors, date: p.date };
  });
}

function pathLine(xy: Array<{ x: number; y: number }>) {
  return xy.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}

const VisitorsAreaChart: React.FC<Props> = ({ title, legend, points, metaText }) => {
  const { t } = useTranslation();
  const w = 1200;
  const h = 360;
  const pad = 44;

  const xy = React.useMemo(() => toXY(points, w, h, pad), [points]);
  const line = React.useMemo(() => pathLine(xy), [xy]);
  const area = `${line} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;

  const maxV = Math.max(1, ...points.map((p) => p.visitors));
  const total = points.reduce((acc, p) => acc + p.visitors, 0);

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900 dark:text-white">{title}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("reports.common.total")}: <span className="font-semibold">{total}</span> • {t("reports.visitorReport.peak")}:{" "}
            <span className="font-semibold">{maxV}</span>
            {metaText ? <span className="ml-2">• {metaText}</span> : null}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="h-2.5 w-9 rounded-sm bg-brand-500/25 border border-brand-500/30" />
          <span className="font-semibold">{legend}</span>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      <div className="mt-4 w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[980px]">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[360px]">
            <defs>
              <linearGradient id="areaFillVisitors" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4, 5].map((g) => (
              <line
                key={g}
                x1={pad}
                x2={w - pad}
                y1={pad + (g * (h - pad * 2)) / 5}
                y2={pad + (g * (h - pad * 2)) / 5}
                className="stroke-gray-200 dark:stroke-white/10"
                strokeDasharray="6 6"
              />
            ))}

            <path d={area} fill="url(#areaFillVisitors)" />
            <path d={line} className="stroke-brand-500" fill="none" strokeWidth="3" />

            {xy.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="4" className="fill-brand-500" />
            ))}

            {xy.map((p, idx) => {
              const show = idx === 0 || idx === xy.length - 1 || idx % 4 === 0;
              if (!show) return null;
              return (
                <text
                  key={p.date}
                  x={p.x}
                  y={h - 14}
                  textAnchor="middle"
                  className="fill-gray-500 dark:fill-gray-400"
                  fontSize="11"
                  fontWeight="600"
                >
                  {p.date}
                </text>
              );
            })}

            {[0, 1, 2, 3, 4, 5].map((g) => {
              const v = Math.round((maxV * (5 - g)) / 5);
              const y = pad + (g * (h - pad * 2)) / 5;
              return (
                <text
                  key={g}
                  x={pad - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-500"
                  fontSize="11"
                  fontWeight="600"
                >
                  {v}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VisitorsAreaChart;
