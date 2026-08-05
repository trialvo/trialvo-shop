"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/config/env";
import { useTranslation } from "react-i18next";

type Props = {
  label: string;
  hint?: string;

  /** new selected file */
  value?: File | null;

  /** existing backend image path (e.g. "/uploads/...") */
  existingUrl?: string | null;

  onChange: (file: File | null) => void;
};

export default function ImagePickerSquare({
  label,
  hint,
  value,
  existingUrl,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setBlobUrl("");
      return;
    }
    const url = URL.createObjectURL(value);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value]);

  const existingPublic = useMemo(() => toPublicUrl(existingUrl) ?? "", [existingUrl]);
  const displayUrl = blobUrl || existingPublic;

  const open = () => inputRef.current?.click();

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} <span className="text-error-500">*</span>{" "}
          {hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
        </p>
      </div>

      <div className="flex justify-center md:justify-end">
        <div
          className={cn(
            "relative h-32 w-32 overflow-hidden rounded-lg border-2 border-dashed",
            "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
          )}
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") open();
          }}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Selected" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699Z"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
              <p className="text-xs font-medium">{t("products.categories.uploadImage")}</p>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className={cn(
              "absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md",
              "bg-white shadow-theme-xs ring-1 ring-inset ring-gray-200 hover:bg-gray-50",
              "dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-white/[0.03]",
            )}
            aria-label="Change image"
          >
            <Pencil size={14} className="text-gray-700 dark:text-gray-300" />
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onChange(file);
            }}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-center md:justify-end">
        <button
          type="button"
          className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => onChange(null)}
        >
          {t("products.categories.removeSelected")}
        </button>
      </div>
    </div>
  );
}
