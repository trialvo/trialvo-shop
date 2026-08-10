"use client";

import {
  Gem, Rocket, Heart, Lock, Users, TrendingUp, Award, Target,
  Briefcase, Code, Palette, Shield, Star, Globe, Zap, LucideIcon,
} from "lucide-react";
import { usePublicSiteSettings, DEFAULT_SITE_SETTINGS, SiteSettingsData } from "@/api/siteSettings";

// ── Icon resolver (string → Lucide component) ──────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Gem, Rocket, Heart, Lock, Users, TrendingUp, Award, Target,
  Briefcase, Code, Palette, Shield, Star, Globe, Zap,
};
function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Star;
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: LucideIcon }) {
  return (
    <div className="shadow-card group hover:shadow-card-hover rounded-2xl bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-5 w-5 text-[#e91e63]" />
      </div>
      <p className="text-2xl font-bold text-[#e91e63]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

// ── Value card ─────────────────────────────────────────────────────────────────
function ValueCard({ icon, title, desc, bg, iconColor }: {
  icon: string; title: string; desc: string; bg: string; iconColor: string;
}) {
  const Icon = resolveIcon(icon);
  return (
    <div className="shadow-card group hover:shadow-card-hover rounded-2xl bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1">
      <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${bg} transition-all duration-300 group-hover:scale-105`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <h3 className="text-sm font-bold text-[#0f172a]">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

// ── Team card ──────────────────────────────────────────────────────────────────
function TeamCard({ name, role, icon }: { name: string; role: string; icon: string }) {
  const Icon = resolveIcon(icon);
  return (
    <div className="shadow-card group hover:shadow-card-hover rounded-2xl bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-7 w-7 text-[#e91e63]" />
      </div>
      <h3 className="text-sm font-bold text-[#0f172a]">{name}</h3>
      <p className="text-xs text-slate-500">{role}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { data } = usePublicSiteSettings();
  const s: SiteSettingsData = data?.settings ?? DEFAULT_SITE_SETTINGS;

  const stats = (s.about_stats && s.about_stats.length > 0) ? s.about_stats : DEFAULT_SITE_SETTINGS.about_stats;
  const values = (s.about_values && s.about_values.length > 0) ? s.about_values : DEFAULT_SITE_SETTINGS.about_values;
  const team = (s.about_team && s.about_team.length > 0) ? s.about_team : DEFAULT_SITE_SETTINGS.about_team;

  // Stat icons in order (non-configurable, decorative)
  const statIcons: LucideIcon[] = [Users, TrendingUp, Award, Target];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-24 text-center text-white sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#e91e63]/10 blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/8 blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h1 className="animate-fade-in-up text-3xl font-bold sm:text-4xl lg:text-5xl">
            {s.about_hero_title}
          </h1>
          <p
            className="animate-fade-in-up mt-4 text-sm text-slate-400 sm:text-base"
            style={{ animationDelay: "100ms" }}
          >
            {s.about_hero_subtitle}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-8 px-4 sm:px-6 lg:px-8">
        <div className="stagger-children mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label + i}
              value={stat.value}
              label={stat.label}
              icon={statIcons[i % statIcons.length]}
            />
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">আমাদের গল্প</h2>
          <div className="section-divider mt-4"></div>
          <p className="mt-8 text-sm leading-relaxed text-slate-600 sm:text-base">{s.about_story}</p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">আমাদের মূল্যবোধ</h2>
            <div className="section-divider mt-4"></div>
          </div>
          <div className="stagger-children grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <ValueCard key={v.title + i} {...v} />
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">আমাদের দল</h2>
              <div className="section-divider mt-4"></div>
            </div>
            <div className={`stagger-children grid gap-5 ${team.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
              {team.map((member, i) => (
                <TeamCard key={member.name + i} {...member} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
