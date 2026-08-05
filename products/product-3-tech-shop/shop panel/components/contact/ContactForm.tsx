"use client";

import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { FormAppTextarea } from "@/components/shared/FormAppTextarea";
import { FormPhoneInput } from "@/components/phone/FormPhoneInput";
import { useAuth } from "@/hooks/useAuth";
import { useContact } from "@/hooks/useContact";
import { toContactPayload } from "@/lib/adapters/contact";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/contact-schema";
import { getUnknownErrorMessage } from "@/lib/api/errors";

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

/**
 * Contact message form — FormApp* inputs + POST /contact-message.
 */
export function ContactForm(): ReactElement {
  const { user, isAuthenticated } = useAuth();
  const { submitContact, isSubmitting } = useContact();

  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onBlur",
  });

  // Prefill name/email for signed-in shoppers (still editable)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const defaultPhone =
      typeof user.default_phone === "string"
        ? user.default_phone
        : user.default_phone?.phone_number ??
          user.phones?.[0]?.phone_number ??
          "";

    reset({
      ...EMPTY_VALUES,
      name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
      email: user.email?.trim().toLowerCase() ?? "",
      phone: defaultPhone,
    });
  }, [isAuthenticated, user, reset]);

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const emailMatchesAccount =
        Boolean(user?.id) &&
        Boolean(user?.email) &&
        values.email.trim().toLowerCase() === user!.email!.trim().toLowerCase();

      const res = await submitContact(
        toContactPayload(values, {
          userId: emailMatchesAccount ? Number(user!.id) : null,
        }),
      );

      toast.success(
        res.message || "Message sent! We'll get back to you soon.",
      );
      reset({
        ...EMPTY_VALUES,
        name: emailMatchesAccount
          ? [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()
          : "",
        email: emailMatchesAccount ? (user?.email ?? "") : "",
      });
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(err, "Failed to send message. Please try again."),
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormAppInput
          control={control}
          name="name"
          label="Name"
          required
          sanitize="text"
          maxLength={80}
          placeholder="Your full name"
          autoComplete="name"
        />
        <FormPhoneInput
          control={control}
          name="phone"
          label="Phone"
          hint="Optional — helps us call you back"
          defaultCountry="BD"
        />
        <FormAppInput
          control={control}
          name="email"
          label="Email"
          required
          type="email"
          sanitize="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <FormAppInput
          control={control}
          name="subject"
          label="Subject"
          required
          sanitize="text"
          maxLength={120}
          placeholder="How can we help?"
        />
        <div className="sm:col-span-2">
          <FormAppTextarea
            control={control}
            name="message"
            label="Message"
            required
            sanitize="text"
            maxLength={2000}
            rows={5}
            placeholder="Tell us about your order, product question, or feedback…"
            hint="Min 10 characters"
          />
        </div>
      </div>

      <AppButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Sending…"
        className="w-full sm:w-auto"
      >
        Send Message
      </AppButton>
    </form>
  );
}

export default ContactForm;
