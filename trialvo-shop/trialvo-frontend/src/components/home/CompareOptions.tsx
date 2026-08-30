import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { localize } from "@/lib/localize";
import { cn } from "@/lib/utils";
import { Section, SectionIntro, Surface } from "@/components/section";
import type { LocalizedString } from "@/types/marketplace";

type Column = {
  id: string;
  label: LocalizedString;
  highlight?: boolean;
};

type Row = {
  id: string;
  label: LocalizedString;
  values: Record<string, LocalizedString>;
};

const COLUMNS: Column[] = [
  { id: "trialvo", label: { bn: "Trialvo Shop রেডিমেড", en: "Trialvo Shop ready-made" }, highlight: true },
  { id: "custom", label: { bn: "শুরু থেকে কাস্টম বিল্ড", en: "Custom build from scratch" } },
  { id: "saas", label: { bn: "মাসিক সাবস্ক্রিপশন প্ল্যাটফর্ম", en: "Monthly subscription platform" } },
];

const ROWS: Row[] = [
  {
    id: "cost",
    label: { bn: "খরচের ধরন", en: "Cost model" },
    values: {
      trialvo: { bn: "এককালীন পেমেন্ট", en: "One-time payment" },
      custom: { bn: "উচ্চ প্রাথমিক খরচ", en: "High upfront cost" },
      saas: { bn: "প্রতি মাসে চলমান ফি", en: "Recurring monthly fee" },
    },
  },
  {
    id: "time",
    label: { bn: "লাইভ হতে সময়", en: "Time to go live" },
    values: {
      trialvo: { bn: "কয়েক দিন", en: "A few days" },
      custom: { bn: "কয়েক সপ্তাহ থেকে মাস", en: "Weeks to months" },
      saas: { bn: "দ্রুত, তবে সীমিত কাঠামোয়", en: "Fast, but inside their structure" },
    },
  },
  {
    id: "source",
    label: { bn: "সোর্স কোড", en: "Source code" },
    values: {
      trialvo: { bn: "সম্পূর্ণ কোড আপনার", en: "Fully yours" },
      custom: { bn: "চুক্তি অনুযায়ী", en: "Depends on the contract" },
      saas: { bn: "পাওয়া যায় না", en: "Not available" },
    },
  },
  {
    id: "customize",
    label: { bn: "কাস্টমাইজেশনের স্বাধীনতা", en: "Freedom to customise" },
    values: {
      trialvo: { bn: "কোড লেভেল পর্যন্ত", en: "Down to the code level" },
      custom: { bn: "সম্পূর্ণ, তবে ব্যয়বহুল", en: "Complete, but expensive" },
      saas: { bn: "থিম ও প্লাগইনের সীমায়", en: "Limited to themes and plugins" },
    },
  },
  {
    id: "trial",
    label: { bn: "কেনার আগে যাচাই", en: "Verify before committing" },
    values: {
      trialvo: { bn: "লাইভ ট্রায়াল", en: "Live trial" },
      custom: { bn: "সম্ভব নয়", en: "Not possible" },
      saas: { bn: "সীমিত ফ্রি ট্রায়াল", en: "Limited free trial" },
    },
  },
  {
    id: "support",
    label: { bn: "সাপোর্টের মেয়াদ", en: "Support duration" },
    values: {
      trialvo: { bn: "আজীবন, ফি ছাড়া", en: "Lifetime, no fee" },
      custom: { bn: "নির্দিষ্ট মেয়াদ, পরে চুক্তি", en: "Fixed term, then a contract" },
      saas: { bn: "সাবস্ক্রিপশন চালু থাকলে", en: "Only while subscribed" },
    },
  },
  {
    id: "lockin",
    label: { bn: "ভেন্ডর লক-ইন", en: "Vendor lock-in" },
    values: {
      trialvo: { bn: "নেই", en: "None" },
      custom: { bn: "ডেভেলপারের উপর নির্ভরতা", en: "Dependent on the developer" },
      saas: { bn: "প্ল্যাটফর্ম ছাড়লে সব হারায়", en: "Leaving means losing everything" },
    },
  },
  {
    id: "ownership",
    label: { bn: "দীর্ঘমেয়াদে মালিকানা", en: "Long-term ownership" },
    values: {
      trialvo: { bn: "সম্পূর্ণ আপনার", en: "Entirely yours" },
      custom: { bn: "আপনার, খরচের বিনিময়ে", en: "Yours, at a price" },
      saas: { bn: "ভাড়া করা", en: "Rented" },
    },
  },
];

