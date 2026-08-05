import { api } from "./client";

export type PolicySummary = {
  id: number;
  policy_key: string;
  title: string;
  bd_title: string | null;
  content_type: "html" | "text";
  status: 0 | 1;
  updated_by_admin: number | null;
  created_at: string;
  updated_at: string;
};

export type PolicyFull = PolicySummary & {
  content: string | null;
  deleted_at: string | null;
};

export type UpsertPolicyBody = {
  policy_key: string;
  title: string;
  bd_title?: string | null;
  content: string;
  content_type?: "html" | "text";
  status?: 0 | 1;
};

/** Admin: list all policies (non-deleted) */
export async function getPolicies(): Promise<PolicySummary[]> {
  const res = await api.get("/admin/policies");
  return res.data.data; // { success, data: [] }
}

/** Admin: get single policy with content */
export async function getPolicyByKey(key: string): Promise<PolicyFull> {
  const res = await api.get(`/admin/policy/${key}`);
  return res.data.data; // { success, data: {} }
}

/** Admin: create or update policy (upsert by policy_key) */
export async function savePolicy(
  body: UpsertPolicyBody
): Promise<{ success: true; data: { id: number; policy_key: string } }> {
  const res = await api.post("/admin/policy", body);
  return res.data;
}

/** Admin: soft-delete policy */
export async function deletePolicy(
  key: string
): Promise<{ success: true }> {
  const res = await api.delete(`/admin/policy/${key}`);
  return res.data;
}

export type PatchPolicyBody = {
  title?: string;
  bd_title?: string | null;
  content?: string;
  content_type?: "html" | "text";
  status?: 0 | 1;
};

/** Admin: partial update — only sends the fields you provide */
export async function patchPolicy(
  key: string,
  body: PatchPolicyBody
): Promise<{ success: true; data: { policy_key: string } }> {
  const res = await api.patch(`/admin/policy/${key}`, body);
  return res.data;
}

/** Public: list active policies (no content) */
export async function getPublicPolicies(): Promise<
  Pick<PolicySummary, "policy_key" | "title" | "updated_at">[]
> {
  const res = await api.get("/policies");
  return res.data.data;
}

/** Public: get single active policy with content */
export async function getPublicPolicyByKey(
  key: string
): Promise<Pick<PolicyFull, "policy_key" | "title" | "content" | "content_type" | "updated_at">> {
  const res = await api.get(`/policy/${key}`);
  return res.data.data;
}
