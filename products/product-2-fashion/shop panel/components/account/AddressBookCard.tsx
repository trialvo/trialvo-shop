"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import React from "react";
import AddressBookCardSkeleton from "./AddressBookCardSkeleton";
import type { Address } from "./types";

type Props = {
  addressBook: Address | null;
  isLoading?: boolean;
  onEdit: () => void;
  skeletonMinMs?: number;
};

const AddressBookCard: React.FC<Props> = ({
  addressBook,
  isLoading = false,
  onEdit,
  skeletonMinMs = 100,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const labelMap: Record<Address["address_type"], string> = {
    home: t("breadcrumb.home"),
    office: "Office",
    "n/a": "N/A",
  };

  const [bootSkeleton, setBootSkeleton] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setBootSkeleton(false), skeletonMinMs);
    return () => window.clearTimeout(timer);
  }, [skeletonMinMs]);

  const showSkeleton = bootSkeleton || isLoading;

  if (showSkeleton) {
    return <AddressBookCardSkeleton />;
  }

  const hasAddress = addressBook !== null;

  const handleActionClick = () => {
    if (hasAddress) {
      onEdit();
      return;
    }
    router.push("/account/address");
  };

  return (
    <Card className="rounded-none border-0 bg-white p-4! shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t("account.addressBook.title")}</h3>

        <Button
          type="button"
          variant="outline"
          className="h-7 rounded-none border-[#999999] px-4 py-2 text-sm font-medium text-[#272727]"
          onClick={handleActionClick}
        >
          {hasAddress ? t("account.addressBook.edit") : t("account.addressBook.add")}
        </Button>
      </div>

      <div className="pb-3">
        <div className="text-xs tracking-wide text-black/50">{t("account.addressBook.defaultAddress")}</div>

        {!hasAddress ? (
          <div className="mt-3 rounded border border-dashed border-black/20 p-3">
            <div className="text-sm font-medium text-black">{t("account.addressBook.noAddress")}</div>
            <div className="mt-1 text-xs text-black/60">
              {t("account.addressBook.noAddressDesc")}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2 flex items-center gap-2 text-base font-semibold">
              {addressBook.name}

              <Badge
                asChild
                variant="secondary"
                className="rounded-none bg-[#D9EFFF] text-xs font-normal capitalize"
              >
                {labelMap[addressBook.address_type]}
              </Badge>
            </div>

            <div className="mt-1 text-sm text-black/80">
              {addressBook.full_address}
              {(addressBook.city || addressBook.zip_code) && (
                <>
                  <br />
                  {addressBook.city}
                  {addressBook.city && addressBook.zip_code ? ", " : ""}
                  {addressBook.zip_code}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default AddressBookCard;
