import { Clock, FileText, HelpCircle, MessageSquare } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";
import type { MarketplaceLanguage } from "@/types/marketplace";

type Topic = {
  id: string;
  icon: typeof MessageSquare;
  title: { bn: string; en: string };
  body: { bn: string; en: string };
  points: { bn: string; en: string }[];
};

const TOPICS: Topic[] = [
  {
    id: "before-buying",
    icon: HelpCircle,
    title: {
      bn: "কেনার আগে প্রশ্ন",
      en: "Questions before buying",
    },
    body: {
      bn: "কোন প্রোডাক্ট আপনার ব্যবসার সাথে যায়, কী কী অন্তর্ভুক্ত, লাইসেন্স কীভাবে কাজ করে—এসব জানতে চাইলে লিখুন।",
      en: "Ask which product fits your business, what is included, and how the license works.",
    },
    points: [
      {
        bn: "আপনার ব্যবসার ধরন ও প্রোডাক্টের সংখ্যা",
        en: "Your type of business and roughly how many products",
      },
      {
        bn: "যে প্রোডাক্টটি নিয়ে ভাবছেন তার নাম বা লিংক",
        en: "The name or link of the product you are considering",
      },
      {
        bn: "কোনো নির্দিষ্ট ফিচার অবশ্যই দরকার কি না",
        en: "Whether any specific feature is a must-have",
      },
    ],
  },
  {
    id: "custom-work",
    icon: FileText,
    title: {
      bn: "কাস্টম কাজের কোটেশন",
      en: "A quote for custom work",
    },
    body: {
      bn: "নতুন ফিচার, ডিজাইন পরিবর্তন বা সম্পূর্ণ নতুন সফটওয়্যার—প্রয়োজনটা যত স্পষ্ট লিখবেন, কোটেশন তত নির্ভুল হবে।",
      en: "New features, design changes, or entirely new software — the clearer the requirement, the more accurate the quote.",
    },
    points: [
      {
        bn: "কী সমস্যার সমাধান চাচ্ছেন, সংক্ষেপে",
        en: "The problem you want solved, in brief",
      },
      {
        bn: "রেফারেন্স হিসেবে কোনো সাইট বা স্ক্রিনশট",
        en: "Any reference site or screenshot",
      },
      {
        bn: "সময়সীমা ও বাজেটের ধারণা থাকলে সেটি",
        en: "Your timeline and budget range, if you have one",
      },
    ],
  },
  {
    id: "after-purchase",
    icon: MessageSquare,
    title: {
      bn: "কেনার পর সাপোর্ট",
      en: "Support after purchase",
    },
    body: {
      bn: "সেটআপ, বাগ বা অ্যাডমিন প্যানেল ব্যবহারে সমস্যা হলে দ্রুত সমাধানের জন্য নিচের তথ্যগুলো দিন।",
      en: "For setup trouble, a bug, or a question about the admin panel, include the details below so it can be resolved quickly.",
    },
    points: [
      {
        bn: "অর্ডার আইডি বা কেনার সময় ব্যবহৃত ইমেইল",
        en: "Your order ID or the email used at purchase",
      },
      {
        bn: "সমস্যাটি ঠিক কোন পেজে এবং কী করলে হয়",
        en: "Which page it happens on, and what triggers it",
      },
      {
        bn: "এরর মেসেজের স্ক্রিনশট থাকলে সেটি",
        en: "A screenshot of the error message, if any",
      },
    ],
  },
];

/**
 * Guidance beside the contact form. Turning a bare form into a page that says
 * what to send cuts down on unanswerable one-line enquiries.
 */
export function ContactGuidance({
  language,
}: Readonly<{ language: MarketplaceLanguage }>) {
  const isBn = language === "bn";

  return (
    <Section
      labelledBy="contact-guidance-title"
      pattern="dots"
      divider="top"
    >
      <SectionIntro
        id="contact-guidance-title"
        className="mb-8 md:mb-10"
        eyebrow={isBn ? "যোগাযোগের গাইড" : "Contact guide"}
        title={
          isBn
            ? "মেসেজে কী কী লিখলে দ্রুত সঠিক উত্তর পাবেন"
            : "What to include so you get the right answer faster"
        }
        lead={
          isBn
            ? "আপনার প্রশ্নের ধরন অনুযায়ী নিচের তথ্যগুলো দিলে আমাদের পাল্টা প্রশ্ন করার দরকার হয় না—প্রথম উত্তরেই সমাধান দেওয়া সহজ হয়।"
            : "Including the details below for your kind of enquiry means we do not have to ask follow-up questions, and the first reply can actually solve it."
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <Surface
              as="article"
              key={topic.id}
              sheen
              className="flex h-full flex-col p-6"
            >
              <IconTile icon={Icon} />
              <h3 className="mt-5 font-display text-base font-bold leading-6 tracking-tight">
                {topic.title[language]}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {topic.body[language]}
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                {topic.points.map((point) => (
                  <li
                    key={point.en}
                    className="flex gap-2.5 text-[13px] leading-6 text-foreground/80"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.6875rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50"
                    />
                    <span>{point[language]}</span>
                  </li>
                ))}
              </ul>
            </Surface>
          );
        })}
      </div>

      <Surface
        sheen
        tone="muted"
        className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6 md:p-7"
      >
        <IconTile icon={Clock} size="lg" />
        <div>
          <h3 className="font-display text-base font-bold tracking-tight">
            {isBn ? "উত্তর কত সময়ে পাবেন" : "When to expect a reply"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isBn
              ? "কার্যদিবসে সাধারণত ২৪ ঘণ্টার মধ্যে প্রথম উত্তর দেওয়ার লক্ষ্য রাখি। প্রোডাক্ট অচল করে দেওয়া গুরুতর সমস্যা সর্বোচ্চ অগ্রাধিকার পায়। সাপোর্টে কী কী অন্তর্ভুক্ত তার পূর্ণ বিবরণ সাপোর্ট নীতিতে আছে।"
              : "We aim to send a first reply within 24 hours on working days, and issues that make a product unusable get the highest priority. The Support Policy sets out exactly what support covers."}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <LocalizedLink
              href="/faq"
              className="text-accent underline-offset-4 hover:underline"
            >
              {isBn ? "সাধারণ প্রশ্নোত্তর" : "Frequently asked questions"}
            </LocalizedLink>
            <LocalizedLink
              href="/support-policy"
              className="text-accent underline-offset-4 hover:underline"
            >
              {isBn ? "সাপোর্ট নীতি" : "Support Policy"}
            </LocalizedLink>
            <LocalizedLink
              href="/how-it-works"
              className="text-accent underline-offset-4 hover:underline"
            >
              {isBn ? "কীভাবে কাজ করে" : "How it works"}
            </LocalizedLink>
          </div>
        </div>
      </Surface>
    </Section>
  );
}

export default ContactGuidance;
