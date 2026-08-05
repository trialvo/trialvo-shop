import { ColorValue } from "@/components/color-selector/types";
import { SizeValue } from "@/components/size-selector/types";

export type QuickProductImage = {
  id: number;
  path: string;
}

export type QuickAddProduct = {
  id: string;
  title: string;

  price: number;
  oldPrice?: number;

  images: QuickProductImage[];
  sizes: readonly SizeValue[];
  colors: readonly ColorValue[];

  stock: number;
  currency?: string;
};
