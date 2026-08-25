/** Auth form chrome — project theme tokens only */
/** @deprecated Prefer `<Input aria-invalid={…} />` — base styles live on the shared Input. */
export const authInputClass = (invalid?: boolean): string =>
  invalid ? "border-destructive" : "";

export const authLabelClass = "text-[13px] font-normal text-foreground";

export const authPrimaryBtnClass =
  "h-11 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-none hover:bg-primary/90 disabled:opacity-60";

export const authLinkClass = "font-medium text-foreground underline underline-offset-2 hover:opacity-70";

export const authErrorBannerClass = "mb-4 rounded-[4px] border border-destructive/25 bg-destructive/5 p-3";

export const authSuccessBannerClass = "mb-4 rounded-[4px] border border-foreground/10 bg-muted p-3";
