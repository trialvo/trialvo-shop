import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface AuthGuardProps {
  /** Lucide icon to display */
  icon: LucideIcon;
  heading: string;
  description: string;
}

/**
 * Renders a consistent "sign in required" empty state.
 * Used across orders, wishlist, and settings pages.
 */
export function AuthGuard({ icon: Icon, heading, description }: AuthGuardProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center py-20">
        <Icon size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-xl text-foreground mb-2">{heading}</h2>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs tracking-[0.2em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Sign In <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
