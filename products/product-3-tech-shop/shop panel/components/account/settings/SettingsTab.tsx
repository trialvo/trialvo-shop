"use client";

import type { ReactElement } from "react";
import { PasswordChangeCard } from "@/components/account/settings/PasswordChangeCard";
import { ProfileFormCard } from "@/components/account/settings/ProfileFormCard";
import type { User } from "@/lib/api/auth/service";

type SettingsTabProps = Readonly<{
  user: User | null | undefined;
}>;

/**
 * Account → Settings.
 * Profile (photo + details) and password — not on the dashboard overview.
 */
export function SettingsTab({ user }: SettingsTabProps): ReactElement {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-lg font-bold">Settings</h1>
        <p className="text-[11px] text-muted-foreground">
          Manage your profile and sign-in security.
        </p>
      </header>
      <ProfileFormCard user={user} />
      <PasswordChangeCard />
    </div>
  );
}

export default SettingsTab;
