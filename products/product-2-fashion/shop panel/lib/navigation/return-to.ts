/** sessionStorage key — keeps edit return path without polluting the URL. */
export const EDIT_RETURN_STORAGE_KEY = "shop:edit-return-to";

/**
 * Only allow in-app relative paths so open redirects cannot sneak in.
 * Example: "/account", "/checkout", "/account/address"
 */
export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  const trimmed = decoded.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("://")
  ) {
    return fallback;
  }

  return trimmed;
}

/** Remember where the user came from before opening an edit screen. */
export function rememberReturnPath(path: string): void {
  if (typeof window === "undefined") return;

  const safe = sanitizeReturnTo(path, "");
  if (!safe) return;

  try {
    sessionStorage.setItem(EDIT_RETURN_STORAGE_KEY, safe);
  } catch {
    // private mode / quota — ignore
  }
}

/** Read the stored return path without clearing it (for back links). */
export function peekReturnPath(fallback: string): string {
  if (typeof window === "undefined") return fallback;

  try {
    return sanitizeReturnTo(
      sessionStorage.getItem(EDIT_RETURN_STORAGE_KEY),
      fallback,
    );
  } catch {
    return fallback;
  }
}

/** Read and clear the stored return path (for save/cancel navigation). */
export function consumeReturnPath(fallback: string): string {
  const path = peekReturnPath(fallback);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(EDIT_RETURN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return path;
}
