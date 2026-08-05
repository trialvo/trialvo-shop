"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail, Facebook, Instagram, Twitter, Youtube, MapPin, Phone } from "lucide-react";
import { newsletterSchema } from "@/lib/validation/newsletter";
import type { NewsletterFormData } from "@/lib/validation/newsletter";
import { cn } from "@/lib/utils";
import { subscribeService } from "@/lib/api/subscribe/service";
import { PaymentMethodIcon } from "@/components/layout/PaymentIcons";

const Footer = () => {
  const [subscribed, setSubscribed] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const onSubscribe = async (data: NewsletterFormData) => {
    try {
      setSubscribeError(null);
      await subscribeService.subscribe({ email: data.email });
      setSubscribed(true);
    } catch (err) {
      setSubscribeError(
        err instanceof Error ? err.message : "Subscription failed"
      );
    }
  };

  return (
    <footer className="w-full bg-primary text-primary-foreground">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="font-display text-xl lg:text-2xl font-semibold tracking-wide">
                Subscribe &amp; Get 15% Off
              </h3>
              <p className="text-primary-foreground/60 text-sm mt-1 tracking-wide">
                Stay updated with the latest collections and exclusive deals
              </p>
            </div>

            {subscribed ? (
              /* Success state */
              <div className="flex items-center gap-2 w-full max-w-md justify-center lg:justify-end">
                <CheckCircle2 size={18} className="text-accent shrink-0" />
                <span className="text-sm font-medium tracking-wide text-primary-foreground">
                  You&apos;re subscribed — enjoy 15% off!
                </span>
              </div>
            ) : (
              /* Form */
              <form
                onSubmit={handleSubmit(onSubscribe)}
                noValidate
                className="flex flex-col w-full max-w-md gap-1"
              >
                <div className="flex">
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="Enter your email"
                    aria-label="Newsletter email"
                    aria-invalid={!!errors.email}
                    className={cn(
                      "flex-1 bg-primary-foreground/10 border text-primary-foreground",
                      "placeholder:text-primary-foreground/40 px-4 py-3 text-sm tracking-wide",
                      "rounded-l focus:outline-none transition-colors",
                      errors.email
                        ? "border-destructive/60 focus:border-destructive"
                        : "border-primary-foreground/20 focus:border-accent"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-xs tracking-[0.2em] uppercase font-medium transition-colors rounded-r whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Subscribe"}
                  </button>
                </div>
                {(errors.email || subscribeError) && (
                  <p role="alert" className="text-xs text-destructive/90 flex items-center gap-1 mt-0.5">
                    <Mail size={10} className="shrink-0" />
                    {errors.email?.message || subscribeError}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Link href="/" className="font-display text-2xl font-semibold tracking-[0.15em] uppercase">
              LIFESTYLE
            </Link>
            <p className="text-primary-foreground/50 text-xs leading-relaxed mt-3 max-w-xs tracking-wide">
              Premium fashion destination bringing you the finest collections from around the world.
            </p>
            <div className="flex gap-3 mt-5">
              {([
                { Icon: Facebook, label: "Facebook", href: "https://facebook.com" },
                { Icon: Instagram, label: "Instagram", href: "https://instagram.com" },
                { Icon: Twitter, label: "Twitter", href: "https://twitter.com" },
                { Icon: Youtube, label: "Youtube", href: "https://youtube.com" },
              ] as { Icon: typeof Facebook; label: string; href: string }[]).map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/50 hover:text-accent hover:border-accent transition-colors"
                  aria-label={label}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {([
                { label: "New Arrivals", href: "/mega-sale" },
                { label: "Best Sellers", href: "/shop" },
                { label: "Sale", href: "/mega-sale" },
                { label: "Bulk & Combo", href: "/deals" },
                { label: "My Orders", href: "/orders" },
              ] as { label: string; href: string }[]).map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-primary-foreground/50 hover:text-accent text-xs tracking-wide transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-semibold mb-4">Categories</h4>
            <ul className="space-y-2.5">
              {([
                { label: "Men", href: "/shop?category=Men" },
                { label: "Women", href: "/shop?category=Women" },
                { label: "Kids", href: "/shop?category=Kids" },
                { label: "Footwear", href: "/shop?category=Footwear" },
                { label: "Accessories", href: "/shop?category=Accessories" },
              ] as { label: string; href: string }[]).map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-primary-foreground/50 hover:text-accent text-xs tracking-wide transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5">
              {([
                { label: "Track Order",        href: "/orders" },
                { label: "Returns & Exchange", href: "/returns" },
                { label: "FAQ",                href: "/faq" },
                { label: "Contact Us",         href: "/contact" },
                { label: "Privacy Policy",     href: "/privacy-policy" },
              ] as { label: string; href: string }[]).map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-primary-foreground/50 hover:text-accent text-xs tracking-wide transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-primary-foreground/50 text-xs tracking-wide">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                Dubai Mall, Downtown Dubai, UAE
              </li>
              <li className="flex items-center gap-2.5 text-primary-foreground/50 text-xs tracking-wide">
                <Phone size={14} className="shrink-0" />
                +971 4 123 4567
              </li>
              <li className="flex items-center gap-2.5 text-primary-foreground/50 text-xs tracking-wide">
                <Mail size={14} className="shrink-0" />
                hello@lifestyle.com
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/40 text-[11px] tracking-wide">
              © 2026 LIFESTYLE. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              {["Visa", "Mastercard", "bKash", "Nagad", "COD"].map((method) => (
                <PaymentMethodIcon key={method} method={method} />
              ))}
            </div>
            <div className="flex gap-4">
              {([
                { label: "Privacy", href: "/privacy-policy" },
                { label: "Terms", href: "/terms" },
                { label: "Cookies", href: "/privacy-policy#cookies" },
              ] as { label: string; href: string }[]).map((link) => (
                <Link key={link.label} href={link.href} className="text-primary-foreground/40 hover:text-primary-foreground/70 text-[11px] tracking-wide transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
