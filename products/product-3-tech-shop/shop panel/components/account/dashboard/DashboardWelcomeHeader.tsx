"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import {
  Heart,
  MapPin,
  Package,
  PackageSearch,
  Pencil,
  Settings,
} from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DASHBOARD_QUICK_LINKS,
  toDashboardWelcome,
  type DashboardQuickLink,
} from "@/lib/adapters/accountDashboard";
import type { User } from "@/lib/api/auth/service";
import { cn } from "@/lib/utils";

type DashboardWelcomeHeaderProps = Readonly<{
  user: User | null | undefined;
}>;

const QUICK_LINK_ICONS: Record<
  DashboardQuickLink["icon"],
  typeof Package
> = {
  orders: Package,
  wishlist: Heart,
  addresses: MapPin,
  track: PackageSearch,
  settings: Settings,
};

/**
 * Account summary — greeting, identity, verification, quick links.
 * Profile edits live under Settings; CTA links there.
 */
export function DashboardWelcomeHeader({
  user,
}: DashboardWelcomeHeaderProps): ReactElement {
  const welcome = toDashboardWelcome(user);

  return (
    <section
      className="bg-card rounded-sm border border-border p-5"
      aria-labelledby="dashboard-welcome-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Avatar className="h-14 w-14 rounded-full shrink-0 border border-border">
          {welcome.avatarUrl ? (
            <AvatarImage
              src={welcome.avatarUrl}
              alt=""
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-secondary text-sm font-semibold font-heading">
            {welcome.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            {welcome.greeting}
          </p>
          <h2
            id="dashboard-welcome-heading"
            className="font-heading text-xl font-bold truncate"
          >
            {welcome.displayName}
          </h2>
          {welcome.email ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{welcome.email}</span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                  welcome.isEmailVerified
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-400",
                )}
              >
                {welcome.isEmailVerified ? "Email verified" : "Email unverified"}
              </span>
            </div>
          ) : null}
        </div>

        <AppButton
          asChild
          variant="outline"
          size="sm"
          className="text-xs shrink-0 self-start"
        >
          <Link href="/account?tab=settings">
            <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            Edit profile
          </Link>
        </AppButton>
      </div>

      <nav
        className="mt-4 pt-4 border-t border-border"
        aria-label="Account quick links"
      >
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DASHBOARD_QUICK_LINKS.map((link) => {
            const Icon = QUICK_LINK_ICONS[link.icon];
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 rounded-sm border border-border px-3 py-2.5 text-xs font-medium hover:bg-secondary/40 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
