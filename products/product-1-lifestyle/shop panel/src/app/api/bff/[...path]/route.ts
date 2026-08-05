import { NextResponse, type NextRequest } from "next/server";

import { API_URL } from "@/config/env";
import { AUTH_COOKIE_KEYS } from "@/lib/auth/session";
import {
  extractAuthSessionPayload,
  stripAccessToken,
} from "@/lib/auth/session-payload";
import { setAuthSessionCookies } from "@/lib/auth/server-session";

const API_TIMEOUT_MS = 20000;
const AUTH_SESSION_ENDPOINTS = new Set([
  "user/login",
  "user/verifyEmailOtp",
  "user/resetPasswordbyOtp",
]);

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const normalizeApiBase = (value: string): string =>
  value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "");

const getBackendUrl = (request: NextRequest, path: string[]) => {
  const apiBase = normalizeApiBase(API_URL);
  const safePath = path.map(encodeURIComponent).join("/");
  const url = new URL(`${apiBase}/api/v1/${safePath}`);
  url.search = request.nextUrl.search;
  return url;
};

const shouldSkipRequestHeader = (key: string) => {
  const normalized = key.toLowerCase();
  return (
    normalized === "host" ||
    normalized === "connection" ||
    normalized === "content-length" ||
    normalized === "cookie" ||
    normalized === "accept-encoding"
  );
};

const shouldSkipResponseHeader = (key: string) => {
  const normalized = key.toLowerCase();
  return (
    normalized === "content-encoding" ||
    normalized === "content-length" ||
    normalized === "set-cookie" ||
    normalized === "transfer-encoding"
  );
};

const buildForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!shouldSkipRequestHeader(key)) headers.set(key, value);
  });

  const token = request.cookies.get(AUTH_COOKIE_KEYS.access)?.value.trim();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return headers;
};

const getRequestBody = async (request: NextRequest) => {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  return request.arrayBuffer();
};

const copyResponseHeaders = (backendResponse: Response) => {
  const headers = new Headers();

  backendResponse.headers.forEach((value, key) => {
    if (!shouldSkipResponseHeader(key)) headers.set(key, value);
  });

  return headers;
};

const parseJsonSafe = async (response: Response): Promise<unknown | null> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

async function handler(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const endpoint = path.join("/");

  if (!API_URL?.trim()) {
    return NextResponse.json(
      { error: "Missing API_URL configuration" },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(getBackendUrl(request, path), {
      method: request.method,
      headers: buildForwardHeaders(request),
      body: await getRequestBody(request),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Backend request timed out"
        : "Backend request failed";

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const headers = copyResponseHeaders(backendResponse);
  const contentType = backendResponse.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers,
    });
  }

  const data = await parseJsonSafe(backendResponse);
  const session =
    backendResponse.ok && AUTH_SESSION_ENDPOINTS.has(endpoint)
      ? extractAuthSessionPayload(data)
      : null;

  const response = NextResponse.json(
    session ? stripAccessToken(data) : data ?? {},
    {
      status: backendResponse.status,
      headers,
    },
  );

  if (session) setAuthSessionCookies(response, session);

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
