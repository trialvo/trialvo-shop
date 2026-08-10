"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, MessageCircle, Phone, Mail, ArrowRight, Search, Package, CreditCard, Truck, RefreshCw } from "lucide-react";
import { useFAQs } from "@/api/faqs";

const FAQ_CATEGORIES = [
  { id: "delivery", label: "ডেলিভারি", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100" },
  { id: "payment", label: "পেমেন্ট", icon: CreditCard, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "orders", label: "অর্ডার", icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "returns", label: "রিটার্ন", icon: RefreshCw, color: "text-orange-600", bg: "bg-orange-100" },
];

function AccordionItem({ question, answer, isOpen, onToggle }: {
  question: string; answer: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-200 ${isOpen ? "border-[#e91e63]/30 bg-[#e91e63]/3" : "border-slate-100 bg-white hover:border-slate-200"}`}>
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left">
        <span className={`text-sm leading-relaxed font-semibold ${isOpen ? "text-[#e91e63]" : "text-[#0f172a]"}`}>
          {question}
        </span>
        <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#e91e63]" : "text-slate-400"}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-slate-500">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { data, isLoading } = useFAQs();
  const [activeCategory, setActiveCategory] = useState("delivery");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const allFaqs = data?.faqs || [];

  const filteredFaqs = searchQuery
    ? allFaqs.filter(f =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allFaqs;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-20 text-center text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#e91e63]/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-purple-500/8 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e91e63]/20">
            <HelpCircle className="h-7 w-7 text-[#e91e63]" />
          </div>
          <h1 className="animate-fade-in-up text-3xl font-bold sm:text-4xl">সাধারণ জিজ্ঞাসা</h1>
          <p className="animate-fade-in-up mt-3 text-sm text-slate-400" style={{ animationDelay: "80ms" }}>
            আপনার প্রশ্নের উত্তর পান
          </p>
          {/* Search */}
          <div className="animate-fade-in-up relative mx-auto mt-6 max-w-lg" style={{ animationDelay: "160ms" }}>
            <Search className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="প্রশ্ন খুঁজুন..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 py-3.5 pr-4 pl-11 text-sm text-white outline-none placeholder:text-slate-400 focus:border-white/40 focus:bg-white/15"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category tabs */}
        {!searchQuery && (
          <div className="animate-fade-in-up mb-8 flex flex-wrap gap-3">
            {FAQ_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive ? "bg-[#0f172a] text-white shadow-sm" : "shadow-card bg-white text-slate-600 hover:text-[#e91e63]"
                    }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md ${isActive ? "bg-white/20" : cat.bg}`}>
                    <Icon className={`h-3 w-3 ${isActive ? "text-white" : cat.color}`} />
                  </div>
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {searchQuery && (
          <p className="animate-fade-in-up mb-5 text-sm text-slate-500">
            &ldquo;{searchQuery}&rdquo; — {filteredFaqs.length}টি ফলাফল পাওয়া গেছে
          </p>
        )}

        {/* FAQ Accordion */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : (
          <div className="animate-fade-in-up space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="shadow-card rounded-2xl bg-white py-16 text-center">
                <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">কোনো প্রশ্ন পাওয়া যায়নি।</p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <AccordionItem
                  key={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))
            )}
          </div>
        )}

        {/* Contact CTA */}
        <div className="animate-fade-in-up mt-12 rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 text-center text-white">
          <h3 className="text-xl font-bold">আরও সাহায্য দরকার?</h3>
          <p className="mt-2 text-sm text-slate-400">আমাদের সাপোর্ট টিম সর্বদা আপনার পাশে আছে।</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/8801234567890" className="btn-whatsapp flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
              <MessageCircle className="h-4 w-4" /> হোয়াটসঅ্যাপ
            </a>
            <a href="tel:+8801234567890" className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20">
              <Phone className="h-4 w-4" /> ফোন করুন
            </a>
            <Link href="/contact" className="flex items-center gap-2 rounded-xl bg-[#e91e63] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#c2185b]">
              <Mail className="h-4 w-4" /> মেসেজ দিন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
