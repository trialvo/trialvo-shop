/**
 * Shared UI theme for every product vertical.
 * Naming stays generic ("Admin Panel") so fashion / tech / lifestyle
 * all share the same neutral chrome. Optional brand color overrides
 * can still be injected later via CSS vars without renaming the product.
 */

export type AppVertical = "default" | "lifestyle" | "fashion" | "tech";

export type BrandColorScale = {
  25: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export type AppUiTheme = {
  vertical: AppVertical;
  /** Document / chrome title — keep product-agnostic */
  appName: string;
  appShortName: string;
  themeColorLight: string;
  themeColorDark: string;
  brand: BrandColorScale;
  authTagline: string;
};

/** Neutral slate-blue — readable, professional, not tied to any store brand */
export const SHARED_ADMIN_BRAND: BrandColorScale = {
  25: "#f4f6fb",
  50: "#eef1f8",
  100: "#dfe5f2",
  200: "#c5cfe6",
  300: "#9aabcf",
  400: "#6f86b5",
  500: "#3d5a8a",
  600: "#324a74",
  700: "#293c5f",
  800: "#22324f",
  900: "#1c2942",
  950: "#11192a",
};

const SHARED_COPY = {
  appName: "Admin Panel",
  appShortName: "Admin",
  authTagline: "Manage products, orders, customers, and settings in one place.",
} as const;

function themeFor(vertical: AppVertical): AppUiTheme {
  return {
    vertical,
    ...SHARED_COPY,
    themeColorLight: SHARED_ADMIN_BRAND[500],
    themeColorDark: SHARED_ADMIN_BRAND[950],
    brand: SHARED_ADMIN_BRAND,
  };
}

/** Every vertical shares the same neutral admin identity */
export const APP_UI_THEMES: Record<AppVertical, AppUiTheme> = {
  default: themeFor("default"),
  lifestyle: themeFor("lifestyle"),
  fashion: themeFor("fashion"),
  tech: themeFor("tech"),
};

export function isAppVertical(value: unknown): value is AppVertical {
  return (
    value === "default" ||
    value === "lifestyle" ||
    value === "fashion" ||
    value === "tech"
  );
}

export function resolveAppVertical(raw?: string | null): AppVertical {
  if (!raw) return "default";
  const normalized = raw.trim().toLowerCase();
  return isAppVertical(normalized) ? normalized : "default";
}

/** Apply brand scale onto document CSS variables (Tailwind brand-* tokens). */
export function applyBrandCssVariables(
  brand: BrandColorScale,
  root: HTMLElement = document.documentElement,
): void {
  const steps: Array<keyof BrandColorScale> = [
    25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
  ];
  steps.forEach((step) => {
    root.style.setProperty(`--color-brand-${step}`, brand[step]);
  });
}
