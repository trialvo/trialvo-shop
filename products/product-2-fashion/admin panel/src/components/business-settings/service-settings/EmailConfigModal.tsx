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

type SmtpProvider = "custom" | "ses" | "brevo" | "gmail" | "zoho";

const FROM_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SMTP_PRESETS: Record<Exclude<SmtpProvider, "custom">, { host: string; port: string }> = {
  ses: { host: "email-smtp.us-east-1.amazonaws.com", port: "587" },
  brevo: { host: "smtp-relay.brevo.com", port: "587" },
  gmail: { host: "smtp.gmail.com", port: "587" },
  zoho: { host: "smtp.zoho.com", port: "587" },
};

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function matchProvider(host: string): SmtpProvider {
  const h = host.trim().toLowerCase();
  if (!h) return "custom";
  if (h === SMTP_PRESETS.ses.host || /^email-smtp\.[a-z0-9-]+\.amazonaws\.com$/.test(h)) return "ses";
  if (h === SMTP_PRESETS.brevo.host) return "brevo";
  if (h === SMTP_PRESETS.gmail.host) return "gmail";
  if (h === SMTP_PRESETS.zoho.host) return "zoho";
  return "custom";
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
        "For Amazon SES: SMTP credentials are generated in the SES console (SMTP settings) and are NOT your AWS access key or console password.",
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
  const [provider, setProvider] = useState<SmtpProvider>("custom");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [fromName, setFromName] = useState("");
  const [triage, setTriage] = useState<Triage | null>(null);
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  useEffect(() => {
    if (!open) return;
    const nextHost = safeString(initial?.host);
    setProvider(matchProvider(nextHost));
    setHost(nextHost);
    setPort(safeString(initial?.port));
    setUser(safeString(initial?.user));
    setPass(safeString(initial?.pass));
    setFromAddress(safeString(initial?.fromAddress));
    setFromName(safeString(initial?.fromName));
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
    mutationFn: (payload: {
      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USER: string;
      MAIL_PASS: string;
      MAIL_FROM: string;
      MAIL_FROM_NAME: string;
      setNull: boolean;
    }) => updateEmailConfig(payload),
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

  const fromError = useMemo(() => {
    const trimmed = fromAddress.trim();
    if (provider === "ses" && !trimmed) return "From Address is required for Amazon SES.";
    if (trimmed && !FROM_EMAIL_RE.test(trimmed)) return "From Address must be a valid email.";
    return "";
  }, [fromAddress, provider]);

  const canSave = useMemo(() => {
    return Boolean(host.trim() && port.trim() && user.trim() && pass.trim()) && !portError && !fromError;
  }, [host, port, user, pass, portError, fromError]);

  const applyProvider = (next: SmtpProvider) => {
    setProvider(next);
    if (next === "custom") return;
    const preset = SMTP_PRESETS[next];
    setHost(preset.host);
    setPort(preset.port);
  };

  const submit = () => {
    setTriage(null);
    mutation.mutate({
      MAIL_HOST: host.trim(),
      MAIL_PORT: port.trim(),
      MAIL_USER: user.trim(),
      MAIL_PASS: pass.trim(),
      MAIL_FROM: fromAddress.trim(),
      MAIL_FROM_NAME: fromName.trim(),
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
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="mail-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </label>
              <select
                id="mail-provider"
                value={provider}
                onChange={(e) => applyProvider(e.target.value as SmtpProvider)}
                disabled={mutation.isPending}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus-visible:border-brand-500 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
              >
                <option value="custom">Custom / cPanel</option>
                <option value="ses">Amazon SES</option>
                <option value="brevo">Brevo</option>
                <option value="gmail">Gmail / Google Workspace</option>
                <option value="zoho">Zoho Mail</option>
              </select>
              {provider === "ses" ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  The SES host region must match your SES region. Default preset is
                  email-smtp.us-east-1.amazonaws.com (Trialvo production). Other common hosts:
                  email-smtp.ap-south-1.amazonaws.com, email-smtp.eu-west-1.amazonaws.com,
                  email-smtp.ap-southeast-1.amazonaws.com.
                </p>
              ) : null}
            </div>

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

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="mail-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Address {provider === "ses" ? <span className="text-error-500">*</span> : null}
              </label>
              <Input
                id="mail-from"
                type="email"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="noreply@shop.com"
                disabled={mutation.isPending}
                error={!!fromError}
                aria-invalid={!!fromError}
                aria-describedby={fromError ? "mail-from-error" : "mail-from-hint"}
              />
              {fromError ? (
                <p id="mail-from-error" className="text-xs font-medium text-error-600 dark:text-error-400">
                  {fromError}
                </p>
              ) : (
                <p id="mail-from-hint" className="text-xs text-gray-400 dark:text-gray-500">
                  Leave blank to use the SMTP username as the sender. Required for Amazon SES, whose SMTP username is an IAM string, not an email.
                </p>
              )}
              {provider === "ses" && !fromAddress.trim() ? (
                <div className="flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-xs font-medium text-warning-700 dark:border-warning-900/40 dark:bg-warning-500/10 dark:text-warning-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    SES will authenticate successfully (verify() passes) but refuse to send, because the SMTP username is not a valid sender address. Set a verified From Address (e.g. noreply@yourdomain.com) or mail will fail on the first real order.
                  </span>
                </div>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="mail-from-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Name <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <Input
                id="mail-from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Shop Support"
                disabled={mutation.isPending}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Display name shown to recipients. Leave blank to use the store brand name.
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
