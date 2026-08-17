import {
  Shield,
  Truck,
  CreditCard,
  RotateCcw,
  Headphones,
  Award,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const features = [
  {
    icon: Shield,
    title: "100% Authentic",
    desc: "All products are genuine with official warranty",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Nationwide delivery across Bangladesh",
  },
  {
    icon: CreditCard,
    title: "Cash on Delivery",
    desc: "Pay when you receive your product",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    desc: "7-day hassle-free return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Customer support via phone & chat",
  },
  {
    icon: Award,
    title: "Warranty Support",
    desc: "Official warranty on all products",
  },
];

const WhyChooseUs = () => (
  <section className="bg-secondary/50 py-12 md:py-16">
    <div className="container">
      <SectionHeader
        align="center"
        title="Why Choose Techshop?"
        subtitle="Your trusted tech partner in Bangladesh"
      />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {features.map((f, i) => (
          <div key={i} className="text-center group">
            <div className="mx-auto h-10 w-10 md:h-12 md:w-12 rounded-sm gradient-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-medium text-[11px] md:text-sm">{f.title}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
