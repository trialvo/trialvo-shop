"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Eye, EyeOff, KeyRound, LayoutDashboard, Store } from "lucide-react";
import { IconTile } from "@/components/section";
import { trialCopy } from "@/lib/trial/copy";
import type { TrialCredentials } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard blocked — the value is visible, user can select it */
    }
  };
  return { copied, copy };
}

/**
 * Shop + admin links with the login row. Used on the instant-demo success
 * screen and on the Trial Hub, so credentials always look the same wherever
 * the customer meets them.
 */
export function CredentialsCard({
  shopUrl,
  adminUrl,
  credentials,
  language,
  emailedNote = true,
  className,
}: Readonly<{
  shopUrl?: string | null;
  adminUrl?: string | null;
  credentials?: TrialCredentials | null;
  language: MarketplaceLanguage;
  emailedNote?: boolean;
  className?: string;
}>) {
  const copy = trialCopy(language).demo;
  const { copied, copy: doCopy } = useCopy();
  const [showPassword, setShowPassword] = useState(false);

  const links = [
    shopUrl ? { id: "shop", url: shopUrl, icon: Store, title: copy.shop, body: copy.shopBody, login: false } : null,
    adminUrl ? { id: "admin", url: adminUrl, icon: LayoutDashboard, title: copy.admin, body: copy.adminBody, login: true } : null,
  ].filter(Boolean) as { id: string; url: string; icon: typeof Store; title: string; body: string; login: boolean }[];

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {links.length ? (
        <ul className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-start gap-3 px-4 py-4 transition-colors hover:bg-accent/[0.05]"
              >
                <IconTile icon={l.icon} size="md" className="group-hover:bg-accent group-hover:text-accent-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-display text-[15px] font-bold tracking-tight text-foreground">
                    {l.title}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-strong" aria-hidden="true" />
                  </span>
                  <span className="block text-xs text-muted-foreground">{l.body}</span>
                  <span className="mt-1.5 block truncate font-mono text-[11px] text-muted-foreground/80">{hostOf(l.url)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {credentials?.adminEmail ? (
        <div className="border-t border-border bg-muted/30 px-4 py-3.5">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.admin}
          </p>
          <dl className="grid gap-2">
            <CredRow
              label={copy.loginEmail}
              value={credentials.adminEmail}
              copied={copied === "email"}
              onCopy={() => doCopy("email", credentials.adminEmail!)}
              copyLabel={copy.copy}
              copiedLabel={copy.copied}
            />
            {credentials.adminPassword ? (
              <CredRow
                label={copy.password}
                value={showPassword ? credentials.adminPassword : "•".repeat(Math.min(credentials.adminPassword.length, 14))}
                mono
                copied={copied === "pw"}
                onCopy={() => doCopy("pw", credentials.adminPassword!)}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                extra={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? copy.hide : copy.show}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            ) : null}
          </dl>
          {emailedNote ? (
            <p className="mt-2.5 text-[11px] text-muted-foreground">{copy.emailedNote}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CredRow({
  label,
  value,
  mono,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
  extra,
}: Readonly<{
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
  extra?: React.ReactNode;
}>) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className={cn("truncate text-sm text-foreground", mono && "font-mono")}>{value}</dd>
      </div>
      {extra}
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors",
          copied ? "text-emerald-700" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-live="polite"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}

export default CredentialsCard;
