import * as React from "react";

import ProductCardMobileSkeleton from "@/components/product/ProductCardMobileSkeleton";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesClientSkeleton(): React.ReactElement {
    const items = Array.from({ length: 10 });

    return (
        <section className="container mx-auto mb-15.5">
            <div className="flex border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-4 flex-row w-full justify-between px-4 text-center mb-4">
                <div className="flex justify-center">
                    <Skeleton className="h-8 w-64 max-[501px]:h-7 max-[501px]:w-52 rounded-none bg-muted/60" />
                </div>

                <div className="mt-2 flex items-center justify-center gap-3">
                    <Skeleton className="h-4 w-14 rounded-none bg-muted/60" />
                    <Skeleton className="h-8 w-34 rounded-none bg-muted/60" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 gap-y-4 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
                {items.map((_, i) => (
                    <div key={i}>
                        <div className="block min-[501px]:hidden">
                            <ProductCardMobileSkeleton />
                        </div>

                        <div className="hidden min-[501px]:block">
                            <ProductCardSkeleton />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
