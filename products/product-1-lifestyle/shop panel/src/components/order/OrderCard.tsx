"use client";

import Link from "next/link";
import { Eye, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { OrderDisplay } from "@/lib/orders/order-display";

interface OrderCardProps {
  order: OrderDisplay;
  /** Show cancel button for processing orders */
  onCancel?: (orderId: string) => void;
  /** Max images to show before "+N more" */
  maxImages?: number;
}

export function OrderCard({ order, onCancel, maxImages = 5 }: OrderCardProps) {
  const trackingNumber = order.courier?.tracking_number?.trim();
  const shippingLine = [order.customerName, order.shippingAddress, order.city, order.zip]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <div id={`order-${order.id}`} className="border border-border bg-card p-4 lg:p-6 hover:border-accent/20 transition-colors rounded-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground tracking-wide">Order {order.id}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {order.orderType && order.orderType !== "standard" && (
            <span className="text-[10px] tracking-[0.1em] uppercase text-accent font-medium">
              {order.orderType} order
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Link
            href={`/order-confirmation/${order.id}`}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <Eye size={13} /> View <ChevronRight size={12} />
          </Link>
          {order.status === "processing" && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Item thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {order.items.slice(0, maxImages).map((item, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-14 h-14 bg-secondary rounded overflow-hidden"
          >
            {item.image ? (
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : null}
          </div>
        ))}
        {order.items.length > maxImages && (
          <div className="flex-shrink-0 w-14 h-14 bg-secondary rounded flex items-center justify-center text-[10px] text-muted-foreground">
            +{order.items.length - maxImages}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </p>
        <p className="text-sm font-semibold text-foreground">Total: ${order.total.toFixed(2)}</p>
      </div>

      {/* Order details */}
      <div className="mt-4 pt-4 border-t border-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OrderMeta label="Payment" value={`${order.paymentLabel} · ${order.paymentStatus}`} />
          <OrderMeta
            label="Delivery"
            value={order.courier?.delivery_title || order.shippingAddress || "Pending"}
          />
          <OrderMeta
            label="Tracking"
            value={trackingNumber || order.rawStatus.replace(/_/g, " ")}
          />
        </div>

        {shippingLine && (
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">
              Ship To
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {shippingLine}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">Items</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.size} · {item.color} · Qty {item.quantity}
                  </p>
                </div>
                <p className="text-foreground font-medium shrink-0">
                  ${item.lineTotal.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <OrderAmount label="Subtotal" value={order.totals.subtotal} />
          <OrderAmount label="Discount" value={order.totals.discount} />
          <OrderAmount label="Delivery" value={order.totals.delivery} />
          <OrderAmount label="Due" value={order.totals.due} />
        </div>
      </div>
    </div>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-xs text-foreground truncate capitalize">{value}</p>
    </div>
  );
}

function OrderAmount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium">${value.toFixed(2)}</p>
    </div>
  );
}
