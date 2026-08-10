"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import { usePublicSiteSettings, DEFAULT_SITE_SETTINGS } from "@/api/siteSettings";

export default function Footer() {
  const { data } = usePublicSiteSettings();
  const s = data?.settings ?? DEFAULT_SITE_SETTINGS;

  const quickLinks = s.footer_quick_links ?? DEFAULT_SITE_SETTINGS.footer_quick_links;
  const companyLinks = s.footer_company_links ?? DEFAULT_SITE_SETTINGS.footer_company_links;
  const supportLinks = s.footer_support_links ?? DEFAULT_SITE_SETTINGS.footer_support_links;

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: s.social_facebook || "#" },
    { name: "Instagram", icon: Instagram, href: s.social_instagram || "#" },
    { name: "Twitter", icon: Twitter, href: s.social_twitter || "#" },
    { name: "WhatsApp", icon: MessageCircle, href: s.social_whatsapp || "#" },
  ];

  const LinkList = ({ links }: { links: Array<{ href: string; label: string }> }) => (
    <ul className="space-y-3.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="group flex items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-[#e91e63]"
          >
            <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-block" aria-label="ComboBasket Home">
              <Image
                src="/combobasket-logo.svg"
                alt="ComboBasket"
                width={160}
                height={40}
                className="h-10 w-auto brightness-0 invert transition-opacity duration-200 hover:opacity-80"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              {s.footer_tagline}
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  target={social.href !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-all duration-200 hover:bg-[#e91e63]/15 hover:text-[#e91e63]"
                >
                  <social.icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>

            {/* Contact Quick Info */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-[#e91e63]/60" />
                {s.contact_address}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <Phone className="h-3.5 w-3.5 text-[#e91e63]/60" />
                {s.contact_phone}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5 text-[#e91e63]/60" />
                {s.contact_hours}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-sm font-semibold tracking-wider text-white/80 uppercase">
              দ্রুত লিংক
            </h3>
            <LinkList links={quickLinks} />
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-6 text-sm font-semibold tracking-wider text-white/80 uppercase">
              কোম্পানি
            </h3>
            <LinkList links={companyLinks} />
          </div>

          {/* Support + Newsletter */}
          <div>
            <h3 className="mb-6 text-sm font-semibold tracking-wider text-white/80 uppercase">
              সাপোর্ট
            </h3>
            <LinkList links={supportLinks} />
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 flex flex-col items-center gap-4 border-t border-white/5 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {s.site_name}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Link href="/terms" className="transition-colors hover:text-[#e91e63]">শর্তাবলী</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#e91e63]">গোপনীয়তা</Link>
            <Link href="/cookies" className="transition-colors hover:text-[#e91e63]">কুকি</Link>
            <Link href="/refund" className="transition-colors hover:text-[#e91e63]">রিফান্ড নীতি</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
