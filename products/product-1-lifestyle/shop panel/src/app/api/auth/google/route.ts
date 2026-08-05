import { OAuth2Client, type Credentials } from "google-auth-library";
import { NextResponse, type NextRequest } from "next/server";

import {
  API_URL,
  APP_URL,
  GOOGLE_CLIENT_ID,
  SHOP_URL,
  SITE_URL,
} from "@/config/env";
import { AUTH_COOKIE_KEYS } from "@/lib/auth/session";
import {
  extractAuthSessionPayload,
  stripAccessToken,
} from "@/lib/auth/session-payload";
import {
  clearGoogleOAuthStateCookie,
  setAuthSessionCookies,
} from "@/lib/auth/server-session";

type Body = {
  code?: string;
  idToken?: string;
  redirectUri?: string;
  state?: string;
};

type BackendPayload = {
  code?: string;
  id_token?: string | null;
  access_token?: string | null;
};

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

const normalizeApiBase = (value: string): string =>
  value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "");

const toOrigin = (value: string | null | undefined): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
};

const pickRedirectUri = (req: Request): string => {
  const originHeader = toOrigin(req.headers.get("origin"));
  if (originHeader) return originHeader;

  const refererHeader = toOrigin(req.headers.get("referer"));
  if (refererHeader) return refererHeader;

  const envCandidates = [
    SITE_URL,
    SHOP_URL,
    APP_URL,
  ];

  for (const candidate of envCandidates) {
    const parsed = toOrigin(candidate);
    if (parsed) return parsed;
  }

  return "http://localhost:3000";
};

const jsonResponse = (data: unknown, status = 200) => {
  const response = NextResponse.json(data, { status });
  clearGoogleOAuthStateCookie(response);
  return response;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const code = body.code?.trim();
    const directIdToken = body.idToken?.trim();
    const bodyRedirectUri = toOrigin(body.redirectUri);
    const state = body.state?.trim();
    const cookieState = req.cookies
      .get(AUTH_COOKIE_KEYS.googleOAuthState)
      ?.value.trim();

    if (!state || !cookieState || state !== cookieState) {
      return jsonResponse({ error: "Invalid Google sign-in state" }, 403);
    }

    if (!code && !directIdToken) {
      return jsonResponse(
        { error: "Missing Google auth data" },
        400,
      );
    }

    const clientId = GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const apiBaseRaw = API_URL;

    if (!clientId) {
      return jsonResponse(
        { error: "Missing GOOGLE_CLIENT_ID" },
        500,
      );
    }

    if (!apiBaseRaw) {
      return jsonResponse(
        { error: "Missing API_URL in src/config/env.ts" },
        500,
      );
    }

    const apiBase = normalizeApiBase(apiBaseRaw);

    let idToken: string | null = directIdToken ?? null;
    let accessToken: string | null = null;
    let usedCode: string | undefined = undefined;

    if (!idToken && code) {
      if (!clientSecret) {
        return jsonResponse(
          { error: "Missing GOOGLE_CLIENT_SECRET for auth code flow" },
          500,
        );
      }

      const redirectUri = bodyRedirectUri ?? pickRedirectUri(req);
      const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);
      let tokens: Credentials;
      try {
        const tokenRes = await oauthClient.getToken({
          code,
          redirect_uri: redirectUri,
        });
        tokens = tokenRes.tokens;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Google token exchange failed";
        const friendly = /redirect_uri_mismatch/i.test(msg)
          ? "Google redirect URI mismatch. Verify authorized redirect URIs in Google Cloud Console."
          : msg;
        return jsonResponse({ error: friendly }, 400);
      }

      idToken = tokens.id_token?.trim() ?? null;
      accessToken = tokens.access_token?.trim() ?? null;
      usedCode = code;
    }

    if (!idToken) {
      return jsonResponse(
        { error: "Google did not return an ID token. Please try again." },
        400,
      );
    }

    const verifier = new OAuth2Client(clientId);
    try {
      await verifier.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch {
      return jsonResponse({ error: "Invalid Google identity token" }, 401);
    }

    const payload: BackendPayload = {
      code: usedCode,
      id_token: idToken,
      access_token: accessToken,
    };

    const callBackend = async (): Promise<Response> => {
      const backendController = new AbortController();
      const backendTimeout = setTimeout(() => backendController.abort(), 15000);

      try {
        return await fetch(`${apiBase}/api/v1/user/gauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gauthToken: payload.id_token,
          }),
          signal: backendController.signal,
        });
      } finally {
        clearTimeout(backendTimeout);
      }
    };

    let backendRes: Response;
    try {
      backendRes = await callBackend();
    } catch {
      // Retry once for transient upstream connectivity issues.
      try {
        backendRes = await callBackend();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Upstream auth request failed";
        return jsonResponse(
          {
            error:
              msg.toLowerCase() === "fetch failed"
                ? "Auth backend is unreachable. Please try again in a moment."
                : msg,
          },
          502,
        );
      }
    }

    const data = await parseJsonSafe<unknown>(backendRes);
    const session = backendRes.ok ? extractAuthSessionPayload(data) : null;
    const response = jsonResponse(
      session
        ? stripAccessToken(data)
        : data ?? { error: "Invalid backend response" },
      backendRes.status,
    );

    if (session) setAuthSessionCookies(response, session);

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Google auth failed";
    return jsonResponse({ error: msg }, 500);
  }
}
