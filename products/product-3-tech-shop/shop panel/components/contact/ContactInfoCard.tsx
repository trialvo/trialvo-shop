"use client";

import type { ReactElement } from "react";
import { Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import {
  CONTACT_INFO_ITEMS,
  type ContactInfoIconId,
  type ContactInfoItem,
} from "@/lib/contact/contactInfo";
import { cn } from "@/lib/utils";

const CONTACT_ICONS: Record<ContactInfoIconId, LucideIcon> = {
  phone: Phone,
  email: Mail,
  address: MapPin,
  whatsapp: MessageCircle,
};

type ContactInfoCardProps = Readonly<{
  item: ContactInfoItem;
  className?: string;
}>;

/**
 * Single contact channel card — phone / email / map / WhatsApp.
 * Icons are resolved on the client (never passed from Server Components).
 */
export function ContactInfoCard({
  item,
  className,
}: ContactInfoCardProps): ReactElement {
  const Icon = CONTACT_ICONS[item.icon];
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm gradient-primary">
        <Icon className="h-5 w-5 text-primary-foreground" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <p className="break-words text-sm text-muted-foreground">{item.value}</p>
      </div>
    </>
  );

  const shellClass = cn(
    "flex items-start gap-3 rounded-sm border border-border bg-card p-4 shadow-product transition-shadow",
    item.href && "hover:shadow-product-hover",
    className,
  );

  if (item.href) {
    const isExternal = item.href.startsWith("http");
    return (
      <a
        href={item.href}
        className={shellClass}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {content}
      </a>
    );
  }

  return <div className={shellClass}>{content}</div>;
}

/**
 * Sidebar list of contact channels — owns data so the page stays a Server Component.
 */
export function ContactInfoAside(): ReactElement {
  return (
    <aside className="space-y-3 md:space-y-4" aria-label="Contact channels">
      <p className="font-heading text-sm font-semibold text-foreground md:sr-only">
        Other ways to reach us
      </p>
      {CONTACT_INFO_ITEMS.map((item) => (
        <ContactInfoCard key={item.id} item={item} />
      ))}
    </aside>
  );
}

export default ContactInfoCard;
