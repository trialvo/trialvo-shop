import { useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
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

export type FormPasswordFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  description?: string;
  disabled?: boolean;
  requiredMark?: boolean;
  className?: string;
  inputClassName?: string;
  startAdornment?: ReactNode;
};

/** Reusable password input with show/hide toggle */
export function FormPasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  autoComplete = "current-password",
  description,
  disabled,
  requiredMark = false,
  className,
  inputClassName,
  startAdornment,
}: Readonly<FormPasswordFieldProps<TFieldValues>>) {
  const [visible, setVisible] = useState(false);

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
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder={placeholder}
                disabled={disabled}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
                className={cn(
                  "h-11 rounded-lg pr-10",
                  startAdornment && "pl-10",
                  fieldState.invalid &&
                    "border-destructive focus-visible:ring-destructive/30",
                  inputClassName,
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setVisible((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={visible ? "Hide password" : "Show password"}
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
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

export default FormPasswordField;
