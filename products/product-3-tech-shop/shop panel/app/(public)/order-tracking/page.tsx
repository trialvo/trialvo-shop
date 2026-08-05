"use client";

import Layout from "@/components/layout/Layout";
import { AppButton } from "@/components/shared/AppButton";
import { AppInput } from "@/components/shared/AppInput";
import { Suspense, useEffect, useState, type ReactElement } from "react";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { orderService } from "@/lib/api/order/service";
import {
  parseTrackableOrderId,
  toOrderTrackingViewModel,
  type OrderTrackingViewModel,
} from "@/lib/adapters/orderTracking";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { sanitizeAuthText } from "@/lib/security/auth";

function stepIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("deliver")) return CheckCircle;
  if (lower.includes("ship") || lower.includes("out")) return Truck;
  if (lower.includes("placed") || lower.includes("confirm")) return Package;
  return Clock;
}

export default function OrderTrackingPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="container py-16 text-center text-muted-foreground text-sm">
            Loading…
          </div>
        </Layout>
      }
    >
      <OrderTrackingPageContent />
    </Suspense>
  );
}

function OrderTrackingPageContent(): ReactElement {
  const { isAuthenticated } = useAuthContext();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<OrderTrackingViewModel | null>(null);

  // Prefill from /order-tracking?orderId=123 (account orders Track CTA)
  useEffect(() => {
    const fromQuery = sanitizeAuthText(
      searchParams.get("orderId") ?? "",
      40,
    );
    if (fromQuery) setOrderId(fromQuery);
  }, [searchParams]);

  const handleTrack = async () => {
    setError(null);
    setView(null);

    const numericId = parseTrackableOrderId(orderId);
    if (!numericId) {
      setError("Enter a valid numeric order ID.");
      return;
    }

    if (!isAuthenticated) {
      setError("Sign in to track your order, or contact support with your order ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await orderService.trackOrder(numericId);
      if (res?.success === false) {
        throw new Error(res.error || res.message || "Order not found");
      }
      setView(toOrderTrackingViewModel(String(numericId), res));
    } catch (err) {
      setError(
        getUnknownErrorMessage(err, "Could not track this order. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 max-w-2xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-center">
          Track Your Order
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          Enter your order ID to check delivery status
        </p>

        <div className="mt-8 flex gap-3">
          <AppInput
            value={orderId}
            onValueChange={setOrderId}
            placeholder="Enter Order ID (e.g. 123456)"
            sanitize="text"
            maxLength={40}
            tone="solid"
            inputSize="lg"
            containerClassName="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleTrack();
            }}
          />
          <AppButton
            onClick={() => void handleTrack()}
            leftIcon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )
            }
            disabled={loading}
            isLoading={loading}
            loadingText="Tracking…"
          >
            Track
          </AppButton>
        </div>

        {error ? (
          <div className="mt-6 rounded-sm border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive text-center">
            <p>{error}</p>
            {!isAuthenticated ? (
              <AppButton asChild variant="outline" size="sm" className="mt-3">
                <Link href="/account">Sign in</Link>
              </AppButton>
            ) : null}
          </div>
        ) : null}

        {view ? (
          <div className="mt-10 bg-card rounded-xl border border-border p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="font-heading font-semibold">
                  Order #{view.orderId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {view.estimatedNote}
                </p>
              </div>
              <span
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-full",
                  view.statusTone === "success" &&
                    "bg-success/10 text-success",
                  view.statusTone === "warning" &&
                    "bg-warning/10 text-warning",
                  view.statusTone === "destructive" &&
                    "bg-destructive/10 text-destructive",
                  view.statusTone === "muted" &&
                    "bg-secondary text-muted-foreground",
                )}
              >
                {view.statusLabel}
              </span>
            </div>
            <div className="space-y-0">
              {view.steps.map((step, i) => {
                const Icon = stepIcon(step.label);
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          step.done || step.current
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {i < view.steps.length - 1 ? (
                        <div
                          className={`w-0.5 h-12 ${
                            step.done ? "bg-primary" : "bg-border"
                          }`}
                        />
                      ) : null}
                    </div>
                    <div className="pb-8">
                      <p
                        className={`font-medium text-sm ${
                          step.done || step.current
                            ? ""
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.date ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.date}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
