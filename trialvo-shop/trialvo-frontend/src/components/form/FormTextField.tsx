import type { Control, FieldPath, FieldValues } from "react-hook-form";
import type { ReactNode } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FormTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  description?: string;
  disabled?: boolean;
  requiredMark?: boolean;
  className?: string;
  inputClassName?: string;
  startAdornment?: ReactNode;
};

/**
 * Reusable text/email/tel input bound to react-hook-form.
 * Use across public + admin forms for consistent validation UX.
 */
export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  description,
  disabled,
  requiredMark = false,
  className,
  inputClassName,
  startAdornment,
}: Readonly<FormTextFieldProps<TFieldValues>>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {requiredMark ? (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            ) : null}
          </FormLabel>
          <FormControl>
            <div className="relative">
              {startAdornment ? (
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                  {startAdornment}
                </span>
              ) : null}
              <Input
                {...field}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                disabled={disabled}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
                className={cn(
                  "h-11 rounded-lg",
                  startAdornment && "pl-10",
                  fieldState.invalid &&
                    "border-destructive focus-visible:ring-destructive/30",
                  inputClassName,
                )}
              />
            </div>
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default FormTextField;
