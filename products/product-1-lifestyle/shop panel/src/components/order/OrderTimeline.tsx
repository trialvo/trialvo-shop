import { Package, Mail } from "lucide-react";

const timelineSteps = [
  { label: "Order Placed", time: "Just now", active: true },
  { label: "Processing", time: "Expected in 1-2 hours", active: false },
  { label: "Shipped", time: "2-3 business days", active: false },
  { label: "Delivered", time: "5-7 business days", active: false },
];

const infoItems = [
  {
    icon: Package,
    text: "Your order is being processed and will be shipped within 2-3 business days.",
  },
  {
    icon: Mail,
    text: "A confirmation email has been sent to your email address.",
  },
];

interface OrderTimelineProps {
  orderId: string;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  return (
    <>
      {/* Order summary card */}
      <div className="bg-secondary/50 rounded-lg p-6 mt-8 text-left">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs tracking-widest uppercase text-muted-foreground">Order ID</span>
          <span className="text-sm font-semibold font-display text-foreground">{orderId}</span>
        </div>
        <div className="space-y-3">
          {infoItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex gap-3 items-start">
              <Icon size={16} className="text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8 text-left">
        <h3 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
          Order Status
        </h3>
        <div className="space-y-0">
          {timelineSteps.map((step, i) => (
            <div key={step.label} className="flex gap-4 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${step.active ? "bg-accent" : "bg-border"}`}
                />
                {i < timelineSteps.length - 1 && <div className="w-px h-8 bg-border" />}
              </div>
              <div className="-mt-0.5">
                <p
                  className={`text-sm font-medium ${step.active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
