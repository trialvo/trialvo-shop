"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, ArrowRight, Check } from "lucide-react";
import { useSubmitContact } from "@/api/contact";
import { usePublicSiteSettings, DEFAULT_SITE_SETTINGS } from "@/api/siteSettings";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const submitMut = useSubmitContact();

  const { data } = usePublicSiteSettings();
  const s = data?.settings ?? DEFAULT_SITE_SETTINGS;

  const contactInfo = [
    { icon: MapPin, title: "ঠিকানা", detail: s.contact_address, color: "text-rose-600", bg: "bg-rose-50" },
    { icon: Phone, title: "ফোন", detail: s.contact_phone, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Mail, title: "ইমেইল", detail: s.contact_email, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Clock, title: "সময়সূচি", detail: s.contact_hours, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMut.mutate(
      { name: form.name, email: form.email, subject: form.subject, message: form.message },
      {
        onSuccess: () => {
          setSubmitted(true);
          setForm({ name: "", email: "", subject: "", message: "" });
        },
      }
    );
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-24 text-center text-white sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#e91e63]/10 blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/8 blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h1 className="animate-fade-in-up text-3xl font-bold sm:text-4xl lg:text-5xl">যোগাযোগ করুন</h1>
          <p className="animate-fade-in-up mt-4 text-sm text-slate-400 sm:text-base" style={{ animationDelay: "100ms" }}>
            আমরা আপনার কথা শুনতে চাই। যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন!
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="animate-fade-in-left shadow-card rounded-2xl bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-2.5">
                <Send className="h-5 w-5 text-[#e91e63]" />
                <h2 className="text-lg font-bold text-[#0f172a]">বার্তা পাঠান</h2>
              </div>
              <div className="section-divider !mx-0 mb-8"></div>

              {submitted ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0f172a]">বার্তা পাঠানো হয়েছে!</h3>
                  <p className="text-sm text-slate-500">আমরা ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করব।</p>
                  <button onClick={() => setSubmitted(false)} className="text-sm text-[#e91e63] hover:underline">
                    আরেকটি বার্তা পাঠান
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0f172a]">নাম *</label>
                      <input type="text" placeholder="আপনার নাম" required
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0f172a]">ইমেইল *</label>
                      <input type="email" placeholder="your@email.com" required
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f172a]">বিষয়</label>
                    <input type="text" placeholder="কীভাবে সাহায্য করতে পারি?"
                      value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f172a]">বার্তা *</label>
                    <textarea rows={5} placeholder="আপনার বার্তা লিখুন..." required
                      value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="input-field resize-none"></textarea>
                  </div>
                  {submitMut.error && (
                    <p className="text-sm text-red-500">কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।</p>
                  )}
                  <button type="submit" disabled={submitMut.isPending}
                    className="btn-pink flex items-center gap-2 py-3 text-sm sm:w-auto sm:px-8 disabled:opacity-60">
                    <Send className="h-4 w-4" />
                    {submitMut.isPending ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="stagger-children space-y-5">
            {contactInfo.map((info) => (
              <div key={info.title} className="shadow-card group hover:shadow-card-hover flex items-start gap-4 rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${info.bg} transition-transform duration-300 group-hover:scale-105`}>
                  <info.icon className={`h-5 w-5 ${info.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">{info.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{info.detail}</p>
                </div>
              </div>
            ))}

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${s.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp group flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm"
            >
              <MessageCircle className="h-5 w-5" />
              হোয়াটসঅ্যাপে মেসেজ করুন
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
