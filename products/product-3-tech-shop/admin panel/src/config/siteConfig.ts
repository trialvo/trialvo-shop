import {
  APP_UI_THEMES,
  resolveAppVertical,
  type AppUiTheme,
  type AppVertical,
} from "./appTheme";

export type ThemeMode = "light" | "dark";

export type SiteConfig = {
  /** Active product vertical (lifestyle / fashion / tech / default). */
  vertical: AppVertical;
  /** Shown in page titles, sidebar header etc. */
  appName: string;
  /** Optional shorter name (compact UI if needed). */
  appShortName?: string;
  /** Auth panel supporting copy */
  authTagline: string;

  /** Brand assets (public path like /images/... or full URL). */
  logoLightUrl: string;
  logoDarkUrl: string;
  /** Small mark/icon used in collapsed sidebar etc. */
  logoIconUrl: string;
  /** Optional auth page logo. If omitted, logoIconUrl will be used. */
  authLogoUrl?: string;

  faviconUrl: string;
  faviconDarkUrl?: string;
  appleTouchIconUrl?: string;
  defaultOgImageUrl?: string;

  /** Title template: <Page> <separator> <App>. */
  titleSeparator: string;

  /** Default meta description used when a page does not provide one. */
  defaultDescription: string;

  /** Default theme when no saved value exists. */
  defaultTheme: ThemeMode;

  /** Used in meta theme-color (browser UI color). */
  themeColorLight: string;
  themeColorDark: string;
};

type RuntimeAppConfig = {
  API_ORIGIN?: string;
  IMAGE_URL?: string;
  API_PREFIX?: string;
  APP_VERTICAL?: string;
  APP_NAME?: string;
  APP_SHORT_NAME?: string;
};

function readRuntimeConfig(): RuntimeAppConfig {
  if (typeof window === "undefined") return {};
  const w = window as unknown as { __APP_CONFIG__?: RuntimeAppConfig };
  return w.__APP_CONFIG__ ?? {};
}

function readViteVertical(): string | undefined {
  try {
    return import.meta.env.VITE_APP_VERTICAL as string | undefined;
  } catch {
    return undefined;
  }
}

function readViteAppName(): string | undefined {
  try {
    return import.meta.env.VITE_APP_NAME as string | undefined;
  } catch {
    return undefined;
  }
}

const runtime = readRuntimeConfig();
const vertical = resolveAppVertical(
  runtime.APP_VERTICAL || readViteVertical() || "default",
);
const uiTheme: AppUiTheme = APP_UI_THEMES[vertical];

/**
 * ✅ Single source of truth for admin branding + vertical UI theme.
 * Override per deployment with env / window.__APP_CONFIG__ (trial images).
 */
export const siteConfig: SiteConfig = {
  vertical,
  appName: runtime.APP_NAME || readViteAppName() || uiTheme.appName,
  appShortName: runtime.APP_SHORT_NAME || uiTheme.appShortName,
  authTagline: uiTheme.authTagline,

  // Logo URLs kept for optional future image override; UI uses BrandLogo wordmark by default.
  logoLightUrl: "",
  logoDarkUrl: "",
  logoIconUrl: "",
  authLogoUrl: "",

  faviconUrl: "/favicon.ico",
  faviconDarkUrl: "/favicon-dark.ico",

  titleSeparator: "|",

  defaultDescription:
    "Admin dashboard for managing products, orders, customers, and settings.",

  defaultTheme: "light",

  themeColorLight: uiTheme.themeColorLight,
  themeColorDark: uiTheme.themeColorDark,
};

/** Active UI theme tokens for the resolved vertical */
export const activeUiTheme: AppUiTheme = uiTheme;

/** LocalStorage keys used across the app (keep centralized). */
export const storageKeys = {
  theme: "theme",
  /** Bumped to drop stale product-specific names (Trialvo / Graduate Fashion). */
  branding: "app_branding_v2",
} as const;
