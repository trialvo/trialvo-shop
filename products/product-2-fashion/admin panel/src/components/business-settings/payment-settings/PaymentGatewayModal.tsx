// src/components/settings/payment/PaymentGatewayModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";

import { PAYMENT_PROVIDER_DEFS } from "./providerDefs";
import type { Option, PaymentProvider, PaymentProviderConfigCard } from "./types";
import { updatePaymentProviderConfig } from "@/api/payment-config.api";
import { cn } from "@/lib/utils";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

type Props = {
  open: boolean;
  provider: PaymentProvider | null;
  initial: PaymentProviderConfigCard | null;
  onClose: () => void;
  onSaved: () => void;
};

const PROVIDER_OPTIONS: Option[] = PAYMENT_PROVIDER_DEFS.map((d) => ({
  value: d.provider,
  label: d.title,
}));

const AUTO_TYPE: Record<Exclude<PaymentProvider, "cod">, string> = {
  bkash: "mobile_banking",
  nagad: "mobile_banking",
  rocket: "mobile_banking",
  sslcommerz: "payment_gateway",
  shurjopay: "payment_gateway",
};

function getDef(p: PaymentProvider) {
  return (
    PAYMENT_PROVIDER_DEFS.find((d) => d.provider === p) ?? PAYMENT_PROVIDER_DEFS[0]
  );
}

