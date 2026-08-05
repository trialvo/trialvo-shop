import Link from "next/link";
import type { ReactElement } from "react";
import { Phone, MapPin } from "lucide-react";

const TOP_LINKS = [
  { href: "/order-tracking", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

export function HeaderTopBar(): ReactElement {
  return (
    <div className="border-b border-border bg-secondary/50 hidden md:block">
      <div className="container flex items-center justify-between py-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" aria-hidden /> +880 1XXX-XXXXXX
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden /> Dhaka, Bangladesh
          </span>
        </div>
        <div className="flex items-center gap-4">
          {TOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeaderTopBar;
