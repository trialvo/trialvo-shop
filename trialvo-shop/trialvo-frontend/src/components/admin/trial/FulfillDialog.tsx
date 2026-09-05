"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTrialRequestMutations, type TrialRequestRow } from "@/hooks/useTrialRequests";
import { useTrialSettings } from "@/hooks/useTrialSettings";
import type { HostKind } from "@/lib/trial/types";
import { endDateForMonths, formatDate } from "@/lib/trial/months";
import { cn } from "@/lib/utils";

const URL_RE = /^https?:\/\/\S+/i;

/**
 * Staff finished deploying on the customer's server → record the URLs and
 * login, choose the trial length, and go live. Creates a `manual` instance and
 * emails the customer from the backend.
 */
export function FulfillDialog({
  request,
  onOpenChange,
}: Readonly<{ request: TrialRequestRow | null; onOpenChange: (open: boolean) => void }>) {
  const { toast } = useToast();
  const { fulfill } = useTrialRequestMutations();
  const { data: settings } = useTrialSettings();
  const presets = settings?.domainMonths?.length ? settings.domainMonths : [1];

  const [shopUrl, setShopUrl] = useState("");
  const [adminUrl, setAdminUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [months, setMonths] = useState(1);
  const [hostKind, setHostKind] = useState<HostKind | "">("");
  const [notes, setNotes] = useState("");

  // Seed from the request each time a new one is opened.
  useEffect(() => {
    if (!request) return;
    const domain = request.desired_domain ? request.desired_domain.replace(/^https?:\/\//, "") : "";
    setShopUrl(domain ? `https://${domain}` : "");
    setAdminUrl(domain ? `https://${domain}/admin` : "");
    setAdminEmail(request.email || "");
    setAdminPassword("");
    setMonths(request.requested_months || presets[0]);
    setHostKind(request.host_kind || "");
    setNotes("");
  }, [request, presets]);

  const needsHostKind = request?.hosting_source === "buy_from_trialvo" && !request?.has_hosting;
  const valid = useMemo(
    () => URL_RE.test(shopUrl) && URL_RE.test(adminUrl) && months > 0 && (!needsHostKind || Boolean(hostKind)),
    [shopUrl, adminUrl, months, needsHostKind, hostKind],
  );

  const submit = async () => {
    if (!request || !valid) return;
    try {
      const r = await fulfill.mutateAsync({
        id: request.id,
        shopUrl: shopUrl.trim(),
        adminUrl: adminUrl.trim(),
        adminEmail: adminEmail.trim() || undefined,
        adminPassword: adminPassword || undefined,
        months,
        hostKind: (hostKind || undefined) as HostKind | undefined,
        notes: notes || undefined,
      });
      toast({ title: "Trial is live", description: `Expires ${formatDate(r.expiresAt, "en")}. Customer emailed.` });
      onOpenChange(false);
    } catch (e: unknown) {
      toast({ title: "Could not fulfil", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
            Mark live on customer domain
          </DialogTitle>
          <DialogDescription>
            {request?.customer_name} · {request?.email}
            {request?.desired_domain ? ` · ${request.desired_domain}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-shop">Shop URL</Label>
              <Input id="fulfill-shop" placeholder="https://myshop.com" value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} inputMode="url" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-admin">Admin URL</Label>
              <Input id="fulfill-admin" placeholder="https://myshop.com/admin" value={adminUrl} onChange={(e) => setAdminUrl(e.target.value)} inputMode="url" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-email">Admin login email</Label>
              <Input id="fulfill-email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} inputMode="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-pass">Admin password</Label>
              <Input id="fulfill-pass" type="text" autoComplete="off" placeholder="Leave blank if already shared" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Trial length</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  aria-pressed={months === m}
                  className={cn(
                    "h-10 rounded-lg border px-3 text-sm font-semibold transition-colors",
                    months === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {m} mo
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer asked for {request?.requested_months ?? "—"} mo · ends {formatDate(endDateForMonths(months), "en")}
            </p>
          </div>

          {needsHostKind ? (
            <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <Label className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                Hosting sold by Trialvo — record the host type
              </Label>
              <div className="flex gap-2">
                {(["vps", "cpanel"] as HostKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setHostKind(k)}
                    aria-pressed={hostKind === k}
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm font-semibold uppercase transition-colors",
                      hostKind === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="fulfill-notes">Internal notes</Label>
            <Textarea id="fulfill-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Server details, anything the next admin should know" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || fulfill.isPending}>
            {fulfill.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
            Go live & email customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FulfillDialog;
