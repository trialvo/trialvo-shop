import { redirect } from "next/navigation";
import { buildShopCategoryHref } from "@/lib/shop/categoryRoutes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

/**
 * Legacy route compatibility for old banner/deep links:
 *   /category/US.POLO%20MEN'S%20DENIM%20PANT?childId=71
 * → /shop?category=uspolo-mens-denim-pant
 */
export default async function LegacyCategoryRedirect({ params }: Props) {
  const { slug: segments = [] } = await params;
  const rawName = segments
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    })
    .join(" ")
    .trim();

  redirect(rawName ? buildShopCategoryHref(rawName) : "/shop");
}
