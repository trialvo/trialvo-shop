import { Clock3 } from "lucide-react";
import { localize } from "@/lib/localize";
import { IconTile, Surface } from "@/components/section";
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
    <Surface
      as="aside"
      sheen
      className={cn("flex h-fit flex-col gap-6 p-6 md:p-7", className)}
    >
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          {localize(info.title, language)}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {localize(info.supporting, language)}
        </p>
      </div>

      <ul className="space-y-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const value = localize(channel.value, language);
          const label = localize(channel.label, language);

          return (
            <Surface
              as="li"
              key={channel.id}
              tone="muted"
              className="flex items-start gap-3 rounded-xl p-3.5"
            >
              <IconTile icon={Icon} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
                  {label}
                </p>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className="mt-1 flex min-h-[2rem] items-center truncate text-sm font-semibold text-foreground transition-colors hover:text-accent"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {value}
                  </p>
                )}
              </div>
            </Surface>
          );
        })}
      </ul>

      <Surface
        tone="accent"
        className="flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm leading-6 text-muted-foreground"
      >
        <Clock3 className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p>
          {language === "bn"
            ? "সাপোর্ট সময়: রবি–বৃহস্পতি, সকাল ১০টা – সন্ধ্যা ৬টা (BST)।"
            : "Support hours: Sun–Thu, 10:00 AM – 6:00 PM (BST)."}
        </p>
      </Surface>
    </Surface>
  );
}

export default ContactInfo;
