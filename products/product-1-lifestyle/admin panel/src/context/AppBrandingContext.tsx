import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { siteConfig, storageKeys, type SiteConfig } from "../config/siteConfig";

export type AppBranding = Pick<
  SiteConfig,
  | "appName"
  | "appShortName"
  | "authTagline"
  | "logoLightUrl"
  | "logoDarkUrl"
  | "logoIconUrl"
  | "authLogoUrl"
  | "faviconUrl"
  | "faviconDarkUrl"
  | "appleTouchIconUrl"
  | "defaultOgImageUrl"
  | "titleSeparator"
  | "defaultDescription"
  | "themeColorLight"
  | "themeColorDark"
>;

type AppBrandingContextType = {
  branding: AppBranding;
  /** Update branding (persisted to localStorage). */
  setBranding: (
    next: Partial<AppBranding> | ((prev: AppBranding) => AppBranding),
  ) => void;
  /** Reset branding back to siteConfig defaults. */
  resetBranding: () => void;
};

const AppBrandingContext = createContext<AppBrandingContextType | undefined>(
  undefined,
);

const safeParse = (raw: string | null): Partial<AppBranding> | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<AppBranding>;
  } catch {
    return null;
  }
};

const getDefaultBranding = (): AppBranding => ({
  appName: siteConfig.appName,
  appShortName: siteConfig.appShortName,
  authTagline: siteConfig.authTagline,
  logoLightUrl: siteConfig.logoLightUrl,
  logoDarkUrl: siteConfig.logoDarkUrl,
  logoIconUrl: siteConfig.logoIconUrl,
  authLogoUrl: siteConfig.authLogoUrl,
  faviconUrl: siteConfig.faviconUrl,
  faviconDarkUrl: siteConfig.faviconDarkUrl,
  appleTouchIconUrl: siteConfig.appleTouchIconUrl,
  defaultOgImageUrl: siteConfig.defaultOgImageUrl,
  titleSeparator: siteConfig.titleSeparator,
  defaultDescription: siteConfig.defaultDescription,
  themeColorLight: siteConfig.themeColorLight,
  themeColorDark: siteConfig.themeColorDark,
});

export const AppBrandingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [branding, setBrandingState] = useState<AppBranding>(
    getDefaultBranding(),
  );

  useEffect(() => {
    // Drop legacy product-branded localStorage so UI stays generic
    try {
      localStorage.removeItem("app_branding");
    } catch {
      /* ignore */
    }
    const stored = safeParse(localStorage.getItem(storageKeys.branding));
    if (stored) {
      setBrandingState((prev) => ({ ...prev, ...stored }));
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKeys.branding) return;
      const next = safeParse(e.newValue);
      setBrandingState({ ...getDefaultBranding(), ...(next ?? {}) });
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setBranding = useCallback(
    (next: Partial<AppBranding> | ((prev: AppBranding) => AppBranding)) => {
      setBrandingState((prev) => {
        const resolved =
          typeof next === "function" ? next(prev) : { ...prev, ...next };
        localStorage.setItem(storageKeys.branding, JSON.stringify(resolved));
        return resolved;
      });
    },
    [],
  );

  const resetBranding = useCallback(() => {
    localStorage.removeItem(storageKeys.branding);
    setBrandingState(getDefaultBranding());
  }, []);

  const value = useMemo<AppBrandingContextType>(
    () => ({ branding, setBranding, resetBranding }),
    [branding, resetBranding, setBranding],
  );

  return (
    <AppBrandingContext.Provider value={value}>
      {children}
    </AppBrandingContext.Provider>
  );
};

export const useAppBranding = () => {
  const context = useContext(AppBrandingContext);
  if (!context) {
    throw new Error("useAppBranding must be used within an AppBrandingProvider");
  }
  return context;
};
