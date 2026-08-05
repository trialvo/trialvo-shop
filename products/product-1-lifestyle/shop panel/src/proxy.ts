import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_KEYS,
  AUTH_PROTECTED_PREFIXES,
  AUTH_PUBLIC_ONLY_PREFIXES,
  AUTH_ROUTE_PATHS,
  isPathWithPrefix,
} from "@/lib/auth/session";

const toSafePath = (value: string | null): string | null => {
  if (!value?.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
};

const getRedirectTarget = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  return `${pathname}${search}`;
};

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_COOKIE_KEYS.access)?.value.trim();
  const isAuthenticated = Boolean(accessToken);

  if (
    !isAuthenticated &&
    isPathWithPrefix(pathname, AUTH_PROTECTED_PREFIXES)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTE_PATHS.signIn;
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", getRedirectTarget(request));

    return NextResponse.redirect(redirectUrl);
  }

  if (
    isAuthenticated &&
    isPathWithPrefix(pathname, AUTH_PUBLIC_ONLY_PREFIXES)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      toSafePath(searchParams.get("next")) ?? AUTH_ROUTE_PATHS.home;
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  if (isAuthenticated) {
    requestHeaders.set("x-authenticated", "true");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/account/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/settings/:path*",
    "/auth/:path*",
  ],
};
