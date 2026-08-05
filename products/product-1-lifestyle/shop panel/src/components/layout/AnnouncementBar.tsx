"use client";

import Link from "next/link";
import { Globe, X, Phone, Package, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const messages = [
  { text: "Free shipping on orders over $150",        link: { label: "Shop Now",     href: "/shop"      } },
  { text: "Eid Special — Up to 50% Off selected styles", link: { label: "Explore Deals", href: "/mega-sale" } },
  { text: "New Arrivals every week — Shop the latest looks", link: { label: "View All", href: "/mega-sale" } },
] as const;

export const ANNOUNCEMENT_MESSAGE_COUNT = messages.length;

interface AnnouncementBarProps {
  activeIdx: number;
  onClose: () => void;
}

export function AnnouncementBar({ activeIdx, onClose }: AnnouncementBarProps) {
  const normalizedActiveIdx =
    ((activeIdx % ANNOUNCEMENT_MESSAGE_COUNT) + ANNOUNCEMENT_MESSAGE_COUNT) %
    ANNOUNCEMENT_MESSAGE_COUNT;

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4">

        {/* Left: utility links — desktop only */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-[11px] tracking-wide text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <Package size={12} /> Track Order
          </Link>
          <span className="w-px h-3 bg-primary-foreground/20" />
          <a
            href="tel:+97141234567"
            className="flex items-center gap-1.5 text-[11px] tracking-wide text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <Phone size={12} /> +971 4 123 4567
          </a>
        </div>

        {/* Center: rotating ticker */}
        <div className="flex-1 text-center relative overflow-hidden h-8 flex items-center justify-center">
          {messages.map(({ text, link }, i) => (
            <span
              key={link.href + text}
              className={cn(
                "absolute inset-x-0 text-center text-[11px] sm:text-xs tracking-[0.15em] uppercase font-light transition-all duration-500",
                i === normalizedActiveIdx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
              )}
            >
              {text}{" "}
              <Link
                href={link.href}
                className="underline underline-offset-2 hover:text-accent transition-colors font-medium"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>

        {/* Right: language + close — desktop */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 cursor-pointer text-[11px] tracking-wide text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <Globe size={12} /> EN / USD
            <ChevronDown size={10} className="opacity-50" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-primary-foreground/40 hover:text-primary-foreground transition-colors"
            aria-label="Close announcement"
          >
            <X size={13} />
          </button>
        </div>

        {/* Close — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden cursor-pointer text-primary-foreground/40 hover:text-primary-foreground transition-colors shrink-0"
          aria-label="Close announcement"
        >
          <X size={13} />
        </button>

      </div>
    </div>
  );
}
