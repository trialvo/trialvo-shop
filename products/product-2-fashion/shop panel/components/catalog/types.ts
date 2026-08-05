import { ColorValue } from "../color-selector/types";
import { SizeValue } from "../size-selector/types";

export type SortValue = 
  | "featured"       
  | "name_asc"        
  | "name_desc"       
  | "price_asc"       
  | "price_desc"      
  | "date_asc"        
  | "date_desc"       
  | string;           

export type Product = {
  id: number;
  slug: string;
  title: string;

  price: number;
  oldPrice?: number;

  imageSrc: string;
  images: string[];

  stock: number;
  sizes: readonly SizeValue[];

  colors:readonly ColorValue[];
};

export type CheckboxOption = {
  value: string;
  label: string;
};