"use client";

import type { ReactElement } from "react";
import type { CheckoutDeliveryAddress } from "@/lib/adapters/checkoutOrderResult";

type CheckoutDeliveryAddressInfoProps = Readonly<{
  address: CheckoutDeliveryAddress;
}>;

/** Graduate DeliveryAddressInfo grid. */
export function CheckoutDeliveryAddressInfo({
  address,
}: CheckoutDeliveryAddressInfoProps): ReactElement {
  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-black">Delivery address</h3>
      <div className="grid grid-cols-1 gap-y-2 text-sm text-black sm:grid-cols-[180px_1fr]">
        <div>
          <div className="font-semibold">Name</div>
          <div>{address.name}</div>
        </div>
        <div>
          <div className="font-semibold">Address</div>
          <div>{address.address}</div>
        </div>
        <div>
          <div className="font-semibold">Mobile</div>
          <div>{address.mobile}</div>
        </div>
        <div>
          <div className="font-semibold">Email</div>
          <div>{address.email}</div>
        </div>
      </div>
    </div>
  );
}
