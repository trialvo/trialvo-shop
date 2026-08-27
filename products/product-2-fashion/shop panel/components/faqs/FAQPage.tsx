"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import Breadcrumbs from "../breadcrumb/Breadcrumbs";
import FAQAccordion from "./FAQAccordion";
import FAQCategoryNav from "./FAQCategoryNav";
import { FAQ_CATEGORIES } from "./faqs.data";

const FAQPage: React.FC = () => {
    const [activeId, setActiveId] = React.useState<string>(FAQ_CATEGORIES[0].id);

    const activeCategory =
        FAQ_CATEGORIES.find((c) => c.id === activeId) ?? FAQ_CATEGORIES[0];

    return (
        <div className="container mx-auto pb-6 max-[500px]:px-2 max-[500px]:pt-2">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ's" }]} />

            <Card className="rounded-none border-0 p-0 gap-3 shadow-none">
                <CardHeader className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] gap-0 px-4 py-2.5">
                    <h1 className="text-2xl font-bold text-black">FAQ&apos;s</h1>
                </CardHeader>

                <CardContent className="bg-white p-0">
                    <div className="grid grid-cols-12 gap-6 sm:gap-0">
                        <FAQCategoryNav
                            categories={FAQ_CATEGORIES}
                            activeId={activeId}
                            onChange={setActiveId}
                        />

                        <FAQAccordion category={activeCategory} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FAQPage;
