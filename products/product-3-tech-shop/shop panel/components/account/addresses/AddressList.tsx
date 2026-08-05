"use client";

import type { ReactElement } from "react";
import { AddressCard } from "@/components/account/addresses/AddressCard";
import { toAddressViewModel } from "@/lib/adapters/accountAddress";
import type { AddressItem } from "@/lib/api/address/service";

type AddressListProps = Readonly<{
  addresses: AddressItem[];
  onEdit: (id: number) => void;
  onVerifyPhone: (phoneId: number, phoneLabel: string) => void;
  verifyingPhoneId: number | null;
  busyId: number | null;
}>;

export function AddressList({
  addresses,
  onEdit,
  onVerifyPhone,
  verifyingPhoneId,
  busyId,
}: AddressListProps): ReactElement {
  return (
    <div className="space-y-3 mb-4">
      {addresses.map((addr) => (
        <AddressCard
          key={addr.id}
          address={toAddressViewModel(addr)}
          onEdit={onEdit}
          onVerifyPhone={onVerifyPhone}
          verifyingPhoneId={verifyingPhoneId}
          busyId={busyId}
        />
      ))}
    </div>
  );
}
