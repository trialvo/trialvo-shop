import { NextResponse, type NextRequest } from "next/server";

import { API_URL } from "@/config/env";
import { AUTH_COOKIE_KEYS } from "@/lib/auth/session";
import {
  extractAuthSessionPayload,
  stripAccessToken,
} from "@/lib/auth/session-payload";
import { setAuthSessionCookies } from "@/lib/auth/server-session";

const API_TIMEOUT_MS = 20000;
const AUTH_SESSION_RESPONSE_PATHS = new Set([
  "user/login",
  "user/verifyEmailOtp",
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
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

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

const getForwardPath = (path: string[]) => path.join("/");

const shouldPersistAuthSession = (
  method: string,
  path: string[],
  response: Response,
) =>
  method !== "GET" &&
  response.ok &&
  AUTH_SESSION_RESPONSE_PATHS.has(getForwardPath(path));

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function handler(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;

  if (!API_URL?.trim()) {
    return NextResponse.json(
      { error: "Missing API_URL in src/config/env.ts" },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(getBackendUrl(request, path), {
      method: request.method,
      headers: buildForwardHeaders(request),
      body: await getRequestBody(request),
      cache: "no-store",
      signal: controller.signal,
    });
    const responseHeaders = copyResponseHeaders(backendResponse);

    if (shouldPersistAuthSession(request.method, path, backendResponse)) {
      const data = await parseJsonSafe<unknown>(backendResponse.clone());
      const session = extractAuthSessionPayload(data);

      if (session) {
        const response = NextResponse.json(stripAccessToken(data), {
          status: backendResponse.status,
          headers: responseHeaders,
        });
        setAuthSessionCookies(response, session);
        return response;
      }
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
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
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
