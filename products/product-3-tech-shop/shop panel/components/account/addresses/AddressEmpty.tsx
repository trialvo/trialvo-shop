"use client";

import type { ReactElement } from "react";
import { MapPin } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";

type AddressEmptyProps = Readonly<{
  onAdd: () => void;
}>;

export function AddressEmpty({ onAdd }: AddressEmptyProps): ReactElement {
  return (
    <div className="text-center py-8">
      <MapPin
        className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40"
        aria-hidden
      />
      <p className="text-muted-foreground text-sm mb-4">
        No addresses saved yet.
      </p>
      <AppButton variant="outline" className="text-sm cursor-pointer" onClick={onAdd}>
        Add Address
      </AppButton>
    </div>
  );
}
