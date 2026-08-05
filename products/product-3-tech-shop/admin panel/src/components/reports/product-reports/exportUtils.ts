import type { ProductReportRow } from "./types";
import { formatBdt } from "./reportUtils";

function escapeCsvValue(value: string): string {
  const v = value.replace(/\r\n|\r|\n/g, " ");
  if (/[",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function exportProductReportAsCsv(rows: ProductReportRow[], filename = "product-report.csv") {
  const header = [
    "Product ID",
    "Product",
    "Slug",
    "Category",
    "Sold Qty",
    "Buying Total",
    "Selling Total",
    "Discount Total",
    "Net Revenue",
    "Profit",
    "Status",
    "Updated",
  ];

  const lines = [header.join(",")];

  rows.forEach((r) => {
    lines.push(
      [
        escapeCsvValue(r.id),
        escapeCsvValue(r.name),
        escapeCsvValue(r.slug),
        escapeCsvValue(r.categoryPath),
        String(r.soldQty),
        escapeCsvValue(formatBdt(r.buying, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        escapeCsvValue(formatBdt(r.selling, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        escapeCsvValue(formatBdt(r.discount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        escapeCsvValue(formatBdt(r.netRevenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        escapeCsvValue(formatBdt(r.profit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        escapeCsvValue(r.status),
        escapeCsvValue(r.updatedAt),
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

export function exportProductReportAsPrintablePdf(rows: ProductReportRow[], title = "Product Report") {
  const stamp = new Date().toLocaleString();

  const tableRows = rows
    .map(
      (r) => `
        <tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td>${r.slug}</td>
          <td>${r.categoryPath}</td>
          <td style="text-align:right">${r.soldQty}</td>
          <td style="text-align:right">${formatBdt(r.buying, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align:right">${formatBdt(r.selling, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align:right">${formatBdt(r.discount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align:right">${formatBdt(r.netRevenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align:right">${formatBdt(r.profit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>${r.status}</td>
          <td>${r.updatedAt}</td>
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
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; vertical-align: top; }
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
            <th>ID</th>
            <th>Product</th>
            <th>Slug</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Buying</th>
            <th>Selling</th>
            <th>Discount</th>
            <th>Net</th>
            <th>Profit</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
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
