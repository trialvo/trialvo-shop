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
    <Card className="gap-4 rounded-md border border-[#E5E5E5] bg-white p-4! shadow-none transition-shadow duration-200 ease-out hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] pb-3">
        <h3 className="text-[15px] font-semibold text-black">
          {t("account.addressBook.title")}
        </h3>

        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-md border-[#D6D6D6] px-3 text-sm font-medium text-black transition-[border-color,background-color,color] duration-200 ease-out hover:border-black hover:bg-black hover:text-white"
          onClick={handleActionClick}
        >
          {hasAddress ? t("account.addressBook.edit") : t("account.addressBook.add")}
        </Button>
      </div>

      <div>
        <div className="text-xs text-black/50">
          {t("account.addressBook.defaultAddress")}
        </div>

        {!hasAddress ? (
          <div className="mt-3 rounded-md border border-dashed border-black/15 p-3">
            <div className="text-sm font-medium text-black">
              {t("account.addressBook.noAddress")}
            </div>
            <div className="mt-1 text-xs text-black/60">
              {t("account.addressBook.noAddressDesc")}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-black">
              {addressBook.name}

              <Badge
                asChild
                variant="secondary"
                className="rounded-sm bg-[#F3F3F3] text-xs font-normal capitalize text-black/80"
              >
                {labelMap[addressBook.address_type]}
              </Badge>
            </div>

            <div className="mt-1.5 text-sm leading-relaxed text-black/70">
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
