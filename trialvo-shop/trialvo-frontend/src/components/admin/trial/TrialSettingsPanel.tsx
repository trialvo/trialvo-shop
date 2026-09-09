"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Globe, Loader2, RefreshCw, Save, ShieldAlert, Zap } from "lucide-react";
import { AdminNumberInput } from "@/components/admin/AdminNumberInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useTrialSettings, useUpdateTrialSettings, type TrialSettings } from "@/hooks/useTrialSettings";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

type FormState = Required<
  Pick<
    TrialSettings,
    | "trialsEnabled"
    | "demoEnabled"
    | "hostedDays"
    | "demoMaxPerEmailDay"
    | "demoMaxPerIpHour"
    | "demoResetEnabled"
    | "domainEnabled"
    | "domainMonths"
    | "defaultMonths"
    | "hostingPurchaseEnabled"
    | "fulfillmentSlaHours"
    | "paidExtendDays"
    | "extendDays"
    | "extendPriceBdt"
    | "extendPriceUsd"
  >
>;

const DEFAULTS: FormState = {
  trialsEnabled: true,
  demoEnabled: true,
  hostedDays: 14,
  demoMaxPerEmailDay: 3,
  demoMaxPerIpHour: 5,
  demoResetEnabled: true,
  domainEnabled: true,
  domainMonths: [1],
  defaultMonths: 1,
  hostingPurchaseEnabled: true,
  fulfillmentSlaHours: 24,
  paidExtendDays: 365,
  extendDays: 30,
  extendPriceBdt: 1500,
  extendPriceUsd: 15,
};

function fromSettings(s: TrialSettings): FormState {
  return {
    trialsEnabled: s.trialsEnabled !== false,
    demoEnabled: s.demoEnabled !== false,
    hostedDays: s.hostedDays ?? DEFAULTS.hostedDays,
    demoMaxPerEmailDay: s.demoMaxPerEmailDay ?? DEFAULTS.demoMaxPerEmailDay,
    demoMaxPerIpHour: s.demoMaxPerIpHour ?? DEFAULTS.demoMaxPerIpHour,
    demoResetEnabled: s.demoResetEnabled !== false,
    domainEnabled: s.domainEnabled !== false,
    domainMonths: s.domainMonths?.length ? s.domainMonths : DEFAULTS.domainMonths,
    defaultMonths: s.defaultMonths ?? DEFAULTS.defaultMonths,
    hostingPurchaseEnabled: s.hostingPurchaseEnabled !== false,
    fulfillmentSlaHours: s.fulfillmentSlaHours ?? DEFAULTS.fulfillmentSlaHours,
    paidExtendDays: s.paidExtendDays ?? DEFAULTS.paidExtendDays,
    extendDays: s.extendDays ?? DEFAULTS.extendDays,
    extendPriceBdt: s.extendPriceBdt ?? DEFAULTS.extendPriceBdt,
    extendPriceUsd: s.extendPriceUsd ?? DEFAULTS.extendPriceUsd,
  };
}

