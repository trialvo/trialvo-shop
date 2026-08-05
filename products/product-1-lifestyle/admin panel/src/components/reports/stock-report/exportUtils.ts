// src/components/reports/stock-report/exportUtils.ts
import type { StockCategoryReportRow } from "./types";

function escapeCsvValue(value: string): string {
  const v = value.replace(/\r\n|\r|\n/g, " ");
  if (/[",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function exportStockCategoryAsCsv(rows: StockCategoryReportRow[], filename = "stock-category-report.csv") {
  const header = ["SL", "Category", "Total SKU", "In Stock", "Low Stock", "Out of Stock"];
  const lines = [header.join(",")];

  rows.forEach((r) => {
    lines.push(
      [
        String(r.sl),
        escapeCsvValue(r.name),
        String(r.totalSku),
        String(r.inStock),
        String(r.lowStock),
        String(r.outOfStock),
      ].join(",")
    );
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportStockCategoryAsPrintablePdf(rows: StockCategoryReportRow[], title = "Stock Category Report") {
  const stamp = new Date().toLocaleString();

  const bodyRows = rows
    .map(
      (r) => `
        <tr>
          <td>${r.sl}</td>
          <td>${r.name}</td>
          <td style="text-align:right">${r.totalSku}</td>
          <td style="text-align:right">${r.inStock}</td>
          <td style="text-align:right">${r.lowStock}</td>
          <td style="text-align:right">${r.outOfStock}</td>
        </tr>
      `
    )
    .join("");

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        :root { color-scheme: light; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
        h1 { margin: 0 0 6px; font-size: 20px; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
        th { background: #f9fafb; text-transform: uppercase; letter-spacing: .06em; font-size: 11px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated: ${stamp} • Rows: ${rows.length}</div>
      <table>
        <thead>
          <tr>
            <th>SL</th>
            <th>Category</th>
            <th>Total SKU</th>
            <th>In Stock</th>
            <th>Low Stock</th>
            <th>Out of Stock</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
  </html>
  `;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
