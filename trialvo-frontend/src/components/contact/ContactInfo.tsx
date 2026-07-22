import { Clock3 } from "lucide-react";
import { localize } from "@/lib/localize";
import type { ContactChannel, ContactInfoPanel } from "@/types/contact";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

export type ContactInfoProps = {
  info: ContactInfoPanel;
  channels: ContactChannel[];
  language: MarketplaceLanguage;
  className?: string;
};

/** Contact channels sidebar — clear labels + quick actions */
export function ContactInfo({
  info,
  channels,
  language,
  className,
}: Readonly<ContactInfoProps>) {
  return (
    <aside
      className={cn(
        "flex h-fit flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm md:p-7",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          {localize(info.title, language)}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {localize(info.supporting, language)}
        </p>
      </div>

      <ul className="space-y-4">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const value = localize(channel.value, language);
          const label = localize(channel.label, language);

          return (
            <li
              key={channel.id}
              className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className="mt-0.5 block truncate text-sm font-semibold text-foreground transition-colors hover:text-accent"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {value}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-start gap-2.5 rounded-lg bg-accent/5 px-3.5 py-3 text-sm text-muted-foreground">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p>
          {language === "bn"
            ? "সাপোর্ট সময়: রবি–বৃহস্পতি, সকাল ১০টা – সন্ধ্যা ৬টা (BST)।"
            : "Support hours: Sun–Thu, 10:00 AM – 6:00 PM (BST)."}
        </p>
      </div>
    </aside>
  );
}

export default ContactInfo;
