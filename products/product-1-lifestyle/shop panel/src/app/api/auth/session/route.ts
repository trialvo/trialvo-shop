import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_KEYS, AUTH_SESSION_SECONDS } from "@/lib/auth/session";
import { clearAuthSessionCookies } from "@/lib/auth/server-session";

/**
 * GET /api/auth/session
 *
 * Returns whether the caller has a valid httpOnly access-token cookie.
 * If the token cookie exists but the client-readable session marker is
 * missing (e.g. it was cleared independently), the marker is re-set so
 * the client can recognise the authenticated state without an extra
 * round-trip on subsequent loads.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_KEYS.access)?.value?.trim();
  const hasToken = Boolean(token);

  const response = NextResponse.json({ authenticated: hasToken });

  if (hasToken) {
    const marker = request.cookies.get(AUTH_COOKIE_KEYS.marker)?.value?.trim();

    if (!marker) {
      response.cookies.set(AUTH_COOKIE_KEYS.marker, "1", {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
        maxAge: AUTH_SESSION_SECONDS,
      });
    }
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAuthSessionCookies(response);
  return response;
}

export async function POST() {
  return NextResponse.json(
    { error: "Session creation must happen through a verified auth response." },
    { status: 405 },
  );
}
