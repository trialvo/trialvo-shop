import type { ColorValue } from "@/components/color-selector/types";
import type { SizeValue } from "@/components/size-selector/types";

export type MultiAddProduct = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  currency?: string;
  imageSrc: string;

  stock: number;
  sizes: SizeValue[];
  colors: ColorValue[];
};

export type MultiAddLinePayload = {
  productId: string;
  size: SizeValue;
  color: ColorValue;
  quantity: number;
};

export type MultiAddSubmitPayload = {
  lines: MultiAddLinePayload[];
};
