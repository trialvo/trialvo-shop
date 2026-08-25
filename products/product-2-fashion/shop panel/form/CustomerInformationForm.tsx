"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm, type FieldPath, type FieldErrors } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DeliveryAreaSelector, { AreaSelection } from "@/components/delivery/DeliveryAreaSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FiMapPin, FiPhoneCall, FiUser } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import { LiaMapMarkedAltSolid } from "react-icons/lia";


const addressTypeValues = ["home", "office", "na"] as const;

// Base schema — email field is overridden by buildSchema() depending on emailRequired prop
const baseSchema = {
  addressType: z.enum(addressTypeValues, {
    message: "Select address type",
  }),
  fullName: z.string().min(2, "Full name is required").max(80, "Full name is too long"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .refine((v) => /^01\d{9}$/.test(v), {
      message: "Enter a valid BD mobile number (01XXXXXXXXX)",
    }),
  city: z.string().optional(),
  area_name: z.string().optional(),
  location_mapping_id: z.number().int().positive("Please select a delivery area").optional().refine((v) => v !== undefined && v > 0, { message: "Please select a delivery area" }),
  deliveryAddress: z.string().min(10, "Delivery address is required").max(500, "Delivery address is too long"),
};

const buildSchema = (emailRequired: boolean) =>
  z.object({
    ...baseSchema,
    email: emailRequired
      ? z.string().min(1, "Email is required").email("Enter a valid email")
      : z.string().email("Enter a valid email").optional().or(z.literal("")),
  });

// Type based on the optional variant (widest union)
const _schemaForType = buildSchema(false);
export type CustomerInformationValues = z.infer<typeof _schemaForType>;


export type CustomerInformationFormRef = {
  triggerValidation: () => Promise<boolean>;
};

type Props = {
  defaultValues?: Partial<CustomerInformationValues>;
  onSubmit?: (values: CustomerInformationValues) => void | Promise<unknown>;
  className?: string;
  isLoading?: boolean;
  /** When true email field becomes required (driven by admin permissions). Default: false (optional) */
  emailRequired?: boolean;
  /**
   * When true, only the footer Submit button sends data (no blur/radio auto-save).
   * Also always shows Cancel + Submit. Use on account address add/edit forms.
   */
  deferSubmit?: boolean;
  /**
   * When true, Cancel resets the form fields instead of navigating back.
   * After a successful submit the form is also cleared.
   */
  clearOnCancel?: boolean;
};

const EMPTY_VALUES: CustomerInformationValues = {
  email: "",
  addressType: "home",
  fullName: "",
  mobile: "",
  city: "",
  area_name: "",
  location_mapping_id: undefined,
  deliveryAddress: "",
};

/** Small inline badge shown next to optional field labels */
function OptionalBadge({ label }: { label: string }) {
  return (
    <span className="ml-1 text-[10px] font-normal text-[#888] border border-[#DCDCDC] px-1.5 py-0.5 rounded-sm leading-none">
      {label}
    </span>
  );
}

/** Red asterisk for required fields */
function RequiredStar() {
  return <span className="text-[#FF383C]">*</span>;
}

const CustomerInformationForm = React.forwardRef<CustomerInformationFormRef, Props>(
  (
    {
      defaultValues,
      onSubmit,
      className,
      isLoading = false,
      emailRequired = false,
      deferSubmit = false,
      clearOnCancel = false,
    },
    ref,
  ) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();

    // Rebuild the Zod schema whenever the emailRequired flag changes
    const schema = React.useMemo(() => buildSchema(emailRequired), [emailRequired]);

    const form = useForm<CustomerInformationValues>({
      resolver: zodResolver(schema),

      mode: "onTouched",
      defaultValues: {
        ...EMPTY_VALUES,
        ...defaultValues,
      },
    });

    // Expose triggerValidation to parent via ref
    React.useImperativeHandle(ref, () => ({
      triggerValidation: async () => {
        const isValid = await form.trigger();
        if (!isValid) {
          const errors: FieldErrors<CustomerInformationValues> = form.formState.errors;
          const fieldOrder: FieldPath<CustomerInformationValues>[] = [
            "fullName", "email", "mobile", "city", "deliveryAddress",
          ];
          const firstErrorField = fieldOrder.find((f) => errors[f]);
          if (firstErrorField) {
            const el = document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => el.focus(), 400);
            }
          }
        }
        return isValid;
      },
    }), [form]);

    React.useEffect(() => {
      if (!defaultValues) return;
      form.reset({
        ...EMPTY_VALUES,
        addressType: defaultValues.addressType ?? "home",
        fullName: defaultValues.fullName ?? "",
        mobile: defaultValues.mobile ?? "",
        city: defaultValues.city ?? "",
        area_name: defaultValues.area_name ?? "",
        location_mapping_id: defaultValues.location_mapping_id,
        deliveryAddress: defaultValues.deliveryAddress ?? "",
        email: defaultValues.email ?? "",
      });
    }, [defaultValues, form]);

    const commitOnBlur = React.useCallback(
      async (_fieldName: FieldPath<CustomerInformationValues>) => {
        // Account add/edit: only Submit sends the API request
        if (deferSubmit) return;
        // Logged-in checkout guests still auto-save; authenticated users never auto-save
        if (isAuthenticated) return;
        if (!onSubmit) return;
        onSubmit(form.getValues());
      },
      [deferSubmit, form, onSubmit, isAuthenticated],
    );

    const handleSubmit = async (values: CustomerInformationValues) => {
      try {
        await onSubmit?.(values);
        if (clearOnCancel) {
          form.reset({ ...EMPTY_VALUES });
        }
      } catch {
        // Parent / mutation handles errors
      }
    };

    const handleCancel = () => {
      if (clearOnCancel) {
        form.reset({ ...EMPTY_VALUES });
        return;
      }
      router.back();
    };

    const showFooter = deferSubmit || isAuthenticated;

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn(
            "space-y-3",
            showFooter ? "pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-0" : "",
            className,
          )}
        >
          {/* ── Address Type (local state only — never auto-submits) ── */}
          <FormField
            control={form.control}
            name="addressType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex items-center gap-5"
                  >
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <RadioGroupItem value="home" />
                      <span className="text-xs font-medium text-[#343434]">{t("customerInfo.home")}</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-1.5">
                      <RadioGroupItem value="office" />
                      <span className="text-xs font-medium text-[#343434]">{t("customerInfo.office")}</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-1.5">
                      <RadioGroupItem value="na" />
                      <span className="text-xs font-medium text-[#343434]">{t("customerInfo.na")}</span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Full Name (guest only — shown above the 2-col grid) ── */}
          {!isAuthenticated && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FiUser className="h-4 w-4 text-[#343434]" />
                    {t("customerInfo.fullName")} <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("customerInfo.fullNamePlaceholder")}
                      {...field}
                      onBlur={() => commitOnBlur("fullName")}
                    />
                  </FormControl>
                  <FormMessage className="-mt-1.25!" />
                </FormItem>
              )}
            />
          )}

          {/* ── 2-column row: Mobile + (Full Name for auth | Email for guest) ── */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            {/* Mobile Number */}
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FiPhoneCall className="h-4 w-4 text-[#343434]" />
                    {t("customerInfo.mobile")} <RequiredStar />
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder="01XXXXXXXXX"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                      value={field.value}
                      onBlur={() => commitOnBlur("mobile")}
                    />
                  </FormControl>
                  <FormMessage className="-mt-1.25!" />
                </FormItem>
              )}
            />

            {/* Full Name (authenticated) OR Email (guest) */}
            {isAuthenticated ? (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <FiUser className="h-4 w-4 text-[#343434]" />
                      {t("customerInfo.fullName")} <RequiredStar />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("customerInfo.fullNamePlaceholder")}
                        {...field}
                        onBlur={() => commitOnBlur("fullName")}
                      />
                    </FormControl>
                    <FormMessage className="-mt-1.25!" />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <HiOutlineMail className="h-4 w-4 text-[#343434]" />
                      {t("customerInfo.email")}
                      {emailRequired
                        ? <RequiredStar />
                        : <OptionalBadge label={t("customerInfo.optional")} />}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("customerInfo.emailPlaceholder")}
                        {...field}
                        onBlur={() => commitOnBlur("email")}
                      />
                    </FormControl>
                    <FormMessage className="-mt-1.25!" />
                  </FormItem>
                )}
              />
            )}

          </div>

          {/* ── Delivery Area (replaces plain city text) ── */}
          <FormField
            control={form.control}
            name="location_mapping_id"
            render={({ field, fieldState }) => {
              const currentArea: AreaSelection | null = field.value
                ? {
                    location_mapping_id: field.value,
                    city_name: form.getValues("city") ?? "",
                    area_name: form.getValues("area_name") ?? "",
                  }
                : null;
              return (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FiMapPin className="h-4 w-4 text-[#343434]" />
                    {t("customerInfo.zone")} <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <DeliveryAreaSelector
                      value={currentArea}
                      onChange={(sel) => {
                        field.onChange(sel?.location_mapping_id ?? undefined);
                        form.setValue("city", sel?.city_name ?? "");
                        form.setValue("area_name", sel?.area_name ?? "");
                        commitOnBlur("location_mapping_id" as never);
                      }}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage className="-mt-1.25!" />
                </FormItem>
              );
            }}
          />

          {/* ── Delivery Address ── */}
          <FormField
            control={form.control}
            name="deliveryAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <LiaMapMarkedAltSolid className="h-4 w-4 text-[#343434]" />
                  {t("customerInfo.deliveryAddress")} <RequiredStar />
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder={t("customerInfo.deliveryAddressPlaceholder")}
                    {...field}
                    onBlur={() => commitOnBlur("deliveryAddress")}
                  />
                </FormControl>
                <FormMessage className="-mt-1.25!" />
              </FormItem>
            )}
          />

          {/* ── Submit / Cancel ── */}
          {showFooter && (
            <>
              <div className="hidden items-center gap-4 pt-2 sm:flex">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-[4px] border-border"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {t("customerInfo.cancel")}
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 rounded-[4px] bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? t("customerInfo.submitting") : t("customerInfo.saveChanges")}
                </Button>
              </div>

              <div className="fixed inset-x-0 bottom-0 z-50 bg-white sm:hidden">
                <div className="border-t border-black/10 pb-[env(safe-area-inset-bottom)]">
                  <div className="mx-auto flex max-w-[1120px] items-center gap-3 px-4 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 flex-1 rounded-[4px] border-border"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      {t("customerInfo.cancel")}
                    </Button>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-11 flex-1 rounded-[4px] bg-black text-white hover:bg-black/90"
                    >
                      {isLoading ? t("customerInfo.submitting") : t("customerInfo.saveChanges")}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </Form>
    );
  },
);

CustomerInformationForm.displayName = "CustomerInformationForm";

export default CustomerInformationForm;
