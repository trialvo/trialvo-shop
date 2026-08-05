import { api } from "./client";

// ─── System Permission Config ───────────────────────────────────────────── //

// The backend returns a nested object: { section: { key: value } }
// or for scoped sections:             { section: { scope: { key: value } } }
export type PermissionConfigData = Record<string, Record<string, unknown>>;

export type GetPermissionConfigResponse = {
  success: true;
  data: PermissionConfigData;
};

// patchPermissionConfig sends the same nested object shape
export type PatchPermissionConfigPayload = PermissionConfigData;

export async function getPermissionConfig(): Promise<GetPermissionConfigResponse> {
  const res = await api.get("/config/getPermissionConfig");
  return res.data;
}

export async function patchPermissionConfig(
  payload: PatchPermissionConfigPayload
): Promise<{ success: true; message: string }> {
  const res = await api.patch("/config/patchPermissionConfig", payload);
  return res.data;
}
