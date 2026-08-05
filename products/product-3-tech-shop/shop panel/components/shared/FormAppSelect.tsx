"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { AppSelect, type AppSelectProps } from "@/components/shared/AppSelect";

type FormAppSelectProps<
  TFieldValues extends FieldValues,
  TOption extends string = string,
> = Omit<
  AppSelectProps<TOption>,
  "value" | "onChange" | "onBlur" | "errorMessage" | "name"
> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

/**
 * AppSelect bound to react-hook-form Controller.
 */
export function FormAppSelect<
  TFieldValues extends FieldValues,
  TOption extends string = string,
>({
  control,
  name,
  ...selectProps
}: FormAppSelectProps<TFieldValues, TOption>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AppSelect<TOption>
          {...selectProps}
          name={field.name}
          value={(field.value ?? "") as TOption | ""}
          onChange={(next) => field.onChange(next)}
          onBlur={field.onBlur}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
