"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import type { StockCategoryReportRow } from "../types";

type Props = {
  rows: StockCategoryReportRow[];
  isLoading?: boolean;
};

const StockCategoryTable: React.FC<Props> = ({ rows, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-full overflow-hidden rounded-xl">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-950">
                <TableCell isHeader className="w-[80px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.orderReport.thSl")}
                </TableCell>
                <TableCell isHeader className="min-w-[320px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.category")}
                </TableCell>
                <TableCell isHeader className="min-w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.stockReport.totalSku")}
                </TableCell>
                <TableCell isHeader className="min-w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.stockReport.inStock")}
                </TableCell>
                <TableCell isHeader className="min-w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.stockReport.lowStock")}
                </TableCell>
                <TableCell isHeader className="min-w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.stockReport.outOfStock")}
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-t border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={`sk-${i}-${j}`} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading &&
                rows.map((r) => (
                  <TableRow
                    key={`${r.sl}-${r.name}`}
                    className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.04]"
                  >
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.sl}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {r.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">{r.totalSku}</TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-success-700 dark:text-success-400">{r.inStock}</TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-400">{r.lowStock}</TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-error-700 dark:text-error-400">{r.outOfStock}</TableCell>
                  </TableRow>
                ))}

              {!isLoading && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {t("reports.common.noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default StockCategoryTable;
