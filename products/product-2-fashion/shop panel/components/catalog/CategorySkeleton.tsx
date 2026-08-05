import * as React from "react";

import ProductCardMobileSkeleton from "@/components/product/ProductCardMobileSkeleton";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function CategorySkeleton(): React.ReactElement {
    const items = Array.from({ length: 10 });

    return (
        <section className="container mx-auto mb-15.5">
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
