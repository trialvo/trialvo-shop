import Link from "next/link";
import { Home, Package, Search, Phone, ArrowRight, Frown } from "lucide-react";

const quickLinks = [
  { href: "/", label: "হোম পেজ", icon: Home },
  { href: "/products", label: "সব পণ্য", icon: Package },
  { href: "/search", label: "পণ্য খুঁজুন", icon: Search },
  { href: "/contact", label: "যোগাযোগ করুন", icon: Phone },
];

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f8f9fc] px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        {/* Big 404 with animated design */}
        <div className="relative mb-8 inline-block">
          {/* Floating ring decorations */}
          <div
            className="absolute -inset-8 animate-pulse rounded-full bg-[#e91e63]/5"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute -inset-4 animate-pulse rounded-full bg-[#e91e63]/8"
            style={{ animationDuration: "2s", animationDelay: "500ms" }}
          />

          <div className="shadow-card relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-pink-50 to-purple-50">
            <div>
              <p className="text-5xl leading-none font-black tracking-tight text-[#e91e63]">
                404
              </p>
              <div className="mt-1 flex justify-center">
                <Frown className="h-8 w-8 text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="animate-fade-in-up text-2xl font-bold text-[#0f172a] sm:text-3xl">
          পেজটি খুঁজে পাওয়া যায়নি!
        </h1>
        <p
          className="animate-fade-in-up mt-3 text-sm leading-relaxed text-slate-500"
          style={{ animationDelay: "100ms" }}
        >
          আপনি যে পেজটি খুঁজছেন সেটি সরিয়ে নেওয়া হয়েছে, মুছে দেওয়া হয়েছে
          অথবা কখনো ছিল না।
        </p>

        {/* Quick Links */}
        <div
          className="animate-fade-in-up mt-8 grid grid-cols-2 gap-3"
          style={{ animationDelay: "200ms" }}
        >
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="shadow-card group hover:shadow-card-hover flex items-center gap-2.5 rounded-xl bg-white p-3.5 text-sm font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:text-[#e91e63]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-[#e91e63]/10">
                  <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-[#e91e63]" />
                </div>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Primary CTA */}
        <Link
          href="/"
          className="btn-pink animate-fade-in-up mt-6 inline-flex items-center gap-2 px-8 py-3.5 text-sm"
          style={{ animationDelay: "300ms" }}
        >
          <Home className="h-4 w-4" />
          হোমে ফিরে যান
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
