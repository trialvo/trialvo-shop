import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type FormTextareaFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  requiredMark?: boolean;
  rows?: number;
  className?: string;
  textareaClassName?: string;
};

/** Reusable textarea bound to react-hook-form */
export function FormTextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  requiredMark = false,
  rows = 5,
  className,
  textareaClassName,
}: Readonly<FormTextareaFieldProps<TFieldValues>>) {
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
            <Textarea
              {...field}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
              className={cn(
                "min-h-[120px] resize-y rounded-lg",
                fieldState.invalid &&
                  "border-destructive focus-visible:ring-destructive/30",
                textareaClassName,
              )}
            />
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

export default FormTextareaField;
