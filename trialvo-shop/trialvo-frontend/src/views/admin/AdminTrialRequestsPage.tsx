"use client";

import React, { useMemo, useState } from "react";
import { Globe, Search, Zap } from "lucide-react";
import { QueryError } from "@/components/admin/QueryError";
import { DemoRequestsTable } from "@/components/admin/trial/DemoRequestsTable";
import { DomainTrialQueue } from "@/components/admin/trial/DomainTrialQueue";
import { TrialFunnelCard } from "@/components/admin/trial/TrialFunnelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminTrialRequests, useTrialRequestCounts } from "@/hooks/useTrialRequests";
import { useTrialSettings } from "@/hooks/useTrialSettings";
import type { FulfillmentStage } from "@/lib/trial/types";
import { cn } from "@/lib/utils";

type Tab = "domain" | "demo";

const DOMAIN_FILTERS: { id: string; label: string; stages?: FulfillmentStage[] }[] = [
  { id: "open", label: "Open", stages: ["received", "hosting_pending", "deploying"] },
  { id: "received", label: "Received", stages: ["received"] },
  { id: "hosting_pending", label: "Hosting", stages: ["hosting_pending"] },
  { id: "deploying", label: "Deploying", stages: ["deploying"] },
  { id: "live", label: "Live", stages: ["live", "expiring"] },
  { id: "done", label: "Ended", stages: ["expired", "converted", "rejected"] },
  { id: "all", label: "All" },
];

const DEMO_FILTERS = [
  { id: "pending", label: "Needs attention" },
  { id: "active", label: "Active" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

/**
 * Trial Requests — two queues in one page. The own-domain queue is where staff
 * actually work (manual fulfilment); the demo tab is an audit trail with
 * repair actions for the few requests that did not auto-provision.
 */
const AdminTrialRequestsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("domain");
  const [domainFilter, setDomainFilter] = useState("open");
  const [demoFilter, setDemoFilter] = useState("pending");
  const [q, setQ] = useState("");

  const { data: settings } = useTrialSettings();
  const { data: counts } = useTrialRequestCounts();
  const listArgs = tab === "domain"
    ? { type: "self_hosted" as const, q: q || undefined }
    : { type: "hosted" as const, q: q || undefined, status: demoFilter === "all" ? undefined : demoFilter };
  const { data, isLoading, isError, error, refetch } = useAdminTrialRequests(listArgs);

  const domainRows = useMemo(() => {
    if (tab !== "domain") return [];
    const f = DOMAIN_FILTERS.find((x) => x.id === domainFilter);
    const rows = data || [];
    const filtered = f?.stages ? rows.filter((r) => f.stages!.includes(r.fulfillment_stage || "received")) : rows;
    // Oldest open request first — that is the one about to breach SLA.
    return [...filtered].sort((a, b) => (b.age_hours ?? 0) - (a.age_hours ?? 0));
  }, [data, tab, domainFilter]);

  const openDomain = counts
    ? (counts.domain.byStage.received || 0) + (counts.domain.byStage.hosting_pending || 0) + (counts.domain.byStage.deploying || 0)
    : 0;

  return (
    <div className="space-y-5">
      <div className="admin-page-header">
        <h1>Trial Requests</h1>
        <p>Own-domain trials are fulfilled by hand here. Instant demos provision themselves.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Open domain requests" value={openDomain} tone={counts?.domain.overdue ? "warn" : "default"} hint={counts?.domain.overdue ? `${counts.domain.overdue} past SLA` : `SLA ${settings?.fulfillmentSlaHours ?? 24}h`} />
          <Kpi label="Domain trials live" value={counts?.domain.byStage.live || 0} hint={`${counts?.domain.byStage.converted || 0} converted`} />
          <Kpi label="Active demos" value={counts?.demo.active || 0} hint={counts?.demo.pending ? `${counts.demo.pending} need attention` : "all auto-provisioned"} tone={counts?.demo.pending ? "warn" : "default"} />
        </div>
        <TrialFunnelCard className="lg:row-span-2" />

        <div className="admin-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist">
              <TabButton active={tab === "domain"} onClick={() => setTab("domain")} icon={Globe} label="Own-domain queue" count={openDomain} />
              <TabButton active={tab === "demo"} onClick={() => setTab("demo")} icon={Zap} label="Instant demos" count={counts?.demo.pending || 0} />
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, domain" className="h-9 pl-8" aria-label="Search requests" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border p-3">
            {(tab === "domain" ? DOMAIN_FILTERS : DEMO_FILTERS).map((f) => {
              const active = tab === "domain" ? domainFilter === f.id : demoFilter === f.id;
              return (
                <Button key={f.id} size="sm" variant={active ? "default" : "outline"} onClick={() => (tab === "domain" ? setDomainFilter(f.id) : setDemoFilter(f.id))}>
                  {f.label}
                </Button>
              );
            })}
          </div>

          {isError ? <QueryError what="trial requests" error={error} onRetry={() => refetch()} className="m-3" /> : null}

          <div className="overflow-x-auto">
            {tab === "domain" ? (
              <DomainTrialQueue rows={domainRows} loading={isLoading} slaHours={settings?.fulfillmentSlaHours ?? 24} />
            ) : (
              <DemoRequestsTable rows={data || []} loading={isLoading} demoDays={settings?.hostedDays ?? 14} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Kpi({ label, value, hint, tone = "default" }: Readonly<{ label: string; value: number; hint?: string; tone?: "default" | "warn" }>) {
  return (
    <div className="admin-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: Readonly<{ active: boolean; onClick: () => void; icon: typeof Zap; label: string; count: number }>) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
      {count > 0 ? <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">{count}</span> : null}
    </button>
  );
}

export default AdminTrialRequestsPage;