/**
 * Ready-made vs custom build vs SaaS. Captures comparison-intent search
 * queries and gives buyers the decision framing in one table.
 */
export function CompareOptions() {
  const { language } = useLanguage();

  return (
    <Section labelledBy="compare-title" divider="top">
      <SectionIntro
        id="compare-title"
        eyebrow={language === "bn" ? "তুলনা করে দেখুন" : "Compare the options"}
        title={
          language === "bn"
            ? "রেডিমেড, কাস্টম বিল্ড, নাকি মাসিক সাবস্ক্রিপশন?"
            : "Ready-made, custom build, or monthly subscription?"
        }
        lead={
          language === "bn"
            ? "অনলাইন শপ চালু করার তিনটি সাধারণ পথ আছে, আর প্রতিটির নিজস্ব সুবিধা-অসুবিধা। খরচ, সময়, মালিকানা ও দীর্ঘমেয়াদি নিয়ন্ত্রণ — চারটি দিক পাশাপাশি রেখে দেখুন কোনটি আপনার ব্যবসার জন্য মানানসই।"
            : "There are three common routes to launching an online shop, each with real trade-offs. Put cost, time, ownership, and long-term control side by side and see which one fits your business."
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
      >
        <Surface sheen className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left">
              <caption className="sr-only">
                {language === "bn"
                  ? "রেডিমেড ইকমার্স সলিউশন, কাস্টম ডেভেলপমেন্ট ও সাবস্ক্রিপশন প্ল্যাটফর্মের তুলনা"
                  : "Comparison of ready-made ecommerce solutions, custom development, and subscription platforms"}
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th
                    scope="col"
                    className="px-5 py-5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]"
                  >
                    {language === "bn" ? "বিবেচ্য বিষয়" : "What to weigh"}
                  </th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.id}
                      scope="col"
                      className={cn(
                        "px-5 py-5 align-bottom tracking-tight",
                        column.highlight
                          ? // Accent cap + tint marks the recommended column
                            // without needing a heavier treatment.
                            "relative bg-accent/[0.07] text-sm font-bold text-foreground before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-accent"
                          : "text-sm font-semibold text-muted-foreground",
                      )}
                    >
                      {column.highlight ? (
                        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-accent-strong sm:text-[10px]">
                          {language === "bn" ? "প্রস্তাবিত" : "Recommended"}
                        </span>
                      ) : null}
                      {localize(column.label, language)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/60 last:border-b-0",
                      index % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    <th
                      scope="row"
                      className="px-5 py-4 text-sm font-semibold tracking-tight text-foreground"
                    >
                      {localize(row.label, language)}
                    </th>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-5 py-4 text-sm leading-6",
                          column.highlight
                            ? "bg-accent/[0.07] font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {column.highlight ? (
                          <span className="flex items-start gap-2">
                            <Check
                              className="mt-1 h-3.5 w-3.5 shrink-0 text-accent"
                              aria-hidden="true"
                            />
                            {localize(row.values[column.id], language)}
                          </span>
                        ) : (
                          localize(row.values[column.id], language)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </motion.div>

      <p className="mt-6 max-w-3xl text-[13px] leading-6 text-muted-foreground">
        {language === "bn"
          ? "কাস্টম বিল্ড খারাপ পথ নয় — অনন্য ব্যবসায়িক প্রক্রিয়া থাকলে সেটিই সঠিক। আমরা কাস্টম ডেভেলপমেন্টও করি। তবে সাধারণ ইকমার্স প্রয়োজনে রেডিমেড সলিউশন অনেক কম সময়ে ও খরচে একই ফল দেয়।"
          : "A custom build is not the wrong choice — for genuinely unique business processes it is the right one, and we do custom development too. But for standard ecommerce needs, a ready-made solution reaches the same result in far less time and cost."}
      </p>
    </Section>
  );
}

export default CompareOptions;
