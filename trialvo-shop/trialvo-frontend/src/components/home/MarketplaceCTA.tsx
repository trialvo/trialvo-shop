import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

/** Closing marketplace CTA before footer */
export function MarketplaceCTA() {
  const { language } = useLanguage();

  return (
    <section className="border-t border-border bg-muted/40 py-12 md:py-14">
      <div className="container-custom">
        <motion.div
          className="flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-card px-6 py-8 shadow-sm md:flex-row md:items-center md:px-10 md:py-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {language === "bn"
                ? "রেডিমেড ডিজিটাল সলিউশন খুঁজুন"
                : "Browse ready-made digital solutions"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {language === "bn"
                ? "ইকমার্স টেমপ্লেট ও অ্যাডমিন প্যানেল—ট্রায়াল করে কিনুন।"
                : "Ecommerce templates and admin panels—trial first, then buy."}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-11 rounded-md bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/products">
              {language === "bn" ? "মার্কেটপ্লেস খুলুন" : "Open marketplace"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default MarketplaceCTA;
