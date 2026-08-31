"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContact } from "@/hooks/useContact";
import type { ContactPayload } from "@/lib/api/contact/service";
import { FiMail } from "react-icons/fi";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
});

export type ContactFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: Partial<ContactFormValues>;
  onSubmit?: (values: ContactFormValues) => void;
  onCancel?: () => void;
};

const fieldLabelClass = "text-xs font-semibold text-[#191919]";
const fieldClass =
  "h-11 rounded-lg border-black/10 bg-[#FAF8F5] text-[14px] shadow-none placeholder:text-[#A0A0A0] focus-visible:border-[#191919] focus-visible:bg-white focus-visible:ring-[#191919]/15";

const ContactFormCard: React.FC<Props> = ({ defaultValues, onSubmit, onCancel }) => {
  const { submitContact, isSubmitting } = useContact();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      subject: "",
      message: "",
      ...defaultValues,
    },
  });

  const handleSubmit = async (values: ContactFormValues) => {
    const payload: ContactPayload = {
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone: values.mobile,
      subject: values.subject,
      message: values.message,
    };

    const loadingId = toast.loading("Sending message...");

    try {
      const res = await submitContact(payload);

      if (res?.error) {
        toast.dismiss(loadingId);
        toast.error(res.error);
        return;
      }

      toast.dismiss(loadingId);
      toast.success(res?.message || "Contact message submitted successfully.");
      onSubmit?.(values);
      form.reset();
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error(err instanceof Error ? err.message : "Failed to submit message");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    form.reset();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F3F1ED] text-[#191919]">
            <FiMail className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#191919] min-[768px]:text-base">
              Send a message
            </h2>
            <p className="text-xs text-[#8A8A8A]">We&apos;ll get back to you soon</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 min-[768px]:px-5 min-[768px]:py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={fieldLabelClass}>
                      First name <span className="text-[#C45C5C]">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="First name" className={fieldClass} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={fieldLabelClass}>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Last name" className={fieldClass} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={fieldLabelClass}>Mobile number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="01XXXXXXXXX"
                        inputMode="numeric"
                        className={fieldClass}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={fieldLabelClass}>
                      Email <span className="text-[#C45C5C]">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="you@example.com" className={fieldClass} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabelClass}>
                    Subject <span className="text-[#C45C5C]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="What is this about?" className={fieldClass} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabelClass}>
                    Message <span className="text-[#C45C5C]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Tell us how we can help…"
                      className="min-h-[140px] rounded-lg border-black/10 bg-[#FAF8F5] text-[14px] shadow-none placeholder:text-[#A0A0A0] focus-visible:border-[#191919] focus-visible:bg-white focus-visible:ring-[#191919]/15"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="submit"
                className="h-10 rounded-lg bg-[#191919] px-5 text-[13px] font-semibold text-white hover:bg-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending…" : "Send message"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-black/15 bg-white px-5 text-[13px] font-semibold text-[#5F5F5F] hover:bg-[#FAF8F5] hover:text-[#191919]"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ContactFormCard;
