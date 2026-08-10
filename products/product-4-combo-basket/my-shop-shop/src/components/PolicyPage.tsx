import Link from "next/link";
import { LucideIcon, ArrowLeft } from "lucide-react";

interface Section {
 heading: string;
 body: string[];
}

interface PolicyPageProps {
 icon: LucideIcon;
 accentColor: string;
 badge: string;
 title: string;
 subtitle: string;
 lastUpdated: string;
 sections: Section[];
}

export default function PolicyPage({
 icon: Icon,
 accentColor,
 badge,
 title,
 subtitle,
 lastUpdated,
 sections,
}: PolicyPageProps) {
 return (
  <div className="min-h-screen bg-white">

   {/* ── Slim top accent bar ── */}
   <div className={`h-1 w-full ${accentColor}`} />

   {/* ── Hero ── */}
   <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-14 text-center">
    <div className="mx-auto max-w-xl">
     <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm`}>
      <Icon className="h-5 w-5 text-slate-500" />
     </div>
     <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{badge}</p>
     <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">{title}</h1>
     <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
     <p className="mt-4 text-[11px] text-slate-400">সর্বশেষ আপডেট: {lastUpdated}</p>
    </div>
   </div>

   {/* ── Content ── */}
   <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

    {/* Back link */}
    <Link
     href="/"
     className="mb-10 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-[#e91e63]"
    >
     <ArrowLeft className="h-3.5 w-3.5" /> হোমে ফিরুন
    </Link>

    {/* Sections */}
    <div className="divide-y divide-slate-100">
     {sections.map((sec, i) => (
      <div key={i} className="py-8 first:pt-0">
       <h2 className="mb-3 text-sm font-bold text-[#0f172a]">
        {String(i + 1).padStart(2, "0")}. {sec.heading}
       </h2>
       <div className="space-y-2.5">
        {sec.body.map((para, j) => (
         <p key={j} className="text-sm leading-relaxed text-slate-500">
          {para}
         </p>
        ))}
       </div>
      </div>
     ))}
    </div>

    {/* Footer note */}
    <div className="mt-12 border-t border-slate-100 pt-8">
     <p className="text-center text-sm text-slate-400">
      প্রশ্ন থাকলে —{" "}
      <a
       href="mailto:hello@combobasket.com"
       className="font-medium text-[#e91e63] hover:underline"
      >
       hello@combobasket.com
      </a>
     </p>
     <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-slate-400">
      {[
       { href: "/terms", label: "শর্তাবলী" },
       { href: "/privacy", label: "গোপনীয়তা" },
       { href: "/cookies", label: "কুকি" },
       { href: "/refund", label: "রিফান্ড" },
      ].map((l) => (
       <Link key={l.href} href={l.href} className="hover:text-[#e91e63] transition-colors">
        {l.label}
       </Link>
      ))}
     </div>
    </div>
   </div>
  </div>
 );
}
