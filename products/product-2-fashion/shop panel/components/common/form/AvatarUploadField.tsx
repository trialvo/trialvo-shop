"use client";

import * as React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { FiTrash2, FiUpload } from "react-icons/fi";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  className?: string;
  initialImageUrl?: string | null;
  maxSizeMb?: number;
  accept?: string;
  fallbackText?: string;
};

const DEFAULT_ACCEPT = "image/png, image/jpeg, image/jpg, image/webp";
const DEFAULT_MAX_MB = 2;

const getInitials = (text?: string) => {
  if (!text) return "U";
  const parts = text.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase()).join("");
  return chars || "U";
};

const isFile = (v: unknown): v is File => {
  if (typeof window === "undefined") return false;
  return v instanceof File;
};

const AvatarUploadField = <TFieldValues extends FieldValues,>({
  control,
  name,
  label = "Avatar",
  className,
  initialImageUrl = null,
  maxSizeMb = DEFAULT_MAX_MB,
  accept = DEFAULT_ACCEPT,
  fallbackText = "User",
}: Props<TFieldValues>) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialImageUrl);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const value = field.value as unknown;

    if (!isFile(value)) {
      setPreviewUrl(initialImageUrl);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [field.value, initialImageUrl]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) return "Only image files are allowed.";

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) return `Max file size is ${maxSizeMb}MB.`;

    const accepts = accept
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (accepts.length > 0) {
      const ok = accepts.some((a) => {
        if (a === "image/*") return true;
        return file.type === a;
      });
      if (!ok) return "Unsupported file type.";
    }

    return null;
  };

  const setFile = (file: File | null) => {
    field.onChange(file);
    field.onBlur();
  };

  const onPickClick = () => inputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const msg = validateFile(file);
    if (msg) {
      setFile(null);
      e.target.value = "";
      return;
    }

    setFile(file);
    e.target.value = "";
  };

  const onRemove = () => {
    setFile(null);
    setPreviewUrl(initialImageUrl);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const msg = validateFile(file);
    if (msg) {
      setFile(null);
      return;
    }

    setFile(file);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const value = field.value as unknown;
  const hasFile = isFile(value);

  return (
    <FormItem className={cn("w-full", className)}>
      <FormLabel>{label}</FormLabel>

      <div
        className={cn(
          "flex items-center gap-4 rounded-none border border-[#CBCBCB] p-4 transition-colors",
          isDragging && "border-black",
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <Avatar className="h-14 w-14">
          <AvatarImage src={previewUrl ?? undefined} alt="Avatar preview" />
          <AvatarFallback>{getInitials(fallbackText)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm font-medium text-black">
            {hasFile ? value.name : "Upload a profile photo"}
          </p>

          <p className="text-xs text-muted-foreground">
            Drag & drop or choose file. PNG/JPG/WEBP up to {maxSizeMb}MB.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onPickClick} className="h-9 gap-2">
              <FiUpload className="h-4 w-4" />
              Choose file
            </Button>
            {
              !initialImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemove}
                  disabled={!previewUrl && !hasFile}
                  className="h-9 gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <FiTrash2 className="h-4 w-4 text-[#FF383C]" />
                  Remove
                </Button>
              )
            }
          </div>

          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={onFileChange}
            className="hidden"
          />
        </div>
      </div>

      <FormMessage>{error?.message}</FormMessage>
    </FormItem>
  );
};

export default AvatarUploadField;
