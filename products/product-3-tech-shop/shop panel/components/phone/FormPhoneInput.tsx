"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  PhoneInput,
  type PhoneInputProps,
} from "@/components/phone/PhoneInput";

type FormPhoneInputProps<T extends FieldValues> = Omit<
  PhoneInputProps,
  "value" | "onChange" | "onBlur" | "errorMessage" | "name"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/**
 * PhoneInput bound to react-hook-form — stores E.164 in the field value.
 */
export function FormPhoneInput<T extends FieldValues>({
  control,
  name,
  ...phoneProps
}: FormPhoneInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PhoneInput
          {...phoneProps}
          name={field.name}
          inputRef={field.ref}
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
