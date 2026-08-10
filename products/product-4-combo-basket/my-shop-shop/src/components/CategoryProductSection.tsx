import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { toFrontendProduct } from "@/api/products";
import type { ApiProduct } from "@/api/products";

interface HomeSectionProps {
 category: {
  id: number;
  name: string;
  slug: string;
  color?: string;
  svg_icon?: string;
  icon?: string;
 };
 products: ApiProduct[];
}

export default function CategoryProductSection({ category, products }: HomeSectionProps) {
 const accentColor = category.color || "#e91e63";
 const frontendProducts = products.map(toFrontendProduct);

 if (!frontendProducts.length) return null;

 return (
  <section className="py-14">
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Section header */}
    <div className="mb-6 flex items-center justify-between">
     <div className="flex items-center gap-3">
      {/* Category icon */}
      <div
       className="flex h-10 w-10 items-center justify-center rounded-xl"
       style={{ background: `${accentColor}15`, color: accentColor }}
      >
       {category.svg_icon ? (
        <span
         className="flex h-5 w-5 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
         style={{ color: accentColor }}
         dangerouslySetInnerHTML={{ __html: category.svg_icon }}
        />
       ) : (
        <span className="text-lg">{category.icon || "📦"}</span>
       )}
      </div>
      <div>
       <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" style={{ color: accentColor }} />
        <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">
         {category.name}
        </h2>
       </div>
       <p className="text-xs text-slate-500 mt-0.5">
        এই কালেকশনের বিশেষ পণ্য সমূহ
       </p>
      </div>
     </div>
     <Link
      href={`/products?category=${category.slug}`}
      className="group flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
      style={{ borderColor: `${accentColor}40`, color: accentColor }}
     >
      সব দেখুন
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
     </Link>
    </div>

    {/* accent underline */}
    <div
     className="mb-8 h-0.5 w-12 rounded-full"
     style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}30)` }}
    />

    {/* Products grid */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
     {frontendProducts.map((product) => (
      <ProductCard key={product.id} product={product} />
     ))}
    </div>
   </div>
  </section>
 );
}
