"use client";

import SafeImage from "@/components/ui/SafeImage";
import type { ReactElement } from "react";
import type { CategoryImageProps } from "./MegaMenuPanel.types";
import { getImageUrl } from "./MegaMenuPanel.utils";

export function CategoryImage({
  imagePath,
  alt,
  className,
}: Readonly<CategoryImageProps>): ReactElement {
  return <SafeImage src={getImageUrl(imagePath)} alt={alt} className={className} />;
}
