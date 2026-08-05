/**
 * Shared option shape for AppSelect / FormAppSelect.
 */
export type AppSelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type AppSelectLayer = "page" | "modal";

/** Popover z-index: page stays under header (z-50); modal sits above dialogs. */
export function appSelectContentZIndex(layer: AppSelectLayer): string {
  return layer === "modal" ? "z-[60]" : "z-40";
}
