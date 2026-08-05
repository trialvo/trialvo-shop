// Keep trailing slash — next.config trailingSlash:true 308s POSTs without it
// and browsers/proxies can drop the body on redirect.
const DEFAULT_GOOGLE_CALLBACK_PATH = "/api/auth/google/callback/";

const normalizeCallbackPath = (value: string | undefined): string => {
  if (!value) return DEFAULT_GOOGLE_CALLBACK_PATH;

  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_GOOGLE_CALLBACK_PATH;

  let pathOnly = trimmed;

  try {
    const parsed = new URL(trimmed);
    pathOnly = parsed.pathname || "/";
  } catch {
    pathOnly = trimmed;
  }

  const noQueryOrHash = pathOnly.split("?")[0]?.split("#")[0] ?? "";
  if (!noQueryOrHash || noQueryOrHash === "/") return DEFAULT_GOOGLE_CALLBACK_PATH;

  const withLeadingSlash = noQueryOrHash.startsWith("/")
    ? noQueryOrHash
    : `/${noQueryOrHash}`;
  const withoutTrailing = withLeadingSlash.replace(/\/+$/, "");
  const normalized = `${withoutTrailing}/`;

  return normalized || DEFAULT_GOOGLE_CALLBACK_PATH;
};

export const GOOGLE_CALLBACK_PATH = normalizeCallbackPath(
  "/api/auth/google/callback/",
);

export const GOOGLE_AUTH_API_PATH = GOOGLE_CALLBACK_PATH;

export const getWindowOrigin = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.location.origin.replace(/\/+$/, "");
};
