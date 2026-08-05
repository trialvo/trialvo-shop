"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  AppTextarea,
  type AppTextareaProps,
} from "@/components/shared/AppTextarea";

type FormAppTextareaProps<T extends FieldValues> = Omit<
  AppTextareaProps,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "onChange"
  | "errorMessage"
  | "name"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/**
 * AppTextarea bound to react-hook-form Controller.
 */
export function FormAppTextarea<T extends FieldValues>({
  control,
  name,
  ...textareaProps
}: FormAppTextareaProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AppTextarea
          {...textareaProps}
          name={field.name}
          ref={field.ref}
          value={
            typeof field.value === "string"
              ? field.value
              : String(field.value ?? "")
          }
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormAppTextarea;
