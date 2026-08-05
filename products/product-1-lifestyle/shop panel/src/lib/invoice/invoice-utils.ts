import type { OrderDetail } from "@/lib/api/order/service";
import type { InvoiceData, InvoiceItem } from "@/types/invoice";

/* ── Map API data to invoice model ───────────────────────────────────── */

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  gateway: "Online Payment",
  mixed: "Partial Payment",
};

export function mapOrderToInvoice(order: OrderDetail): InvoiceData {
  const items: InvoiceItem[] = (order.items ?? []).map((item) => ({
    name: item.product_name ?? "Product",
    sku: item.sku ?? "—",
    color: item.color_name ?? "—",
    size: item.attribute_name ?? item.variant_name ?? "—",
    quantity: item.quantity ?? 0,
    unitPrice: item.final_unit_price ?? item.selling_price ?? 0,
    lineTotal: item.line_total ?? 0,
  }));

  return {
    orderId: String(order.order.id),
    date: order.order.created_at
      ? new Date(order.order.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A",
    paymentMethod:
      PAYMENT_TYPE_LABELS[order.order.payment_type] ??
      order.order.payment_type ??
      "N/A",
    paymentStatus: order.order.payment_status === "paid" ? "Paid" : "Unpaid",
    orderStatus: formatStatus(order.order.order_status),
    customer: {
      name: order.order.customer_name ?? "Customer",
      email: order.order.customer_email ?? "",
      phone: order.order.customer_phone ?? "",
    },
    shippingAddress: {
      fullAddress: order.order.address?.full_address ?? "N/A",
      city: order.order.address?.city ?? "",
      zip: order.order.address?.zip_code ?? "",
    },
    items,
    totals: {
      subtotal: order.totals.subtotal ?? 0,
      discount: order.totals.discount_total ?? 0,
      couponDiscount: order.totals.coupon_discount ?? 0,
      delivery: order.totals.delivery_charge ?? 0,
      grandTotal: order.totals.grand_total ?? 0,
      paid: order.totals.paid_amount ?? 0,
      due: order.totals.due_amount ?? 0,
    },
  };
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ── Currency formatter ──────────────────────────────────────────────── */

function fc(value: number): string {
  return `&#2547;${value.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/* ── Generate standalone print-ready HTML ─────────────────────────────── */

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemRows = data.items
    .map(
      (item, i) => `
      <tr style="${i % 2 === 0 ? "background:#fafafa;" : ""}">
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;">
          <div style="font-weight:600;color:#1a1a1a;">${escapeHtml(item.name)}</div>
          <div style="font-size:11px;color:#888;margin-top:2px;">
            SKU: ${escapeHtml(item.sku)} · ${escapeHtml(item.color)} · ${escapeHtml(item.size)}
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;color:#444;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:#444;">${fc(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;">${fc(item.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const totalLines: Array<{ label: string; value: string; bold?: boolean; color?: string }> = [
    { label: "Subtotal", value: fc(data.totals.subtotal) },
  ];

  if (data.totals.discount > 0) {
    totalLines.push({ label: "Discount", value: `−${fc(data.totals.discount)}`, color: "#16a34a" });
  }
  if (data.totals.couponDiscount > 0) {
    totalLines.push({ label: "Coupon Discount", value: `−${fc(data.totals.couponDiscount)}`, color: "#16a34a" });
  }
  totalLines.push({ label: "Delivery", value: fc(data.totals.delivery) });
  totalLines.push({ label: "Grand Total", value: fc(data.totals.grandTotal), bold: true });

  if (data.totals.paid > 0) {
    totalLines.push({ label: "Paid", value: fc(data.totals.paid), color: "#16a34a" });
  }
  if (data.totals.due > 0) {
    totalLines.push({ label: "Due", value: fc(data.totals.due), color: "#dc2626" });
  }

  const totalRows = totalLines
    .map(
      (line) => `
      <tr>
        <td style="padding:6px 12px;text-align:right;font-size:13px;color:#666;${line.bold ? "font-weight:700;font-size:14px;color:#1a1a1a;padding-top:12px;border-top:2px solid #1a1a1a;" : ""}">${line.label}</td>
        <td style="padding:6px 12px;text-align:right;font-size:13px;${line.bold ? "font-weight:700;font-size:14px;color:#1a1a1a;padding-top:12px;border-top:2px solid #1a1a1a;" : ""}${line.color ? `color:${line.color};` : "color:#1a1a1a;"}">${line.value}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice #${escapeHtml(data.orderId)} — LIFESTYLE</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; margin: 0 !important; padding: 24px !important; }
    }
    .page { max-width: 800px; margin: 20px auto; padding: 40px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #1a1a1a;">
      <div>
        <div style="font-size:24px;font-weight:700;letter-spacing:0.15em;color:#1a1a1a;">LIFESTYLE</div>
        <div style="font-size:11px;color:#888;margin-top:4px;letter-spacing:0.05em;">PREMIUM FASHION</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:22px;font-weight:700;letter-spacing:0.08em;color:#1a1a1a;">INVOICE</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">#${escapeHtml(data.orderId)}</div>
        <div style="font-size:12px;color:#666;">${escapeHtml(data.date)}</div>
      </div>
    </div>

    <!-- Customer + Address -->
    <div style="display:flex;gap:40px;margin-bottom:28px;">
      <div style="flex:1;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px;">Bill To</div>
        <div style="font-size:14px;font-weight:600;color:#1a1a1a;">${escapeHtml(data.customer.name)}</div>
        ${data.customer.email ? `<div style="font-size:12px;color:#666;margin-top:2px;">${escapeHtml(data.customer.email)}</div>` : ""}
        ${data.customer.phone ? `<div style="font-size:12px;color:#666;">${escapeHtml(data.customer.phone)}</div>` : ""}
      </div>
      <div style="flex:1;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px;">Ship To</div>
        <div style="font-size:12px;color:#444;line-height:1.5;">${escapeHtml(data.shippingAddress.fullAddress)}</div>
        ${data.shippingAddress.city ? `<div style="font-size:12px;color:#444;">${escapeHtml(data.shippingAddress.city)} ${escapeHtml(data.shippingAddress.zip)}</div>` : ""}
      </div>
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px;">Payment</div>
        <div style="font-size:12px;color:#444;">${escapeHtml(data.paymentMethod)}</div>
        <div style="font-size:12px;margin-top:2px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;${data.paymentStatus === "Paid" ? "background:#dcfce7;color:#16a34a;" : "background:#fef2f2;color:#dc2626;"}">${escapeHtml(data.paymentStatus)}</span>
        </div>
      </div>
    </div>

    <!-- Items table -->
    <table style="margin-bottom:24px;">
      <thead>
        <tr style="background:#1a1a1a;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#fff;font-weight:600;">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#fff;font-weight:600;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#fff;font-weight:600;">Price</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#fff;font-weight:600;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;">
      <table style="width:280px;">
        <tbody>${totalRows}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
      <div style="font-size:13px;color:#666;">Thank you for shopping with <strong>LIFESTYLE</strong></div>
      <div style="font-size:11px;color:#aaa;margin-top:4px;">This is a computer-generated invoice. No signature required.</div>
    </div>
  </div>
</body>
</html>`;
}

/* ── Print / Download ────────────────────────────────────────────────── */

/**
 * Opens the browser print dialog with the invoice rendered in a hidden iframe.
 * Works for both "Print" and "Save as PDF" (browser native).
 */
export function printInvoice(data: InvoiceData): void {
  const html = generateInvoiceHTML(data);
  const iframe = document.createElement("iframe");

  iframe.style.cssText = "position:fixed;left:-9999px;width:0;height:0;border:none;";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render before printing
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  // Fallback if onload doesn't fire (some browsers)
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch {
      // iframe already removed
    }
  }, 1000);
}

/**
 * Triggers "Save as PDF" by opening the invoice in a new tab/window.
 * The user can then use the browser's built-in "Save as PDF" from print.
 */
export function downloadInvoice(data: InvoiceData): void {
  const html = generateInvoiceHTML(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const newWindow = window.open(url, "_blank");

  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print();
        URL.revokeObjectURL(url);
      }, 500);
    };
  } else {
    // Popup blocked — fall back to iframe print
    URL.revokeObjectURL(url);
    printInvoice(data);
  }
}

/* ── Utilities ───────────────────────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
