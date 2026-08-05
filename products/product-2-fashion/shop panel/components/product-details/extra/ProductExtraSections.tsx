import * as React from "react";
import DescriptionSection from "./DescriptionSection";
import SizeChartSection from "./SizeChartSection";
import type { ProductExtraSectionsData } from "./types";

type Props = {
    data: ProductExtraSectionsData;
};

const ProductExtraSections: React.FC<Props> = ({ data }) => {
    return (
        <div className="w-full">
            <DescriptionSection
                title={data.descriptionTitle}
                description={data.description}
                material={data.material}
                comfortFit={data.comfortFit}
                careInstructions={data.careInstructions}
                sku={data.sku}
                note={data.note}
            />

            {
                data?.sizeChartImage && (
                    <SizeChartSection image={data.sizeChartImage} />
                )
            }
        </div>
    );
};

export default ProductExtraSections;
