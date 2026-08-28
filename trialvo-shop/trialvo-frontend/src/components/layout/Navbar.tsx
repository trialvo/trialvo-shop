"use client";

import { useEffect, useState } from "react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { usePathname } from "next/navigation";
import { parsePathname } from "@/lib/i18n";
import { Globe, Menu, X } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/brand";
import { brandName } from "@/lib/brand";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { path } = parsePathname(pathname || "/");
  const isHome = path === "/";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  const transparent = isHome && !isScrolled && !isMobileMenuOpen;
  const name = brandName(language);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        transparent
          ? "border-transparent bg-transparent"
          : "border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md",
      )}
    >
      <nav className="container-custom" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between md:h-[4.5rem]">
          <LocalizedLink
            href="/"
            className="group inline-flex items-center transition-opacity hover:opacity-90"
            aria-label={name}
          >
            <span className="hidden sm:inline-flex">
              <BrandLogo
                withWordmark
                wordmark={name}
                size="md"
                tone={transparent ? "onDark" : "default"}
                markClassName="transition-transform duration-200 group-hover:scale-[1.04]"
              />
            </span>
            <span className="inline-flex sm:hidden">
              <BrandLogo
                size="md"
                tone={transparent ? "onDark" : "default"}
                markClassName="transition-transform duration-200 group-hover:scale-[1.04]"
              />
            </span>
          </LocalizedLink>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <LocalizedLink
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  transparent
                    ? isActive(link.href)
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                    : isActive(link.href)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </LocalizedLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                transparent &&
                  "[&_button]:border-white/30 [&_button]:text-white [&_button:hover]:bg-white/10",
              )}
            >
              <ThemeToggle />
            </div>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5 rounded-md",
                transparent &&
                  "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
              aria-label="Toggle language"
              onClick={() => setLanguage((language === "bn" ? "en" : "bn") as Language)}
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">
                {language === "bn" ? "EN" : "বাং"}
              </span>
            </Button>

            <Button asChild size="sm" className="hidden h-9 rounded-md px-4 font-semibold md:inline-flex">
              <LocalizedLink href="/products">{language === "bn" ? "ব্রাউজ" : "Browse"}</LocalizedLink>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden",
                transparent && "text-white hover:bg-white/10 hover:text-white",
              )}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-border/60 bg-background py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <LocalizedLink
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-4 py-3 text-sm font-medium",
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {link.label}
                </LocalizedLink>
              ))}
              <LocalizedLink
                href="/products"
                className="mt-1 rounded-md bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground"
              >
                {language === "bn" ? "সব প্রোডাক্ট ব্রাউজ" : "Browse all products"}
              </LocalizedLink>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
