"use client";

import type { BulkOffer, ComboDeal } from "@/types";
import { BulkOfferCard } from "./BulkOfferCard";
import { ComboDealCard } from "./ComboDealCard";

type DealsTabType = "bulk" | "combo";

interface DealsContentGridProps {
  activeTab: DealsTabType;
  bulkOffers: BulkOffer[];
  comboDeals: ComboDeal[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const bulkGridClass =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5";

const comboGridClass =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5";

function LoadingGrid({ type }: { type: DealsTabType }) {
  const count = type === "bulk" ? 8 : 6;
  const gridClass = type === "bulk" ? bulkGridClass : comboGridClass;

  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`${type}-deal-loading-${index}`}
          className="h-80 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </div>
  );
}

function DealsNotice({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
}

export function DealsContentGrid({
  activeTab,
  bulkOffers,
  comboDeals,
  isLoading = false,
  isError = false,
  onRetry,
}: DealsContentGridProps) {
  if (isLoading) return <LoadingGrid type={activeTab} />;

  if (isError) {
    return (
      <DealsNotice
        title="Unable to load deals"
        description="Please try again shortly."
        onRetry={onRetry}
      />
    );
  }

  if (activeTab === "bulk") {
    if (bulkOffers.length === 0) {
      return (
        <DealsNotice
          title="No bulk offers available right now"
          description="Please check again shortly."
        />
      );
    }

    return (
      <div className={bulkGridClass}>
        {bulkOffers.map((offer) => (
          <BulkOfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    );
  }

  if (comboDeals.length === 0) {
    return (
      <DealsNotice
        title="No combo deals available right now"
        description="Please check again shortly."
      />
    );
  }

  return (
    <div className={comboGridClass}>
      {comboDeals.map((deal) => (
        <ComboDealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
