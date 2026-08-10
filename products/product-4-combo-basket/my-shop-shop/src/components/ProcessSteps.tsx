"use client";

import { useState } from "react";
import {
  Gift,
  ClipboardList,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    icon: Gift,
    number: "01",
    title: "পছন্দ করুন",
    titleEn: "Browse & Select",
    desc: "আমাদের বিশাল কালেকশন থেকে পছন্দের পণ্য বেছে নিন। সিঙ্গেল বা কম্বো — দুটোই পাবেন।",
    color: "#e91e63",
    glow: "rgba(233,30,99,0.15)",
    gradient: "from-pink-500 to-rose-500",
    bgLight: "rgba(233,30,99,0.08)",
  },
  {
    icon: ClipboardList,
    number: "02",
    title: "অর্ডার করুন",
    titleEn: "Place Your Order",
    desc: "কার্টে যোগ করুন এবং সহজ চেকআউট ফর্ম পূরণ করুন। মাত্র কয়েকটি ক্লিকেই সম্পন্ন।",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.15)",
    gradient: "from-violet-500 to-purple-600",
    bgLight: "rgba(124,58,237,0.08)",
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "কনফার্মেশন",
    titleEn: "Order Verified",
    desc: "আমাদের টিম আপনার অর্ডার ভেরিফাই করবে এবং প্যাকেজিং শুরু করবে। সর্বোচ্চ মান নিশ্চিত।",
    color: "#0284c7",
    glow: "rgba(2,132,199,0.15)",
    gradient: "from-sky-500 to-blue-600",
    bgLight: "rgba(2,132,199,0.08)",
  },
  {
    icon: Truck,
    number: "04",
    title: "ডেলিভারি",
    titleEn: "Fast Delivery",
    desc: "দ্রুত এবং নিরাপদ ডেলিভারি আপনার দরজায়। ট্র্যাকিং আপডেট পাবেন প্রতিটি ধাপে।",
    color: "#059669",
    glow: "rgba(5,150,105,0.15)",
    gradient: "from-emerald-500 to-green-600",
    bgLight: "rgba(5,150,105,0.08)",
  },
];

export default function ProcessSteps() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden py-24">
      {/* Dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)",
        }}
      />

      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Accent glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full blur-[120px]" style={{ background: "rgba(233,30,99,0.08)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-[120px]" style={{ background: "rgba(124,58,237,0.08)" }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-16 text-center">

          <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
            কিভাবে{" "}
            <span className="bg-gradient-to-r from-[#e91e63] to-pink-400 bg-clip-text text-transparent">
              অর্ডার করবেন?
            </span>
          </h2>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            মাত্র ৪টি সহজ ধাপে আপনার পণ্য পৌঁছে যাবে দরজায়
          </p>
        </div>

        {/* ── Steps ── */}
        <div className="relative">

          {/* Desktop connector line */}
          <div className="absolute top-14 left-[12.5%] right-[12.5%] hidden h-px lg:block"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 85%, transparent)",
            }}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveStep(idx)}
                  onMouseLeave={() => setActiveStep(null)}
                  className="group relative h-full cursor-default"
                >
                  {/* Card */}
                  <div
                    className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] p-6 text-center transition-all duration-500"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${step.bgLight}, rgba(255,255,255,0.04))`
                        : "rgba(255,255,255,0.03)",
                      boxShadow: isActive
                        ? `0 0 0 1px ${step.color}40, 0 20px 60px ${step.glow}`
                        : "none",
                      transform: isActive ? "translateY(-6px)" : "translateY(0)",
                    }}
                  >
                    {/* Step number badge */}
                    <div
                      className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold"
                      style={{
                        background: `linear-gradient(135deg, ${step.color}30, ${step.color}15)`,
                        color: step.color,
                        border: `1px solid ${step.color}25`,
                      }}
                    >
                      {step.number}
                    </div>

                    {/* Icon circle */}
                    <div
                      className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                        border: `1px solid ${step.color}25`,
                        boxShadow: isActive ? `0 0 24px ${step.glow}` : "none",
                      }}
                    >
                      {/* Pulsing ring on hover */}
                      {isActive && (
                        <span
                          className="absolute inset-0 animate-ping rounded-2xl opacity-20"
                          style={{ background: step.color }}
                        />
                      )}
                      <Icon
                        className="relative h-7 w-7 transition-all duration-300"
                        style={{ color: step.color }}
                      />
                    </div>

                    {/* Text */}
                    <h3
                      className="mb-1 text-base font-bold text-white transition-colors duration-300"
                      style={{ color: isActive ? step.color : "white" }}
                    >
                      {step.title}
                    </h3>
                    <p className="mb-3 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                      {step.titleEn}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {step.desc}
                    </p>

                    {/* Bottom accent bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl transition-all duration-500"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                        opacity: isActive ? 1 : 0,
                      }}
                    />
                  </div>

                  {/* Connector dot + arrow (between cards, desktop only) */}
                  {idx < steps.length - 1 && (
                    <div className="absolute top-14 -right-3 z-10 hidden -translate-y-1/2 lg:flex items-center justify-center">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0f172a] text-slate-500 transition-all duration-300"
                        style={{
                          boxShadow: isActive ? `0 0 12px ${step.glow}` : "none",
                          borderColor: isActive ? `${step.color}40` : undefined,
                          color: isActive ? step.color : undefined,
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </section>
  );
}
