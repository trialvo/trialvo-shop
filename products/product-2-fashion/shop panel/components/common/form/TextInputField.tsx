"use client";

import * as React from "react";
import type { Control, FieldValues, Path } from "react-hook-form";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>;
    label: string;
    required?: boolean;
    placeholder?: string;
    type?: React.HTMLInputTypeAttribute;

    leftIcon?: React.ReactNode;

    className?: string;
    inputClassName?: string;
};

export default function TextInputField<T extends FieldValues>({
    control,
    name,
    label,
    required,
    placeholder,
    type = "text",
    leftIcon,
    className,
    inputClassName,
}: Readonly<Props<T>>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn("", className)}>
                    <FormLabel className="text-sm font-medium text-black">
                        {label}{" "}
                        {required ? <span className="text-[#FF383C]">*</span> : null}
                    </FormLabel>

                    <FormControl>
                        <div className="relative">
                            {leftIcon ? (
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]">
                                    {leftIcon}
                                </span>
                            ) : null}

                            <Input
                                {...field}
                                type={type}
                                placeholder={placeholder}
                                className={cn(leftIcon ? "pl-9" : "", inputClassName)}
                            />
                        </div>
                    </FormControl>

                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}
