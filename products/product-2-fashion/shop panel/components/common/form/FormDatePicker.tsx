"use client";

import type { Control, FieldValues, Path } from "react-hook-form";

import DatePicker from "@/components/common/form/DatePicker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;

  placeholder?: string;
  disabled?: boolean;
  fromYear?: number;
  toYear?: number;

  className?: string;
};

const FormDatePicker = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  fromYear,
  toYear,
  className,
}: Props<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", className)}>
          {label ? <FormLabel className="mb-0!">{label}</FormLabel> : null}
          <FormControl>
            <DatePicker
              value={field.value as Date | undefined}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              fromYear={fromYear}
              toYear={toYear}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormDatePicker;
