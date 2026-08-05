import type { OrderReportRow } from "./types";

function escapeCsvValue(value: string): string {
  const v = value.replace(/\r\n|\r|\n/g, " ");
  if (/[",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

const moneyBdt = (n: number) => `${Number(n || 0).toLocaleString()}৳`;

export function exportOrdersAsCsv(rows: OrderReportRow[], filename = "order-report.csv") {
  const header = [
    "Order ID",
    "Type",
    "Customer",
    "Phone",
    "Email",
    "Items",
    "Grand Total (BDT)",
    "Total Cost (BDT)",
    "Profit (BDT)",
    "Order Status",
    "Payment Status",
    "Payment Type",
    "Placed At",
  ];

  const lines = [header.join(",")];

  rows.forEach((r) => {
    lines.push(
      [
        escapeCsvValue(r.orderId),
        escapeCsvValue(String(r.orderType)),
        escapeCsvValue(r.customerName),
        escapeCsvValue(r.phone),
        escapeCsvValue(r.email ?? "-"),
        String(r.items),
        escapeCsvValue(moneyBdt(r.grandTotal)),
        escapeCsvValue(moneyBdt(r.totalCost)),
        escapeCsvValue(moneyBdt(r.profit)),
        escapeCsvValue(r.orderStatus),
        escapeCsvValue(r.paymentStatus),
        escapeCsvValue(r.paymentType),
        escapeCsvValue(r.placedAt),
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

export function exportOrdersAsPrintablePdf(rows: OrderReportRow[], title = "Order Report") {
  const stamp = new Date().toLocaleString();

  const bodyRows = rows
    .map(
      (r) => `
        <tr>
          <td>${r.orderId}</td>
          <td>${r.orderType}</td>
          <td>${r.customerName}</td>
          <td>${r.phone}</td>
          <td>${r.email ?? "-"}</td>
          <td style="text-align:right">${r.items}</td>
          <td style="text-align:right">${moneyBdt(r.grandTotal)}</td>
          <td style="text-align:right">${moneyBdt(r.totalCost)}</td>
          <td style="text-align:right">${moneyBdt(r.profit)}</td>
          <td>${r.orderStatus.replace(/_/g, " ")}</td>
          <td>${r.paymentStatus.replace(/_/g, " ")}</td>
          <td>${r.paymentType}</td>
          <td>${r.placedAt}</td>
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
            <th>Order ID</th>
            <th>Type</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Items</th>
            <th>Total (BDT)</th>
            <th>Cost (BDT)</th>
            <th>Profit (BDT)</th>
            <th>Order Status</th>
            <th>Payment Status</th>
            <th>Payment Type</th>
            <th>Placed At</th>
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
