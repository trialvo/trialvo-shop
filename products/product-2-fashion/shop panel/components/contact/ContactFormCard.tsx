"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContact } from "@/hooks/useContact";
import type { User } from "@/lib/api/auth/service";
import type { ContactPayload } from "@/lib/api/contact/service";
import AuthCookies from "@/lib/auth/cookies";
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
    const user = AuthCookies.getUser<User>();
    const payload: ContactPayload = {
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone: values.mobile,
      subject: values.subject,
      message: values.message,
      // user_id: user?.id ?? null,
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

  return (
    <Card className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] pb-3 pt-0 sm:p-0 gap-0">
      <CardHeader className="p-4!">
        <div className="flex items-center gap-2 text-lg font-bold text-black">
          <FiMail className="h-6 w-6" />
          Send us a Message
        </div>
      </CardHeader>

      <CardContent className="px-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <div className="grid gap-4 grid-cols-2 items-start">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-black">
                      First Name <span className="text-[#FF383C]">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your full name" />
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
                    <FormLabel className="text-xs font-medium text-black">Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your full name" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-2 items-start">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-black">Mobile Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="01XXXXXXXXXX" inputMode="numeric" />
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
                    <FormLabel className="text-xs font-medium text-black">
                      Email <span className="text-[#FF383C]">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Email" />
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
                  <FormLabel className="text-xs font-medium text-black">
                    Subject <span className="text-[#FF383C]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Write message subject" />
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
                  <FormLabel className="text-xs font-medium text-black">
                    Message <span className="text-[#FF383C]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Tell us how we can help you...."
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-none border-[#999999] px-6 text-sm"
                onClick={() => onCancel?.()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="h-10 rounded-none bg-black px-6 text-sm text-white hover:bg-black/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ContactFormCard;
