"use client";

import PhoneCard from "@/components/account/phonebook/PhoneCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { FiTrash2 } from "react-icons/fi";
import type { PhoneCardProps } from "./types";

const NoIcon: React.FC<{ className?: string }> = () => null;

type Props = {
    item: PhoneCardProps;
    checked: boolean;

    onDelete?: (id: string | number) => void;
    onVerify?: (id: string | number, Phone?: string) => void;
    onMakeDefault?: (id: string | number) => void;
};

const PhoneSelectableCard: React.FC<Props> = ({
    item,
    checked,
    onDelete,
    onVerify,
    onMakeDefault,
}) => {
    const isDefault = item.is_default === 1;

    return (
        <div className="relative">
            <PhoneCard
                id={String(item.id)}
                phone={item.phone_number ?? ""}
                isVerified={item.is_verified}
                onVerify={onVerify}
                icon={NoIcon}
                checked={checked}
            />

            <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-3">
                <div className="">
                    {isDefault ? (
                        <span className="rounded-none bg-[#666666] px-1.5 py-0.5 text-xs font-medium text-white">
                            Default
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onMakeDefault?.(item.id)}
                            className={cn(
                                "rounded-none bg-[#EDEDED] px-2 py-1.5 text-xs font-medium text-black",
                                "cursor-pointer transition-all duration-300 hover:bg-black/10",
                            )}
                        >
                            Make It Default
                        </button>
                    )}
                </div>

                <div className="">
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn("h-8 w-8 rounded-[2px] p-0")}
                        onClick={() => onDelete?.(item.id)}
                        aria-label="Delete phone"
                    >
                        <FiTrash2 className="h-4 w-4 text-[#E52D2D]/90" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PhoneSelectableCard;
