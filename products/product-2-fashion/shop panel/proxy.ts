import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SITE_URL, SHOP_URL } from "@/config/env";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/products",
  "/category",
  "/verify-identify",
  "/checkout",
  "/about",
  "/contact-us",
  "/track-report",
  "/faqs",
  "/policy",
  "/offers",
  "/megasale",
  "/compare",
  "/single-order-page",
] as const;

const AUTH_ROUTES = ["/sign-in", "/sign-up"] as const;

const toUrl = (value: string | undefined): URL | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return parsed;
  } catch {
    return null;
  }
};

const getCanonicalTarget = (): URL | null => {
  const candidates = [
    SITE_URL,
    SHOP_URL,
  ];

  for (const value of candidates) {
    const parsed = toUrl(value);
    if (parsed) return parsed;
  }

  return null;
};

const getRequestHost = (request: NextRequest): string => {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  if (forwardedHost) return forwardedHost.toLowerCase();
  const host = request.headers.get("host") ?? request.nextUrl.host;
  return host.toLowerCase();
};

const getRequestProtocol = (request: NextRequest): "http" | "https" => {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  if (forwardedProto === "http" || forwardedProto === "https")
    return forwardedProto;

  return request.nextUrl.protocol === "http:" ? "http" : "https";
};

const isLocalHost = (host: string): boolean => {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
};

const isSeoAssetPath = (pathname: string): boolean => {
  const normalized =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  if (normalized === "/robots.txt") return true;
  if (normalized === "/sitemap.xml") return true;
  if (normalized === "/manifest.webmanifest") return true;
  if (normalized === "/site.webmanifest") return true;
  if (normalized === "/ads.txt") return true;
  if (normalized === "/security.txt") return true;
  if (normalized === "/humans.txt") return true;

  return /^\/sitemap(?:[-\w/]+)?\.xml$/i.test(normalized);
};

const isPathMatch = (pathname: string, route: string) => {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
};

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some((route) => isPathMatch(pathname, route));

const isAuthRoute = (pathname: string) =>
  AUTH_ROUTES.some((route) => isPathMatch(pathname, route));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Storefront /admin → product admin portal (Opt1 shared demo / trial)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminBase = (
      process.env.ADMIN_URL ||
      process.env.NEXT_PUBLIC_ADMIN_URL ||
      "http://localhost:5174"
    )
      .trim()
      .replace(/\/+$/, "");
    const suffix = pathname === "/admin" ? "" : pathname.slice("/admin".length);
    return NextResponse.redirect(new URL(`${adminBase}${suffix}`));
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    isSeoAssetPath(pathname) ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const canonical = getCanonicalTarget();

  if (canonical && process.env.NODE_ENV === "production") {
    const currentHost = getRequestHost(request);
    const currentProtocol = getRequestProtocol(request);
    const canonicalHost = canonical.host.toLowerCase();
    const canonicalProtocol = canonical.protocol === "http:" ? "http" : "https";

    if (
      !isLocalHost(currentHost) &&
      (currentHost !== canonicalHost || currentProtocol !== canonicalProtocol)
    ) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.hostname = canonical.hostname;
      nextUrl.port = canonical.port;
      nextUrl.protocol = canonical.protocol;
      return NextResponse.redirect(nextUrl, 308);
    }
  }

  const token = request.cookies.get("ecom_access_token")?.value?.trim();
  const hasToken = !!token;

  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);

  if (hasToken && isAuth) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  if (!hasToken && !isPublic) {
    const url = new URL("/sign-in", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
  ],
};
