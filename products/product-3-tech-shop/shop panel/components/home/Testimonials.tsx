import { Star } from "lucide-react";
import { testimonials } from "@/data/products";
import { SectionHeader } from "@/components/shared/SectionHeader";

const Testimonials = () => (
  <section className="container py-12 md:py-16">
    <SectionHeader
      align="center"
      title="What Our Customers Say"
      subtitle="Trusted by thousands of happy customers across Bangladesh"
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {testimonials.map((t) => (
        <div
          key={t.id}
          className="bg-card rounded-sm border border-border p-4 hover:shadow-product-hover transition-shadow"
        >
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-warning text-warning"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            &quot;{t.text}&quot;
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              {t.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-medium">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.location}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Testimonials;
