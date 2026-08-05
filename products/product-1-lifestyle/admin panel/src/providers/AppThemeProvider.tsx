import { useEffect } from "react";
import { activeUiTheme, siteConfig } from "@/config/siteConfig";
import { applyBrandCssVariables } from "@/config/appTheme";

/**
 * Applies vertical brand CSS variables once at app root.
 * UI-only — no impact on API or business logic.
 */
export function AppThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    applyBrandCssVariables(activeUiTheme.brand);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", siteConfig.themeColorLight);
    } else {
      const el = document.createElement("meta");
      el.name = "theme-color";
      el.content = siteConfig.themeColorLight;
      document.head.appendChild(el);
    }
  }, []);

  return children;
}

export default AppThemeProvider;
