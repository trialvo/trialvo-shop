"use client";

import CategoryGrid from "@/components/categories/CategoryGrid";
import { useCategory } from "@/hooks/useCategory";
import React from "react";

export type CategorySectionProps = {
    className?: string;
};

const CategorySection: React.FC<CategorySectionProps> = ({
    className = "",
}) => {
    const { childCategories, childCategoriesLoading, childTotal } = useCategory();

    return (
        <section className={`w-full bg-[#f4efe8] py-10 sm:py-14 max-[500px]:overflow-x-clip ${className}`}>
            <div className="container mx-auto px-2 md:px-0 max-[500px]:min-w-0">
                <CategoryGrid
                    items={childCategories}
                    isLoading={childCategoriesLoading}
                    total={childTotal}
                />
            </div>
        </section>
    );
};

export default CategorySection;
