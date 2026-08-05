export type SizeChartImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type ProductExtraSectionsData = {
  descriptionTitle?: string;
  description?: string;
  material?: string;
  comfortFit?: string;
  careInstructions?: string[];
  sku?: string;
  note?: string;

  sizeChartImage?: SizeChartImage;

  shippingPolicyTitle?: string;
  shippingPolicy?: string;
};
