"use client";

import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";
import type { FeatureItemData } from "./types";

type Props = {
    item: FeatureItemData;
};

const FeatureItem: React.FC<Props> = ({ item }) => {
    return (
        <div className="space-y-3">
            <div className="relative h-17.5 w-20.75 overflow-hidden mb-7.5">
                <ImageWithFallback
                    src={item.icon ?? ""}
                    alt="feature icon"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 520px"
                />
            </div>

            <h3 className={cn("text-base font-bold text-black")}>{item.title}</h3>

            <p className="text-sm leading-6 text-black/70">{item.description}</p>
        </div>
    );
};

export default FeatureItem;