const clampInt = (n: number, min: number, max: number, fallback: number) => {
  const v = Math.trunc(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
};

/**
 * Admin → Settings → Trial. Owns its own form state so the settings page stays
 * a thin tab switcher. Sections mirror the product: global switch, instant
 * demo, own-domain trial, paid extend/convert.
 */
export function TrialSettingsPanel({ inputClass }: Readonly<{ inputClass?: string }>) {
  const { toast } = useToast();
  const { data: settings } = useTrialSettings();
  const update = useUpdateTrialSettings();
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (settings) setForm(fromSettings(settings));
  }, [settings]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const toggleMonth = (m: number) => {
    const set = new Set(form.domainMonths);
    if (set.has(m)) {
      if (set.size === 1) return; // never allow an empty preset list
      set.delete(m);
    } else {
      set.add(m);
    }
    const list = [...set].sort((a, b) => a - b);
    patch({ domainMonths: list, defaultMonths: list.includes(form.defaultMonths) ? form.defaultMonths : list[0] });
  };

  const save = async () => {
    try {
      await update.mutateAsync(form);
      toast({ title: "Trial settings saved" });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Save failed", variant: "destructive" });
    }
  };

  const runDemoReset = async () => {
    setResetting(true);
    try {
      const r = await api.post<{ reset?: number; skipped?: number }>("/admin/trial-instances/demo-reset", {});
      toast({ title: "Demo reset triggered", description: `Reset ${r.reset ?? 0} demo database(s).` });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Reset failed", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="admin-card overflow-hidden">
      <div className="hero-gradient-soft border-b border-border/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 shadow-soft-sm ring-1 ring-primary/20">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Trial System</h3>
            <p className="text-sm text-muted-foreground">
              Two paths: instant shared demo (automatic) and own-domain trial (manual fulfilment).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6">
        {/* Global */}
        <ToggleRow
          title="Enable trials"
          body="Master kill switch. When off, both demo and domain CTAs disappear and the API returns TRIALS_DISABLED."
          checked={form.trialsEnabled}
          onChange={(v) => patch({ trialsEnabled: v })}
        />

        {/* Instant demo */}
        <Group icon={Zap} title="Instant live demo" body="Customer submits name + email and gets shop/admin access immediately on the shared demo store.">
          <ToggleRow
            title="Instant demo enabled"
            body="Turn off to pause new demo requests without touching domain trials."
            checked={form.demoEnabled}
            onChange={(v) => patch({ demoEnabled: v })}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Demo access (days)" hint="How long the demo admin login stays active.">
              <AdminNumberInput
                integer min={1} max={365} emptyAs={14}
                value={form.hostedDays}
                onValueChange={(n) => patch({ hostedDays: clampInt(n, 1, 365, 14) })}
                className={inputClass}
              />
            </Field>
            <Field label="Max per email / day" hint="Dedupe returns the existing demo before this limit is hit.">
              <AdminNumberInput
                integer min={1} max={50} emptyAs={3}
                value={form.demoMaxPerEmailDay}
                onValueChange={(n) => patch({ demoMaxPerEmailDay: clampInt(n, 1, 50, 3) })}
                className={inputClass}
              />
            </Field>
            <Field label="Max per IP / hour" hint="Bot protection alongside the honeypot and disposable-email block.">
              <AdminNumberInput
                integer min={1} max={100} emptyAs={5}
                value={form.demoMaxPerIpHour}
                onValueChange={(n) => patch({ demoMaxPerIpHour: clampInt(n, 1, 100, 5) })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">Nightly demo reset</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Restores each shared demo database from its SQL snapshot at 03:00 and re-creates active demo admins.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" variant="outline" disabled={resetting} onClick={runDemoReset}>
                {resetting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                Reset now
              </Button>
              <Switch checked={form.demoResetEnabled} onCheckedChange={(v) => patch({ demoResetEnabled: v })} aria-label="Nightly demo reset" />
            </div>
          </div>
        </Group>

        {/* Own-domain */}
        <Group icon={Globe} title="Own-domain trial" body="Customer picks months + hosting; staff deploy by hand from the Trial Requests queue.">
          <ToggleRow
            title="Own-domain trial enabled"
            body="Turn off to hide the domain-trial CTAs and the upsell on the demo hub."
            checked={form.domainEnabled}
            onChange={(v) => patch({ domainEnabled: v })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Months offered" hint="Presets the customer can pick. Default is 1. Add 2,3 to offer longer trials — the site updates itself.">
              <div className="flex flex-wrap gap-2">
                {MONTH_OPTIONS.map((m) => {
                  const on = form.domainMonths.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMonth(m)}
                      aria-pressed={on}
                      className={cn(
                        "h-10 min-w-[3rem] rounded-lg border px-3 text-sm font-semibold transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Default selection" hint="Pre-selected in the wizard.">
              <div className="flex flex-wrap gap-2">
                {form.domainMonths.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => patch({ defaultMonths: m })}
                    aria-pressed={form.defaultMonths === m}
                    className={cn(
                      "h-10 min-w-[3rem] rounded-lg border px-3 text-sm font-semibold transition-colors",
                      form.defaultMonths === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {m} mo
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Fulfilment SLA (hours)" hint="Shown to customers as “usually within N hours” and used for overdue alerts.">
              <AdminNumberInput
                integer min={1} max={168} emptyAs={24}
                value={form.fulfillmentSlaHours}
                onValueChange={(n) => patch({ fulfillmentSlaHours: clampInt(n, 1, 168, 24) })}
                className={inputClass}
              />
            </Field>
            <ToggleRow
              compact
              title="Offer “buy hosting from Trialvo”"
              body="Adds the second option in the hosting gate for customers without a server."
              checked={form.hostingPurchaseEnabled}
              onChange={(v) => patch({ hostingPurchaseEnabled: v })}
            />
          </div>
        </Group>

        {/* Paid */}
        <Group icon={ShieldAlert} title="Paid extend & convert" body="Applies to demo instances. Domain trials are extended by staff from the instance page.">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Extend pack (days)">
              <AdminNumberInput
                integer min={1} max={365} emptyAs={30}
                value={form.extendDays}
                onValueChange={(n) => patch({ extendDays: clampInt(n, 1, 365, 30) })}
                className={inputClass}
              />
            </Field>
            <Field label="Price (BDT)">
              <AdminNumberInput
                integer min={0} step={1}
                value={form.extendPriceBdt}
                onValueChange={(n) => patch({ extendPriceBdt: Math.max(0, Math.round(n) || 0) })}
                className={inputClass}
              />
            </Field>
            <Field label="Price (USD)">
              <AdminNumberInput
                min={0} step={0.01}
                value={form.extendPriceUsd}
                onValueChange={(n) => patch({ extendPriceUsd: Math.max(0, Math.round((n || 0) * 100) / 100) })}
                className={inputClass}
              />
            </Field>
            <Field label="Convert on purchase (days)" hint="Instance lifetime after full product purchase.">
              <AdminNumberInput
                integer min={1} max={3650} emptyAs={365}
                value={form.paidExtendDays}
                onValueChange={(n) => patch({ paidExtendDays: clampInt(n, 1, 3650, 365) })}
                className={inputClass}
              />
            </Field>
          </div>
        </Group>

        <Button onClick={save} disabled={update.isPending} className="bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary/90">
          {update.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save Trial Settings
        </Button>
      </div>
    </div>
  );
}

function Group({
  icon: Icon,
  title,
  body,
  children,
}: Readonly<{ icon: typeof Zap; title: string; body: string; children: React.ReactNode }>) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
        </div>
      </div>
      <div className="space-y-4 border-l border-border pl-4 sm:ml-4 sm:pl-7">{children}</div>
    </section>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
  compact,
}: Readonly<{ title: string; body: string; checked: boolean; onChange: (v: boolean) => void; compact?: boolean }>) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20", compact ? "p-3" : "p-4")}>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

function Field({ label, hint, children }: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default TrialSettingsPanel;
