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
    const { childCategories, childCategoriesLoading } = useCategory();

    return (
        <section className={`w-full ${className}`}>
            <div className="container mx-auto">
                <CategoryGrid items={childCategories} isLoading={childCategoriesLoading}/>
            </div>
        </section>
    );
};

export default CategorySection;
