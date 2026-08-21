/** Auth form chrome — project theme tokens only */
export const authInputClass = (invalid?: boolean): string =>
  [
    "h-11 rounded-[4px] border bg-background px-3 text-[14px] text-foreground shadow-none",
    "placeholder:text-muted-foreground",
    "focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:border-foreground",
    invalid ? "border-destructive" : "border-border",
  ].join(" ");

export const authLabelClass = "text-[13px] font-normal text-foreground";

export const authPrimaryBtnClass =
  "h-11 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-none hover:bg-primary/90 disabled:opacity-60";

export const authLinkClass = "font-medium text-foreground underline underline-offset-2 hover:opacity-70";

export const authErrorBannerClass = "mb-4 rounded-[4px] border border-destructive/25 bg-destructive/5 p-3";

export const authSuccessBannerClass = "mb-4 rounded-[4px] border border-foreground/10 bg-muted p-3";
