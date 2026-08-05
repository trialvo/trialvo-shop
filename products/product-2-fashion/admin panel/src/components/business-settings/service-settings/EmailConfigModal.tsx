// src/components/business-settings/service-settings/EmailConfigModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, X, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

import { updateEmailConfig } from "@/api/service-config.api";
import type { EmailCard } from "./types";

type Props = {
  open: boolean;
  initial: EmailCard | null;
  onClose: () => void;
  onSaved: () => void;
};

type Triage = { title: string; steps: string[] };

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/**
 * Turns a raw SMTP/nodemailer error into an actionable checklist. The provider
 * returns cryptic codes (535, 525, 534, 421…) that mean nothing to an operator;
 * we translate the common ones into concrete next steps. Falls back to showing
 * the raw message so no information is lost.
 */
function triageSmtpError(raw: string): Triage {
  const r = raw.toLowerCase();

  if (/\b535\b|invalid login|authentication failed|eauth/.test(r)) {
    return {
      title: "Authentication failed (535)",
      steps: [
        "The username or password (SMTP key) was rejected by the mail server.",
        "For Brevo: MAIL_USER is your SMTP login (…@smtp-brevo.com) and MAIL_PASS is the SMTP key from Transactional → Settings → SMTP.",
        "Do NOT use your Brevo account password or an API key starting with 'xsmtpsib-'.",
        "If unsure, regenerate the SMTP key in your provider and paste it again.",
      ],
    };
  }
  if (/\b525\b|unauthorized ip/.test(r)) {
    return {
      title: "Unauthorized IP address (525)",
      steps: [
        "The mail provider is blocking the server's IP address.",
        "Add this server's public IP to the provider's authorised/allowed IP list.",
        "In Brevo this is under SMTP & API → Authorized IPs.",
      ],
    };
  }
  if (/\b534\b|5\.7\.9|application-specific password|requires a valid/.test(r)) {
    return {
      title: "Extra authentication required (534)",
      steps: [
        "The provider requires an app-specific password or additional verification.",
        "Generate an app password (e.g. Gmail App Passwords) and use it as MAIL_PASS.",
      ],
    };
  }
  if (/\b421\b|too many|rate limit|try again later/.test(r)) {
    return {
      title: "Temporarily rate-limited (421)",
      steps: [
        "The provider is throttling connections right now.",
        "Wait a few minutes and try saving again.",
      ],
    };
  }
  if (/etimedout|econnrefused|econnection|connection timeout|greeting never received/.test(r)) {
    return {
      title: "Could not reach the mail server",
      steps: [
        "The host/port could not be reached. Double-check MAIL_HOST and MAIL_PORT.",
        "Common ports: 465 (SSL) or 587 (STARTTLS).",
        "Ensure the server's firewall allows outbound SMTP on that port.",
      ],
    };
  }
  if (/self signed|self-signed|certificate|tls/.test(r)) {
    return {
      title: "TLS / certificate problem",
      steps: [
        "The server's TLS certificate could not be verified.",
        "Verify the host name is correct and matches the certificate.",
        "For port 465 use SSL; for 587 use STARTTLS.",
      ],
    };
  }
  return {
    title: "SMTP verification failed",
    steps: [raw],
  };
}

export default function EmailConfigModal({ open, initial, onClose, onSaved }: Props) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [triage, setTriage] = useState<Triage | null>(null);
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  useEffect(() => {
    if (!open) return;
    setHost(safeString(initial?.host));
    setPort(safeString(initial?.port));
    setUser(safeString(initial?.user));
    setPass(safeString(initial?.pass));
    setTriage(null);
  }, [open, initial]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const mutation = useMutation({
    mutationFn: (payload: { MAIL_HOST: string; MAIL_PORT: string; MAIL_USER: string; MAIL_PASS: string; setNull: boolean }) =>
      updateEmailConfig(payload),
    onSuccess: (res: any) => {
      if (res?.success === true || res?.status === true) {
        setTriage(null);
        toast.success("Email config updated");
        onSaved();
        return;
      }
      const msg = res?.error ?? res?.message ?? "Failed to update";
      setTriage(triageSmtpError(safeString(msg)));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Failed to update";
      setTriage(triageSmtpError(safeString(msg)));
    },
  });

  // Port must be a valid TCP port number.
  const portError = useMemo(() => {
    const trimmed = port.trim();
    if (!trimmed) return "";
    if (!/^\d+$/.test(trimmed)) return "Port must be a number.";
    const n = Number(trimmed);
    if (n < 1 || n > 65535) return "Port must be between 1 and 65535.";
    return "";
  }, [port]);

  const canSave = useMemo(() => {
    return Boolean(host.trim() && port.trim() && user.trim() && pass.trim()) && !portError;
  }, [host, port, user, pass, portError]);

  const submit = () => {
    setTriage(null);
    mutation.mutate({
      MAIL_HOST: host.trim(),
      MAIL_PORT: port.trim(),
      MAIL_USER: user.trim(),
      MAIL_PASS: pass.trim(),
      setNull: false,
    });
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-config-title"
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-[95vw] max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 id="email-config-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Email (SMTP) Settings
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Update SMTP credentials used for system emails. Credentials are
              verified before saving.
            </p>
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
        <div className="max-h-[560px] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="mail-host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                MAIL_HOST <span className="text-error-500">*</span>
              </label>
              <Input
                id="mail-host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="mail.trialvo.com"
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="mail-port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                MAIL_PORT <span className="text-error-500">*</span>
              </label>
              <Input
                id="mail-port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="465"
                disabled={mutation.isPending}
                aria-invalid={!!portError}
                aria-describedby={portError ? "mail-port-error" : "mail-port-hint"}
              />
              {portError ? (
                <p id="mail-port-error" className="text-xs font-medium text-error-600 dark:text-error-400">
                  {portError}
                </p>
              ) : (
                <p id="mail-port-hint" className="text-xs text-gray-400 dark:text-gray-500">
                  465 = SSL · 587 = STARTTLS
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="mail-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                MAIL_USER <span className="text-error-500">*</span>
              </label>
              <Input
                id="mail-user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="test@trialvo.com"
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="mail-pass" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                MAIL_PASS <span className="text-error-500">*</span>
              </label>
              <Input
                id="mail-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                disabled={mutation.isPending}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                For Brevo, use the SMTP key (not your account password or an
                'xsmtpsib-' API key).
              </p>
            </div>
          </div>

          {!canSave && !triage ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-xs font-medium text-warning-700 dark:border-warning-900/40 dark:bg-warning-500/10 dark:text-warning-300">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>All fields are required, and the port must be valid.</span>
            </div>
          ) : null}

          {/* Actionable SMTP error triage (persistent, not a transient toast) */}
          {triage ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-900/40 dark:bg-error-500/10"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-error-600 dark:text-error-300" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-error-700 dark:text-error-200">
                    {triage.title}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-error-700/90 dark:text-error-300">
                    {triage.steps.map((step, i) => (
                      <li key={i} className="break-words">{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending || !canSave}>
            {mutation.isPending ? "Verifying & Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
