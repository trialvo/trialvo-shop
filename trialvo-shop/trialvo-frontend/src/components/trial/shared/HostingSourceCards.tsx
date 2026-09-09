"use client";

import { Server, ShoppingBag } from "lucide-react";
import { trialCopy } from "@/lib/trial/copy";
import type { HostingSource } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { ChoiceCard } from "./ChoiceCard";

/**
 * The hosting gate. An own-domain trial can only be deployed somewhere, so the
 * customer must tell us: their server, or one they buy from us.
 */
export function HostingSourceCards({
  value,
  onChange,
  language,
  purchaseEnabled,
}: Readonly<{
  value: HostingSource | undefined;
  onChange: (v: HostingSource) => void;
  language: MarketplaceLanguage;
  purchaseEnabled: boolean;
}>) {
  const copy = trialCopy(language).domain;
  return (
    <div role="radiogroup" aria-label={copy.hostingQuestion} className="grid gap-2.5">
      <ChoiceCard
        selected={value === "own"}
        onSelect={() => onChange("own")}
        icon={Server}
        title={copy.hostingOwnTitle}
        body={copy.hostingOwnBody}
        compact
      />
      <ChoiceCard
        selected={value === "buy_from_trialvo"}
        onSelect={() => onChange("buy_from_trialvo")}
        icon={ShoppingBag}
        title={copy.hostingBuyTitle}
        body={purchaseEnabled ? copy.hostingBuyBody : copy.purchaseDisabled}
        compact
        disabled={!purchaseEnabled}
      />
    </div>
  );
}

export default HostingSourceCards;
