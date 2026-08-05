import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Date, string, or null to a "YYYY-MM-DD" string.
 * Used by authService.updateProfile() for the `dob` field.
 */
export function toDateString(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    // Already a date string — normalize to YYYY-MM-DD
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toISOString().split("T")[0];
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return "";
}
