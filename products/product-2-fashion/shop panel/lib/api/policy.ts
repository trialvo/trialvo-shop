/**
 * Server-side fetch helpers for public policy API.
 * These run on the server (RSC / generateMetadata) using the BFF rewrite.
 */

import { API_URL } from "@/config/env";

const API_BASE = `${API_URL.replace(/\/+$/, "")}/api/v1`;

export type PolicySummary = {
  policy_key: string;
  title: string;
  bd_title: string | null;
  updated_at: string;
};

export type PolicyData = PolicySummary & {
  content: string | null;
  content_type: "html" | "text";
};

/** Fetch all active policies (no content) — for footer links */
export async function fetchPublicPolicies(): Promise<PolicySummary[]> {
  try {
    const res = await fetch(`${API_BASE}/policies`, {
      next: { revalidate: 60 }, // revalidate every 60 seconds in production
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

/** Fetch a single active policy with content — for policy detail page */
export async function fetchPublicPolicyByKey(
  key: string
): Promise<PolicyData | null> {
  try {
    const res = await fetch(`${API_BASE}/policy/${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}
