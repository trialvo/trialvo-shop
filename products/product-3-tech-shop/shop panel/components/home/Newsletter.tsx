"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/shared/AppButton";
import { AppInput } from "@/components/shared/AppInput";
import { Mail } from "lucide-react";
import { useSubscribe, type SubscribeFormValues } from "@/hooks/useSubscribe";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { emailSchema } from "@/lib/auth-schemas";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { z } from "zod";

const newsletterSchema = z.object({
  email: emailSchema,
});

const Newsletter = () => {
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { subscribe, isSubscribing } = useSubscribe();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SubscribeFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: SubscribeFormValues) => {
    setErrorMessage(null);

    try {
      await subscribe(values);
      setSubmitted(true);
      reset();
    } catch (err) {
      setErrorMessage(
        getUnknownErrorMessage(err, "Unable to subscribe. Please try again."),
      );
    }
  };

  // Single error slot below the row — keeps input + button alignment stable
  const displayError = errors.email?.message ?? errorMessage;

  return (
    <section className="gradient-primary py-12 md:py-16">
      <div className="container text-center">
        <SectionHeader
          align="center"
          icon={<Mail />}
          title="Stay Updated"
          subtitle="Subscribe to get exclusive deals, new arrivals, and tech tips delivered to your inbox."
          className="mb-5 md:mb-6"
          titleClassName="text-primary-foreground"
          subtitleClassName="text-primary-foreground/70"
          iconClassName="bg-primary-foreground/15 text-primary-foreground [background-image:none]"
        />
        {submitted ? (
          <p className="mt-5 text-sm font-medium text-accent">
            Thanks for subscribing!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto mt-5 w-full max-w-md"
            noValidate
          >
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <AppInput
                    name={field.name}
                    ref={field.ref}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Enter your email"
                    disabled={isSubscribing}
                    sanitize="email"
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onBlur={field.onBlur}
                    // Keep row height stable — surface errors under the flex row
                    error={Boolean(fieldState.error || errorMessage)}
                    className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-accent"
                    containerClassName="min-w-0 w-full flex-1"
                  />
                )}
              />
              <AppButton
                type="submit"
                variant="accent"
                disabled={isSubscribing}
                isLoading={isSubscribing || isSubmitting}
                loadingText="Subscribing..."
                className="h-10 w-full shrink-0 sm:w-auto"
              >
                Subscribe
              </AppButton>
            </div>

            {displayError ? (
              <p
                role="alert"
                className="mt-2 wrap-break-word rounded-sm border border-destructive/40 bg-destructive/25 px-3 py-2 text-left text-sm leading-snug text-primary-foreground"
              >
                {displayError}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
};

export default Newsletter;
