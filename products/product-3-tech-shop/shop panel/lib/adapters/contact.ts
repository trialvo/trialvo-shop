import type { ContactPayload } from "@/lib/api/contact/service";
import type { ContactFormValues } from "@/lib/contact-schema";

/**
 * Split a display name into API first/last name fields.
 */
export function splitContactName(fullName: string): {
  first_name: string;
  last_name?: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Guest" };
  if (parts.length === 1) return { first_name: parts[0]! };
  return {
    first_name: parts[0]!,
    last_name: parts.slice(1).join(" "),
  };
}

/**
 * Map validated form values → POST /contact-message body.
 */
export function toContactPayload(
  values: ContactFormValues,
  options?: Readonly<{ userId?: number | null }>,
): ContactPayload {
  const { first_name, last_name } = splitContactName(values.name);
  const phone = values.phone.trim();
  const email = values.email.trim().toLowerCase();

  return {
    first_name,
    last_name,
    email: email || undefined,
    phone: phone || undefined,
    subject: values.subject.trim(),
    message: values.message.trim(),
    user_id: options?.userId ?? null,
  };
}
