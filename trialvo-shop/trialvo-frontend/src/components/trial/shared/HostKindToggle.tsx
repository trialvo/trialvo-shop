"use client";

import { HardDrive, Terminal } from "lucide-react";
import { trialCopy } from "@/lib/trial/copy";
import type { HostKind } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { ChoiceCard } from "./ChoiceCard";

/** VPS vs cPanel. Staff need this before they can deploy, so it is required on the own-hosting path. */
export function HostKindToggle({
  value,
  onChange,
  language,
}: Readonly<{
  value: HostKind | undefined;
  onChange: (v: HostKind) => void;
  language: MarketplaceLanguage;
}>) {
  const copy = trialCopy(language).domain;
  return (
    <div role="radiogroup" aria-label={copy.hostKindLabel} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <ChoiceCard
        compact
        selected={value === "vps"}
        onSelect={() => onChange("vps")}
        icon={Terminal}
        title={copy.hostKindVps}
        body={copy.hostKindVpsBody}
      />
      <ChoiceCard
        compact
        selected={value === "cpanel"}
        onSelect={() => onChange("cpanel")}
        icon={HardDrive}
        title={copy.hostKindCpanel}
        body={copy.hostKindCpanelBody}
      />
    </div>
  );
}

export default HostKindToggle;
