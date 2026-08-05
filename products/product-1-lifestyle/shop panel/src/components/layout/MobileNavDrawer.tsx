"use client";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";
import type { NavCategory } from "@/types";
import {
    ChevronDown,
    Heart,
    LogIn,
    Mail,
    Package,
    Phone,
    Settings,
    ShoppingBag,
    Tag,
    User,
    X,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NavCategory[];
  wishlistCount: number;
  isAuthenticated: boolean;
}

/* ── Single category row ─────────────────────────────────────────────── */
function CategoryRow({ cat, onClose }: { cat: NavCategory; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const submenu = cat.submenu ?? [];
  const submenuHrefs = cat.submenuHrefs ?? [];
  const hasSubmenu = submenu.length > 0;

  return (
    <div className="border-b border-border/40 last:border-b-0">
      {/* Full row is toggle when has submenu, plain link otherwise */}
      {hasSubmenu ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between py-3.5 text-[13px] tracking-[0.1em] uppercase font-medium transition-colors leading-none cursor-pointer",
            cat.featured ? "text-accent font-semibold" : "text-foreground/85 hover:text-foreground"
          )}
          aria-expanded={expanded}
        >
          {cat.label}
          <ChevronDown
            size={14}
            className={cn("transition-transform duration-250 text-muted-foreground", expanded && "rotate-180")}
          />
        </button>
      ) : (
        <Link
          href={cat.href}
          onClick={onClose}
          className={cn(
            "block py-3.5 text-[13px] tracking-[0.1em] uppercase font-medium transition-colors leading-none",
            cat.featured ? "text-accent font-semibold" : "text-foreground/85 hover:text-foreground"
          )}
        >
          {cat.label}
        </Link>
      )}

      {/* Smooth subcategory accordion */}
      {hasSubmenu && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="pl-5 pb-2.5 space-y-0.5">
              {submenu.map((item, i) => (
                <Link
                  key={`${item}-${submenuHrefs[i] ?? i}`}
                  href={submenuHrefs[i] ?? `/shop?category=${encodeURIComponent(cat.label)}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 py-2 text-[12px] text-muted-foreground hover:text-accent tracking-wide transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-border/80 shrink-0" />
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main drawer ─────────────────────────────────────────────────────── */
export function MobileNavDrawer({
  isOpen,
  onClose,
  categories,
  wishlistCount,
  isAuthenticated,
}: MobileNavDrawerProps) {
  useBodyScrollLock(isOpen);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer — slides from left */}
      <div
        className={`lg:hidden fixed left-0 bottom-0 z-50 w-[300px] sm:w-[320px] bg-background flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+3rem)]"
        }`}
        style={{ top: 0 }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        inert={!isOpen}
        aria-label="Navigation menu"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-display text-[13px] font-bold tracking-[0.2em] uppercase text-foreground">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-90 cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Quick action strip */}
          <div className="grid grid-cols-3 border-b border-border/60">
            {[
              { icon: Zap,         label: "Flash Deals", href: "/mega-sale", color: "text-sale"   },
              { icon: Tag,         label: "Sale",         href: "/deals",     color: "text-accent"     },
              { icon: ShoppingBag, label: "Shop",         href: "/shop",      color: "text-foreground" },
            ].map(({ icon: Icon, label, href, color }) => (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 py-3.5 text-center border-r border-border/60 last:border-r-0 hover:bg-secondary/60 transition-colors"
              >
                <Icon size={16} className={color} />
                <span className="text-[10px] tracking-[0.12em] uppercase font-semibold text-foreground/70">
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {/* ── Category links ── */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-3">
              Shop by Category
            </p>
            <div>
              {categories.map((cat) => (
                <CategoryRow key={cat.href} cat={cat} onClose={onClose} />
              ))}
            </div>
          </div>

          {/* ── Account section ── */}
          <div className="px-5 pt-5 pb-2 border-t border-border/60 mt-2">
            <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-3">
              My Account
            </p>
            <div className="space-y-0.5">
              {(isAuthenticated
                ? [
                    { icon: User,     label: "Profile & Settings",                                         href: "/settings" },
                    { icon: Heart,    label: `Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ""}`, href: "/wishlist" },
                    { icon: Package,  label: "My Orders",                                                  href: "/orders"   },
                    { icon: Settings, label: "Preferences",                                                href: "/settings" },
                  ]
                : [
                    { icon: LogIn, label: "Sign In / Register", href: "/auth" },
                  ]
              ).map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 text-[13px] text-foreground/80 hover:text-foreground hover:bg-secondary/60 -mx-2 px-2 rounded-lg transition-colors group"
                >
                  <Icon size={14} className="text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                  <span className="tracking-wide">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Help & Support ── */}
          <div className="px-5 pt-4 pb-4 border-t border-border/60 mt-2">
            <p className="text-[9px] tracking-[0.25em] uppercase font-bold text-muted-foreground mb-3">
              Help
            </p>
            <div className="space-y-0.5">
              {[
                { icon: Package, label: "Track My Order", href: "/orders"  },
                { icon: Mail,    label: "Contact Us",     href: "/contact" },
                { icon: Phone,   label: "FAQ",            href: "/faq"     },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 text-[12px] text-muted-foreground hover:text-foreground -mx-2 px-2 rounded-lg transition-colors"
                >
                  <Icon size={13} className="shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-border/60 shrink-0 bg-secondary/30">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-foreground mb-0.5">LIFESTYLE</p>
          <p className="text-[10px] text-muted-foreground tracking-wide">Premium fashion & lifestyle</p>
        </div>
      </div>
    </>
  );
}
