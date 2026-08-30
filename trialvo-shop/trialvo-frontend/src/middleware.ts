import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * A returning visitor's own choice wins; everyone else gets DEFAULT_LOCALE.
 *
 * Accept-Language is deliberately not consulted. Most browsers in this market
 * send `bn`, so sniffing it would send nearly every first-time visitor to the
 * Bangla site and make the default unreachable. The language switcher writes
 * the cookie, so an explicit preference still persists for a year.
 */
function detectLocale(request: NextRequest) {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/").filter(Boolean)[0];
  if (isLocale(first)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|robots.txt|sitemap.xml).*)"],
};