export default function PaymentGatewayModal({
  open,
  provider,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [currentProvider, setCurrentProvider] = useState<PaymentProvider>("bkash");

  const [gatewayName, setGatewayName] = useState("");
  const [note, setNote] = useState("");
  const [env, setEnv] = useState<"sandbox" | "production">("sandbox");
  const [status, setStatus] = useState(true);

  const [setDefault, setSetDefault] = useState(false);
  const [armWipe, setArmWipe] = useState(false);

  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const hydratingRef = useRef(false);

  const providerDef = useMemo(() => getDef(currentProvider), [currentProvider]);
  const isCod = currentProvider === "cod";
  const autoType = !isCod
    ? AUTO_TYPE[currentProvider as Exclude<PaymentProvider, "cod">]
    : "cod";
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  useEffect(() => {
    if (!open) return;

    hydratingRef.current = true;

    const targetProvider = provider ?? initial?.provider ?? "bkash";
    const targetDef = getDef(targetProvider);

    setCurrentProvider(targetProvider);

    const cfg =
      (initial?.provider === targetProvider ? initial?.config : null) ?? {};
    const common = targetDef.common;

    const gwKey = common.gateway_name;
    setGatewayName(
      String(cfg?.[gwKey] ?? initial?.gateway_name ?? targetDef.title),
    );

    // ✅ cod: we don't care about these (but keep old hydrate for non-cod)
    setNote(String(cfg?.[common.note] ?? initial?.note ?? ""));
    setEnv(((cfg?.[common.env] ?? initial?.env ?? "sandbox") || "sandbox") as any);

    setStatus(Boolean(initial?.provider === targetProvider ? initial?.is_active : true));

    setSetDefault(Boolean(initial?.provider === targetProvider ? initial?.isDefault : false));
    setArmWipe(false);

    const nextCred: Record<string, string> = {};
    for (const f of targetDef.fields) {
      nextCred[f.key] = String(cfg?.[f.readFromConfigKey] ?? "");
    }
    setCredentials(nextCred);

    const t = setTimeout(() => {
      hydratingRef.current = false;
    }, 0);

    return () => clearTimeout(t);
  }, [open, provider, initial]);

  useEffect(() => {
    if (!open) return;
    if (hydratingRef.current) return;

    const def = providerDef;

    setGatewayName((p) => (p.trim() ? p : def.title));

    setCredentials((prev) => {
      const next = { ...prev };

      for (const f of def.fields) {
        if (next[f.key] === undefined) next[f.key] = "";
      }

      Object.keys(next).forEach((k) => {
        if (!def.fields.some((f) => f.key === k)) delete next[k];
      });

      return next;
    });

    setArmWipe(false);
    setSetDefault(false);
  }, [open, providerDef]);

  const canSave = useMemo(() => {
    if (isCod) return true;

    const anyCredFilled = providerDef.fields.some((f) =>
      String(credentials[f.key] ?? "").trim(),
    );
    if (!anyCredFilled) return true;

    for (const f of providerDef.fields) {
      if (f.required && !String(credentials[f.key] ?? "").trim()) return false;
    }
    return true;
  }, [credentials, providerDef.fields, isCod]);

  const changeCred = (key: string, v: string) => {
    setCredentials((prev) => ({ ...prev, [key]: v }));
  };

  const mutation = useMutation({
    mutationFn: (payload: Record<string, any>) =>
      updatePaymentProviderConfig(currentProvider, payload),
    onSuccess: (res: any) => {
      if (res?.success === true || res?.status === true) {
        toast.success("Payment config updated");
        onSaved();
        return;
      }
      toast.error(res?.error ?? res?.message ?? "Failed to update");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update";
      toast.error(msg);
    },
  });

  const submit = () => {
    // ✅ COD: ONLY send these 2
    if (isCod) {
      const payload: Record<string, any> = {
        title: gatewayName.trim() ? gatewayName.trim() : undefined,
        status,
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      mutation.mutate(payload);
      return;
    }

    // ✅ ORIGINAL payload (unchanged)
    const payload: Record<string, any> = {
      gateway_name: gatewayName.trim() ? gatewayName.trim() : undefined,
      type: autoType,
      note: note.trim() ? note.trim() : undefined,
      env,
      status,
      setdefault: Boolean(setDefault),
    };

    const anyCredFilled = providerDef.fields.some((f) =>
      String(credentials[f.key] ?? "").trim(),
    );
    if (anyCredFilled) {
      for (const f of providerDef.fields) {
        payload[f.key] = String(credentials[f.key] ?? "").trim();
      }
    }

    if (armWipe) payload.setdefault = false;
    if (armWipe) payload.setnull = true;

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    mutation.mutate(payload);
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <button
        type="button"
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close overlay"
      />

      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-[95vw] max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Payment Gateway
            </h3>

            {!isCod ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Type auto: <span className="font-mono">{autoType}</span>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[520px] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Provider */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </p>
              <Select
                key={`provider-dd-${currentProvider}`}
                options={PROVIDER_OPTIONS}
                placeholder="Select provider"
                defaultValue={currentProvider}
                disabled
                onChange={(v) => setCurrentProvider(v as PaymentProvider)}
              />
            </div>

            {/* Gateway Name */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Gateway Name
              </p>
              <Input
                value={gatewayName}
                onChange={(e) => setGatewayName(e.target.value)}
                placeholder="Gateway name (optional)"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </p>
              <div className="h-11 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {status ? "Active" : "Inactive"}
                </p>
                <Switch
                  label=""
                  defaultChecked={status}
                  onChange={(c) => setStatus(c)}
                />
              </div>
            </div>

            {/* ✅ ONLY show the rest for NON-COD */}
            {!isCod ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Environment
                  </p>
                  <div className="h-11 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {env === "sandbox" ? "Sandbox" : "Production"}
                    </p>
                    <Switch
                      label=""
                      defaultChecked={env === "sandbox"}
                      onChange={(c) => setEnv(c ? "sandbox" : "production")}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Note
                  </p>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Set Default Provider
                  </p>
                  <div className="h-11 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {setDefault ? "Yes (setdefault=true)" : "No"}
                    </p>
                    <Switch
                      label=""
                      defaultChecked={setDefault}
                      onChange={(c) => setSetDefault(c)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This sets{" "}
                    <span className="font-mono">PAYMENT_DEFAULT_PROVIDER</span>.
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* ✅ NON-COD: keep your previous Credentials + Danger Zone exactly */}
          {!isCod ? (
            <>
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {providerDef.title} Credentials
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      If you fill 1 field → required credentials must be filled.
                    </p>
                  </div>

                  <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {providerDef.category}
                  </span>
                </div>

                {!canSave ? (
                  <div className="mt-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-xs font-semibold text-warning-700 dark:border-warning-900/40 dark:bg-warning-500/10 dark:text-warning-300">
                    Please fill all required credential fields (since you started
                    entering credentials).
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {providerDef.fields.map((f) => (
                    <div
                      key={`${currentProvider}-${f.key}`}
                      className="space-y-2"
                    >
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {f.label}{" "}
                        {f.required ? (
                          <span className="text-error-500">*</span>
                        ) : null}
                      </p>
                      <Input
                        type={f.type === "password" ? "password" : "text"}
                        value={credentials[f.key] ?? ""}
                        onChange={(e) => changeCred(f.key, e.target.value)}
                        placeholder={f.placeholder ?? ""}
                      />
                      {f.helperText ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {f.helperText}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-900/40 dark:bg-error-500/10">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-error-600 dark:text-error-300">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-error-700 dark:text-error-200">
                      Danger Zone (setnull)
                    </p>
                    <p className="mt-1 text-xs text-error-700/90 dark:text-error-300">
                      If enabled, it wipes this provider config from database.
                      Use only if you are 100% sure.
                    </p>

                    <div className="mt-3 flex items-center justify-between rounded-xl border border-error-200 bg-white px-4 py-3 dark:border-error-900/40 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-error-700 dark:text-error-200">
                        {armWipe ? "Armed: setnull=true" : "Not armed"}
                      </p>
                      <Switch
                        label=""
                        defaultChecked={armWipe}
                        onChange={(c) => setArmWipe(c)}
                      />
                    </div>

                    {armWipe ? (
                      <p className="mt-2 text-xs font-semibold text-error-700 dark:text-error-300">
                        Saving now will send{" "}
                        <span className="font-mono">setnull: true</span>.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={mutation.isPending || !canSave}
            className={cn(!isCod && armWipe && "bg-error-600 hover:bg-error-700")}
          >
            {mutation.isPending
              ? "Saving..."
              : !isCod && armWipe
              ? "Wipe & Save"
              : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
