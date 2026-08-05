"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Home, Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TOPICS = [
  "Order Issue",
  "Return / Exchange",
  "Payment Problem",
  "Product Question",
  "Shipping & Delivery",
  "Account Help",
  "Other",
];

export default function ContactPage() {
  const [form, setForm]         = useState({ name: "", email: "", topic: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const isValid = form.name && form.email && form.topic && form.message;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-10">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors"><Home size={12} /> Home</Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">Contact Us</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-2">Contact Us</h1>
          <p className="text-[14px] text-muted-foreground">We're here to help. Reach out and we'll respond within 24 hours.</p>
        </div>

        {/* 8/4 grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* ── Form ── */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="border border-border p-10 text-center">
                <CheckCircle2 size={36} className="text-success mx-auto mb-4" />
                <h2 className="font-display text-xl font-bold text-foreground mb-2">Message Sent!</h2>
                <p className="text-[13px] text-muted-foreground mb-6">
                  Thanks, <span className="font-semibold text-foreground">{form.name}</span>.
                  We'll reply to <span className="font-semibold text-foreground">{form.email}</span> within 24 hours.
                </p>
                <button type="button"
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "", message: "" }); }}
                  className="text-[12px] font-semibold underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-[12px] font-semibold text-foreground mb-1.5 tracking-wide">
                      Full Name <span className="text-sale">*</span>
                    </label>
                    <input id="name" type="text" required placeholder="Ahmed Al Rashid"
                      value={form.name} onChange={set("name")}
                      className="w-full h-10 px-3 text-[13px] border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-[12px] font-semibold text-foreground mb-1.5 tracking-wide">
                      Email <span className="text-sale">*</span>
                    </label>
                    <input id="email" type="email" required placeholder="ahmed@example.com"
                      value={form.email} onChange={set("email")}
                      className="w-full h-10 px-3 text-[13px] border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors" />
                  </div>
                </div>

                <div>
                  <label htmlFor="topic" className="block text-[12px] font-semibold text-foreground mb-1.5 tracking-wide">
                    Topic <span className="text-sale">*</span>
                  </label>
                  <select id="topic" required value={form.topic} onChange={set("topic")}
                    className="w-full h-10 px-3 text-[13px] border border-border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors cursor-pointer appearance-none">
                    <option value="" disabled>Select a topic…</option>
                    {TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-[12px] font-semibold text-foreground mb-1.5 tracking-wide">
                    Message <span className="text-sale">*</span>
                  </label>
                  <textarea id="message" required rows={6} placeholder="Describe your issue or question…"
                    value={form.message} onChange={set("message")}
                    className="w-full px-3 py-2.5 text-[13px] border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors resize-none" />
                  <p className="text-[11px] text-muted-foreground mt-1 text-right">{form.message.length} / 1000</p>
                </div>

                <button type="submit" disabled={loading || !isValid}
                  className={cn(
                    "w-full h-10 flex items-center justify-center gap-2 text-[13px] font-semibold tracking-wide transition-all",
                    loading || !isValid
                      ? "bg-accent/30 text-accent-foreground cursor-not-allowed"
                      : "bg-accent text-accent-foreground hover:bg-accent/85 cursor-pointer"
                  )}>
                  {loading
                    ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Sending…</span>
                    : <><Send size={13} /> Send Message</>}
                </button>
              </form>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5 lg:col-span-4">

            {/* Contact info */}
            <div className="border border-border p-5 space-y-4">
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground">Get In Touch</p>
              {[
                { icon: Mail,   text: "hello@lifestyle.com",           href: "mailto:hello@lifestyle.com" },
                { icon: Phone,  text: "+971 4 123 4567",               href: "tel:+97141234567" },
                { icon: MapPin, text: "Dubai Mall, Downtown Dubai, UAE", href: null },
              ].map(({ icon: Icon, text, href }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon size={13} className="text-accent shrink-0 mt-0.5" />
                  {href
                    ? <a href={href} className="text-[13px] text-foreground/80 hover:text-foreground transition-colors">{text}</a>
                    : <span className="text-[13px] text-foreground/80">{text}</span>}
                </div>
              ))}
            </div>

            {/* Hours */}
            <div className="border border-border p-5 space-y-3">
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Clock size={11} /> Support Hours
              </p>
              {[
                { day: "Mon – Fri", hours: "9:00 AM – 7:00 PM" },
                { day: "Saturday",  hours: "10:00 AM – 5:00 PM" },
                { day: "Sunday",    hours: "Closed" },
              ].map(({ day, hours }) => (
                <div key={day} className="flex items-center justify-between gap-4">
                  <span className="text-[12px] text-muted-foreground">{day}</span>
                  <span className={cn("text-[12px] font-medium", hours === "Closed" ? "text-sale" : "text-foreground")}>
                    {hours}
                  </span>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">GST (UTC+4)</p>
            </div>

            {/* Quick links */}
            <div className="border border-border p-5 space-y-3">
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-muted-foreground">Quick Links</p>
              {[
                { label: "Track My Order",      href: "/orders" },
                { label: "FAQ",                 href: "/faq" },
                { label: "Returns & Exchanges", href: "/returns" },
                { label: "Privacy Policy",      href: "/privacy-policy" },
              ].map(({ label, href }) => (
                <Link key={label} href={href}
                  className="flex items-center justify-between text-[13px] text-foreground/70 hover:text-foreground transition-colors">
                  {label}
                  <ChevronRight size={12} className="opacity-40" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
