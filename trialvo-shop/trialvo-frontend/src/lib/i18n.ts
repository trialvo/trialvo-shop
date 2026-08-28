export const LOCALES = ["bn", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "bn";

export const LOCALE_HTML: Record<Locale, string> = {
  bn: "bn",
  en: "en",
};

export const LOCALE_OG: Record<Locale, string> = {
  bn: "bn_BD",
  en: "en_US",
};

export const LOCALE_HREFLANG: Record<Locale, string> = {
  bn: "bn-BD",
  en: "en-US",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "bn" || value === "en";
}

export function parsePathname(pathname: string): { locale: Locale; path: string } {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  if (isLocale(first)) {
    const rest = parts.slice(1).join("/");
    return { locale: first, path: rest ? `/${rest}` : "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

function splitHref(href: string): { path: string; suffix: string } {
  const hashIndex = href.indexOf("#");
  const queryIndex = href.indexOf("?");
  let cut = href.length;
  if (queryIndex >= 0) cut = queryIndex;
  if (hashIndex >= 0 && hashIndex < cut) cut = hashIndex;
  return { path: href.slice(0, cut) || "/", suffix: href.slice(cut) };
}

export function localePath(locale: Locale, href: string): string {
  if (!href) return `/${locale}`;
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }

  const { path, suffix } = splitHref(href);
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith("/admin") || clean.startsWith("/_next")) {
    return `${clean}${suffix}`;
  }

  const { path: stripped } = parsePathname(clean);
  if (stripped === "/") return `/${locale}${suffix}`;
  return `/${locale}${stripped}${suffix}`;
}

export function absoluteUrl(locale: Locale, href: string, siteUrl: string): string {
  const path = localePath(locale, href);
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}
