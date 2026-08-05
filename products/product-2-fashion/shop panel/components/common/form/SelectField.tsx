"use client";

import type { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Select, { type SelectOption } from "@/components/common/form/Select";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  options: SelectOption[];
  className?: string;
  searchable?: boolean;
};

export default function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Select",
  required,
  options,
  className,
  searchable = false,
}: Readonly<Props<T>>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("w-full space-y-2", className)}>
          <FormLabel className="font-medium text-black mb-0!">
            {label}{" "}
            {required ? <span className="text-[#FF383C]">*</span> : null}
          </FormLabel>

          <FormControl>
            <Select
              options={options}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder={placeholder}
              searchable={searchable}
            />
          </FormControl>

          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}
