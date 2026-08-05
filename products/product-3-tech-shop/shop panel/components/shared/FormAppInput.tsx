"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { AppInput, type AppInputProps } from "@/components/shared/AppInput";

type FormAppInputProps<T extends FieldValues> = Omit<
  AppInputProps,
  "value" | "defaultValue" | "onValueChange" | "onChange" | "errorMessage" | "name"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/**
 * AppInput bound to react-hook-form Controller —
 * keeps sanitization + typed field errors in one place.
 */
export function FormAppInput<T extends FieldValues>({
  control,
  name,
  ...inputProps
}: FormAppInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AppInput
          {...inputProps}
          name={field.name}
          ref={field.ref}
          value={typeof field.value === "string" ? field.value : String(field.value ?? "")}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
