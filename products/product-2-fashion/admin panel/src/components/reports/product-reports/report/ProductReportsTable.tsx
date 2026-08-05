"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

import type { ProductReportRow } from "../types";

type Props = {
  rows: ProductReportRow[];
  isLoading?: boolean;
};

const money = (n: number) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;

function StatusBadge({ status, t }: { status: ProductReportRow["status"]; t: (key: string) => string }) {
  return status === "active" ? (
    <Badge size="sm" color="success" variant="light">
      {t("reports.productReport.active")}
    </Badge>
  ) : (
    <Badge size="sm" color="error" variant="light">
      {t("reports.productReport.inactive")}
    </Badge>
  );
}

const ProductReportsTable: React.FC<Props> = ({ rows, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-full overflow-hidden rounded-xl">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-950">
                <TableCell isHeader className="w-[70px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.orderReport.thSl")}
                </TableCell>

                <TableCell isHeader className="min-w-[320px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.product")}
                </TableCell>

                <TableCell isHeader className="min-w-[260px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.category")}
                </TableCell>

                <TableCell isHeader className="min-w-[120px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.sold")}
                </TableCell>

                <TableCell isHeader className="min-w-[160px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.revenue")}
                </TableCell>

                <TableCell isHeader className="min-w-[160px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.orderReport.thCost")}
                </TableCell>

                <TableCell isHeader className="min-w-[160px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.orderReport.thProfit")}
                </TableCell>

                <TableCell isHeader className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.status")}
                </TableCell>

                <TableCell isHeader className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("reports.productReport.updated")}
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-t border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={`sk-${i}-${j}`} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading &&
                rows.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.04]"
                  >
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {idx + 1}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="max-w-[420px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {r.name}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          ID: {r.id} • SKU: {r.sku}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {r.categoryPath}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {r.soldQty}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                      {money(r.revenue)}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                      {money(r.cost)}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "px-4 py-3 text-right text-sm font-extrabold",
                        r.profit >= 0 ? "text-success-700 dark:text-success-400" : "text-error-700 dark:text-error-400"
                      )}
                    >
                      {money(r.profit)}
                    </TableCell>

                    <TableCell className="px-4 py-3">{<StatusBadge status={r.status} t={t} />}</TableCell>

                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {r.updatedAt}
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
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

export default ProductReportsTable;
