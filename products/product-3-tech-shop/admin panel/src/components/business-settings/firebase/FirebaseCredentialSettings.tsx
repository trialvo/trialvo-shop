import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Flame, ToggleLeft, ToggleRight, Globe, Key, ShieldCheck, Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  useFirebaseCredential,
  useSaveFirebaseCredential,
  useToggleFirebaseCredential,
  useClearFirebaseCredential,
} from "@/hooks/useFirebaseConfig";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { clearFirebaseConfigCache } from "@/lib/firebase";

export default function FirebaseCredentialSettings() {
  const { data: credential, isLoading, isError } = useFirebaseCredential();
  const saveMutation = useSaveFirebaseCredential();
  const toggleMutation = useToggleFirebaseCredential();
  const clearMutation = useClearFirebaseCredential();

  // ── Form state ──────────────────────────────────────────────────────
  const [serviceAccountText, setServiceAccountText] = useState("");
  const [serviceAccountError, setServiceAccountError] = useState("");

  const [clientConfigText, setClientConfigText] = useState("");
  const [clientConfigError, setClientConfigError] = useState("");

  const [vapidKey, setVapidKey] = useState("");
  const [vapidError, setVapidError] = useState("");

  // Track original values to detect changes
  const originals = useRef({ serviceAccount: "", clientConfig: "", vapid: "" });
  const [syncKey, setSyncKey] = useState("");

  // Sync fields from DB whenever credential data changes (initial load, after save, after clear)
  useEffect(() => {
    const key = credential
      ? `${credential.id}_${credential.updated_at}`
      : "none";
    if (key === syncKey) return; // already synced for this version
    setSyncKey(key);

    if (credential) {
      const sa = credential.credential_json_display
        ? JSON.stringify(credential.credential_json_display, null, 2)
        : "";
      const cc = credential.client_config
        ? JSON.stringify(credential.client_config, null, 2)
        : "";
      const vk = credential.vapid_key || "";

      setServiceAccountText(sa);
      setClientConfigText(cc);
      setVapidKey(vk);
      originals.current = { serviceAccount: sa, clientConfig: cc, vapid: vk };
    } else {
      setServiceAccountText("");
      setClientConfigText("");
      setVapidKey("");
      originals.current = { serviceAccount: "", clientConfig: "", vapid: "" };
    }
  }, [credential]);

  // ── Detect dirty state ──────────────────────────────────────────────
  const isDirty =
    serviceAccountText !== originals.current.serviceAccount ||
    clientConfigText !== originals.current.clientConfig ||
    vapidKey !== originals.current.vapid;

  // ── Validate and save ───────────────────────────────────────────────
  const validateAndSave = async () => {
    let hasError = false;
    setServiceAccountError("");
    setClientConfigError("");
    setVapidError("");

    // Build payload — only send changed fields
    const payload: Record<string, unknown> = {};

    // 1. Service Account JSON
    if (serviceAccountText !== originals.current.serviceAccount) {
      if (!serviceAccountText.trim()) {
        setServiceAccountError("Service Account JSON is required.");
        hasError = true;
      } else {
        try {
          let parsed = JSON.parse(serviceAccountText);
          if (parsed.credential_json && typeof parsed.credential_json === "object") {
            parsed = parsed.credential_json;
          }
          const missing = ["project_id", "private_key", "client_email"].filter((k) => !parsed[k]);
          if (missing.length > 0) {
            setServiceAccountError(`Missing required fields: ${missing.join(", ")}.`);
            hasError = true;
          } else {
            payload.credential_json = parsed;
          }
        } catch {
          setServiceAccountError("Invalid JSON.");
          hasError = true;
        }
      }
    }

    // 2. Web App Config JSON
    if (clientConfigText !== originals.current.clientConfig) {
      if (!clientConfigText.trim()) {
        setClientConfigError("Web App Config JSON is required.");
        hasError = true;
      } else {
        try {
          const parsed = JSON.parse(clientConfigText);
          const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
          const missing = required.filter((f) => !parsed[f]);
          if (missing.length > 0) {
            setClientConfigError(`Missing required fields: ${missing.join(", ")}.`);
            hasError = true;
          } else {
            payload.client_config = parsed;
          }
        } catch {
          setClientConfigError("Invalid JSON.");
          hasError = true;
        }
      }
    }

    // 3. VAPID Key
    if (vapidKey !== originals.current.vapid) {
      const trimmed = vapidKey.trim();
      if (!trimmed) {
        setVapidError("VAPID Key is required.");
        hasError = true;
      } else if (!/^[A-Za-z0-9_-]{87}$/.test(trimmed)) {
        setVapidError("Must be exactly 87 base64url characters (P-256 public key).");
        hasError = true;
      } else {
        payload.vapid_key = trimmed;
      }
    }

    if (hasError || Object.keys(payload).length === 0) return;

    try {
      const res = await saveMutation.mutateAsync(payload);
      toast.success(res.message || "Saved!");
      // Reset syncKey so the useEffect re-syncs from fresh DB data after refetch
      setSyncKey("");
      clearFirebaseConfigCache();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to save.";
      if (msg.includes("credential_json") || msg.includes("Admin SDK") || msg.includes("private_key")) {
        setServiceAccountError(msg);
      } else if (msg.includes("client_config") || msg.includes("apiKey")) {
        setClientConfigError(msg);
      } else if (msg.includes("vapid")) {
        setVapidError(msg);
      } else {
        toast.error(msg);
      }
    }
  };

  const handleToggle = async () => {
    try {
      const res = await toggleMutation.mutateAsync();
      toast.success(res.message || "Toggled.");
      clearFirebaseConfigCache();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to toggle.");
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear ALL Firebase credentials?\nPush notifications will stop working immediately.")) return;
    try {
      const res = await clearMutation.mutateAsync();
      toast.success(res.message || "Cleared.");
      setSyncKey("");
      clearFirebaseConfigCache();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to clear.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Single unified card */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <Flame className="text-orange-500" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Firebase Configuration</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage all Firebase credentials for push notifications.
            </p>
          </div>
          {/* Action buttons */}
          {credential && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggle}
                disabled={toggleMutation.isPending}
                startIcon={credential.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              >
                {toggleMutation.isPending ? "..." : credential.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                disabled={clearMutation.isPending}
                startIcon={<Trash2 size={14} />}
                className="text-error-500 border-error-300 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
              >
                {clearMutation.isPending ? "..." : "Clear All"}
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <div className="p-5 space-y-6">
            {/* ⚠️ Strict Warning Banner */}
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/5">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Important — Paste exact values from Firebase Console</p>
                <p className="text-amber-700 dark:text-amber-400">
                  All three credentials below must be copied <strong>exactly</strong> from your Firebase project.
                  Even a single extra character, missing field, or wrong key will silently break <strong>all</strong> push
                  notifications across the entire system — including order updates, assignment alerts, and customer notifications.
                  There is no way to auto-validate the Web App Config or VAPID Key, so double-check every value before saving.
                </p>
              </div>
            </div>

            {/* 1. Service Account JSON */}
            <div className="space-y-2">
              <Label htmlFor="fcm-service-account">
                <span className="flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  Service Account JSON <span className="text-error-500">*</span>
                </span>
              </Label>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1">
                Google Cloud Console → IAM → Service Accounts → Generate Key → JSON. Download the file and paste the <strong>entire</strong> contents.
              </p>
              <textarea
                id="fcm-service-account"
                rows={10}
                value={serviceAccountText}
                onChange={(e) => { setServiceAccountText(e.target.value); setServiceAccountError(""); }}
                placeholder={'{\n  "type": "service_account",\n  "project_id": "my-project",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  "client_email": "firebase-adminsdk@my-project.iam.gserviceaccount.com",\n  ...\n}'}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200"
              />
              {serviceAccountError && <p className="text-xs text-error-500">{serviceAccountError}</p>}
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* 2. Web App Config JSON */}
            <div className="space-y-2">
              <Label htmlFor="fcm-client-config">
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-brand-400" />
                  Web App Config JSON <span className="text-error-500">*</span>
                </span>
              </Label>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1">
                Firebase Console → Project Settings → General → Your Apps → Web App. Copy the <strong>firebaseConfig</strong> object exactly — do not add or remove any fields.
              </p>
              <textarea
                id="fcm-client-config"
                rows={10}
                value={clientConfigText}
                onChange={(e) => { setClientConfigText(e.target.value); setClientConfigError(""); }}
                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-project.firebaseapp.com",\n  "projectId": "my-project",\n  "storageBucket": "my-project.firebasestorage.app",\n  "messagingSenderId": "123456789",\n  "appId": "1:123456789:web:abc123"\n}'}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200"
              />
              {clientConfigError && <p className="text-xs text-error-500">{clientConfigError}</p>}
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* 3. VAPID Key */}
            <div className="space-y-2">
              <Label htmlFor="fcm-vapid-key">
                <span className="flex items-center gap-1.5">
                  <Key size={14} className="text-amber-400" />
                  VAPID Key <span className="text-error-500">*</span>
                </span>
              </Label>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1">
                Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair. Must be <strong>exactly 87 characters</strong> — do not add or remove anything.
              </p>
              <input
                id="fcm-vapid-key"
                type="text"
                value={vapidKey}
                onChange={(e) => { setVapidKey(e.target.value); setVapidError(""); }}
                placeholder="BFJkMtzWWy_lZQ0IPrt_..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200"
              />
              {vapidError && <p className="text-xs text-error-500">{vapidError}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between rounded-xl bg-brand-50/50 px-4 py-3 dark:bg-brand-500/5">
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                <ShieldCheck size={12} className="inline mr-1 text-brand-500" />
                {isDirty
                  ? "Changes detected. Click save to validate and update."
                  : credential
                  ? "No changes. Edit any field above to enable save."
                  : "Fill all three fields to set up Firebase."}
              </p>
              <Button
                onClick={validateAndSave}
                disabled={saveMutation.isPending || !isDirty}
                startIcon={
                  saveMutation.isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <ShieldCheck size={14} />
                }
              >
                {saveMutation.isPending ? "Validating..." : "Validate & Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
