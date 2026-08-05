import { OAuth2Client, type Credentials } from "google-auth-library";
import { NextResponse } from "next/server";
import { SITE_URL, SHOP_URL, APP_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, API_URL } from "@/config/env";

type Body = {
  code?: string;
  idToken?: string;
  redirectUri?: string;
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const code = body.code?.trim();
    const directIdToken = body.idToken?.trim();
    const bodyRedirectUri = toOrigin(body.redirectUri);

    if (!code && !directIdToken) {
      return NextResponse.json(
        { error: "Missing Google auth data" },
        { status: 400 },
      );
    }

    const clientId =
      GOOGLE_CLIENT_ID?.trim();
    const clientSecret = GOOGLE_CLIENT_SECRET;
    const apiBaseRaw = API_URL;

    if (!clientId) {
      return NextResponse.json(
        { error: "Missing GOOGLE_CLIENT_ID" },
        { status: 500 },
      );
    }

    if (!apiBaseRaw) {
      return NextResponse.json(
        { error: "Missing API_URL or NEXT_PUBLIC_API_URL" },
        { status: 500 },
      );
    }

    const apiBase = normalizeApiBase(apiBaseRaw);

    let idToken: string | null = directIdToken ?? null;
    let accessToken: string | null = null;
    let usedCode: string | undefined = undefined;

    if (!idToken && code) {
      if (!clientSecret) {
        return NextResponse.json(
          { error: "Missing GOOGLE_CLIENT_SECRET for auth code flow" },
          { status: 500 },
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
        return NextResponse.json({ error: friendly }, { status: 400 });
      }

      idToken = tokens.id_token?.trim() ?? null;
      accessToken = tokens.access_token?.trim() ?? null;
      usedCode = code;
    }

    if (!idToken) {
      return NextResponse.json(
        { error: "Google did not return an ID token. Please try again." },
        { status: 400 },
      );
    }

    const verifier = new OAuth2Client(clientId);
    await verifier.verifyIdToken({
      idToken,
      audience: clientId,
    });

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
        return NextResponse.json(
          {
            error:
              msg.toLowerCase() === "fetch failed"
                ? "Auth backend is unreachable. Please try again in a moment."
                : msg,
          },
          { status: 502 },
        );
      }
    }

    const data = await parseJsonSafe<unknown>(backendRes);
    return NextResponse.json(data ?? { error: "Invalid backend response" }, {
      status: backendRes.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Google auth failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
