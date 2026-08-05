"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AccountSidebarViewModel } from "@/lib/adapters/accountNav";
import { cn } from "@/lib/utils";

type AccountSidebarProfileProps = Readonly<{
  profile: AccountSidebarViewModel;
}>;

/**
 * Identity chip — avatar, name, email.
 * Verified status is icon-only; details appear in a hover tooltip.
 */
export function AccountSidebarProfile({
  profile,
}: AccountSidebarProfileProps): ReactElement {
  return (
    <Link
      href="/account?tab=settings"
      scroll={false}
      className={cn(
        "group flex items-start gap-3 rounded-sm p-3",
        "border-b border-border",
        "transition-colors hover:bg-secondary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={`Edit profile for ${profile.displayName}`}
    >
      <Avatar className="h-11 w-11 shrink-0 rounded-full border border-border">
        {profile.avatarUrl ? (
          <AvatarImage
            src={profile.avatarUrl}
            alt=""
            className="rounded-full object-cover"
          />
        ) : null}
        <AvatarFallback className="rounded-full gradient-primary text-primary-foreground text-xs font-bold font-heading">
          {profile.initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-semibold font-heading tracking-tight truncate">
            {profile.displayName}
          </p>
          {profile.isEmailVerified ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex shrink-0 cursor-default"
                    onClick={(event) => {
                      // Keep focus on the icon; don't navigate via the parent link.
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <BadgeCheck
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden
                    />
                    <span className="sr-only">Email verified</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="rounded-sm text-xs">
                  Email verified
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {profile.email ? (
          <p className="text-[11px] text-muted-foreground truncate">
            {profile.email}
          </p>
        ) : null}
      </div>

      <ChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </Link>
  );
}
