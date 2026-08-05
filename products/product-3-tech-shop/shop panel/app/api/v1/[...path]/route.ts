import { NextResponse, type NextRequest } from "next/server";

import { API_URL } from "@/config/env";

const API_TIMEOUT_MS = 20000;

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
    normalized === "transfer-encoding"
  );
};

const buildForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!shouldSkipRequestHeader(key)) headers.set(key, value);
  });
  if (!headers.has("Authorization")) {
    const token =
      request.cookies.get("access_token")?.value?.trim() ||
      request.cookies.get("token")?.value?.trim();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

async function handler(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;

  if (!API_URL?.trim()) {
    return NextResponse.json({ error: "Missing API_URL" }, { status: 500 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(getBackendUrl(request, path), {
      method: request.method,
      headers: buildForwardHeaders(request),
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      signal: controller.signal,
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      if (!shouldSkipResponseHeader(key)) responseHeaders.set(key, value);
    });

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
