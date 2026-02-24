import React, { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceData {
 order_id: string;
 customer_name: string;
 customer_phone: string;
 customer_email?: string;
 customer_address?: string;
 customer_city?: string;
 total_bdt: number;
 payment_method: string;
 status: string;
 created_at: string;
 items?: { name: string; qty: number; price: number; total: number }[];
 product?: { name: any };
}

interface Props {
 order: InvoiceData;
 storeName?: string;
}

const InvoiceDownloadButton: React.FC<Props> = ({ order, storeName = 'eShop Market' }) => {
 const printRef = useRef<HTMLDivElement>(null);

 const handlePrint = () => {
  const printContent = printRef.current;
  if (!printContent) return;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;

  const productName = order.product?.name
   ? (typeof order.product.name === 'string' ? JSON.parse(order.product.name).en : order.product.name.en)
   : 'Product';

  const items = order.items || [{ name: productName, qty: 1, price: order.total_bdt, total: order.total_bdt }];

  printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.order_id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .logo { font-size: 24px; font-weight: 800; color: #1a1a2e; }
          .logo-sub { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 28px; font-weight: 700; color: #6366f1; }
          .invoice-title p { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .meta-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; }
          .meta-block p { font-size: 14px; margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f3f4f6; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; }
          td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #e5e7eb; border-bottom: none; }
          .total-row td:last-child { color: #6366f1; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
          .badge-paid { background: #d1fae5; color: #059669; }
          .badge-unpaid { background: #fee2e2; color: #dc2626; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">${storeName}</div>
            <div class="logo-sub">Invoice</div>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>${order.order_id}</p>
            <p>${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div class="meta">
          <div class="meta-block">
            <h4>Bill To</h4>
            <p><strong>${order.customer_name}</strong></p>
            <p>${order.customer_phone}</p>
            ${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
            ${order.customer_address ? `<p>${order.customer_address}</p>` : ''}
            ${order.customer_city ? `<p>${order.customer_city}</p>` : ''}
          </div>
          <div class="meta-block" style="text-align: right;">
            <h4>Payment</h4>
            <p style="text-transform: capitalize;">${order.payment_method}</p>
            <p>Status: <span class="badge ${order.status === 'completed' ? 'badge-paid' : 'badge-unpaid'}">${order.status}</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right;">৳${Number(item.price).toLocaleString()}</td>
                <td style="text-align:right;">৳${Number(item.total).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align:right;">Total</td>
              <td style="text-align:right;">৳${Number(order.total_bdt).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p style="margin-top:4px;">${storeName} • Dhaka, Bangladesh</p>
        </div>
      </body>
      </html>
    `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
 };

 return (
  <div ref={printRef}>
   <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
    <Download className="w-3.5 h-3.5" />
    Invoice
   </Button>
  </div>
 );
};

export default InvoiceDownloadButton;
