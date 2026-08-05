"use client";
// lib/reportTokenStore.ts — V2-036
//
// Persists submitted report tokens in a browser cookie so guest / signed-out
// users can always find their tokens on /track-report without having to
// remember them. Tokens are stored as a JSON array, capped at MAX_TOKENS (20)
// newest-first. Uses js-cookie (already in project).

import Cookies from "js-cookie";

const COOKIE_KEY   = "gf_report_tokens";
const COOKIE_DAYS  = 365;           // 1 year expiry
const MAX_TOKENS   = 20;            // prevent cookie bloat

export type SavedToken = {
  token:        string;   // 32-char hex tracking token
  report_id:    number;   // numeric report ID
  subject:      string;   // truncated subject (≤80 chars) for display
  submitted_at: string;   // ISO date string
};

// ─── Private helpers ──────────────────────────────────────────────────────── //

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readCookie(): SavedToken[] {
  if (!isBrowser()) return [];
  try {
    const raw = Cookies.get(COOKIE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedToken[];
  } catch {
    return [];
  }
}

function writeCookie(tokens: SavedToken[]): void {
  if (!isBrowser()) return;
  try {
    Cookies.set(COOKIE_KEY, JSON.stringify(tokens), {
      expires:  COOKIE_DAYS,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
    });
  } catch {
    // cookie too large — trim and retry once
    const trimmed = tokens.slice(0, Math.floor(MAX_TOKENS / 2));
    Cookies.set(COOKIE_KEY, JSON.stringify(trimmed), {
      expires:  COOKIE_DAYS,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────── //

/**
 * Save a newly submitted report token.
 * Deduplicates by token and prepends to the list.
 */
export function saveReportToken(entry: SavedToken): void {
  const existing = readCookie().filter((t) => t.token !== entry.token);
  const updated  = [entry, ...existing].slice(0, MAX_TOKENS);
  writeCookie(updated);
}

/** Return all saved tokens, newest-first. */
export function getSavedReportTokens(): SavedToken[] {
  return readCookie();
}

/** Remove a single token (e.g. after user decides to clear it). */
export function removeReportToken(token: string): void {
  const updated = readCookie().filter((t) => t.token !== token);
  writeCookie(updated);
}

/** Clear all saved report tokens. */
export function clearAllReportTokens(): void {
  if (!isBrowser()) return;
  Cookies.remove(COOKIE_KEY, { path: "/" });
}
