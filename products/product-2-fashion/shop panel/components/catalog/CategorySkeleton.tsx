import * as React from "react";

import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function CategorySkeleton(): React.ReactElement {
    const items = Array.from({ length: 10 });

    return (
        <section>
            <div className="grid grid-cols-2 gap-3 gap-y-6 min-[640px]:gap-4 min-[640px]:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                {items.map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </section>
    );
}
