import { api } from "./client";

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type FirebaseCredential = {
  id: number;
  project_id: string | null;
  client_email: string | null;
  credential_json_display: Record<string, unknown> | null;
  has_credential_json: boolean;
  is_active: boolean;
  has_client_config: boolean;
  client_config: FirebaseClientConfig | null;
  has_vapid_key: boolean;
  vapid_key: string | null;
  created_at: string;
  updated_at: string;
};

export type GetFirebaseCredentialResponse = {
  success: true;
  data: FirebaseCredential | null;
};

export type ToggleFirebaseCredentialResponse = {
  success: boolean;
  data: { id: number; is_active: boolean };
  message: string;
};

export type FirebaseClientConfigResponse = {
  success: boolean;
  data: {
    firebase_config: FirebaseClientConfig;
    vapid_key: string | null;
  } | null;
};

export async function getFirebaseCredential(): Promise<FirebaseCredential | null> {
  const res = await api.get<GetFirebaseCredentialResponse>("/config/firebase-credential");
  return res.data.data ?? null;
}

export async function saveFirebaseCredential(payload: {
  credential_json?: Record<string, unknown>;
  client_config?: Record<string, unknown>;
  vapid_key?: string;
}): Promise<{ success: true; message: string }> {
  const res = await api.post("/config/firebase-credential", payload);
  return res.data;
}

export async function toggleFirebaseCredential(): Promise<ToggleFirebaseCredentialResponse> {
  const res = await api.patch("/config/firebase-credential/toggle");
  return res.data;
}

export async function clearFirebaseCredential(): Promise<{ success: true; message: string }> {
  const res = await api.delete("/config/firebase-credential");
  return res.data;
}

/**
 * V2-050: Public endpoint (no auth) — fetches Firebase client config + VAPID key.
 * Called from firebase.ts at runtime to initialize the SDK.
 */
export async function fetchFirebaseClientConfig(): Promise<FirebaseClientConfigResponse["data"]> {
  const res = await api.get<FirebaseClientConfigResponse>("/config/firebase-client-config");
  return res.data.data ?? null;
}
