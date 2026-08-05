import type { Brand } from "@/lib/api/brand/service";
import { resolveMediaUrl } from "@/lib/media/url";

export type BrandViewModel = {
  id: number;
  name: string;
  image: string | null;
  href: string;
};

export function toBrandViewModel(brand: Brand): BrandViewModel {
  return {
    id: brand.id,
    name: brand.name,
    image: brand.img_path ? resolveMediaUrl(brand.img_path) : null,
    href: `/shop?brand=${encodeURIComponent(brand.name)}`,
  };
}
