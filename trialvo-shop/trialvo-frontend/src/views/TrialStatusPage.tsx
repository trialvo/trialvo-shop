"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Layout from "@/components/layout/Layout";
import { Eyebrow, IconTile, Section, Surface } from "@/components/section";
import { CredentialsCard } from "@/components/trial/shared/CredentialsCard";
import { TrialTimeline } from "@/components/trial/shared/TrialTimeline";
import { useTrialLaunch } from "@/components/trial/TrialLaunchProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTrialStatus, type TrialStatusResponse } from "@/hooks/useTrialRequests";
import { api } from "@/lib/api";
import { trialCopy } from "@/lib/trial/copy";
import {
  daysLeftLabel,
  formatDate,
  localizeNumber,
  monthsLabel,
  upToMonthsLabel,
} from "@/lib/trial/months";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

const COPY = {
  bn: {
    eyebrow: "ট্রায়াল হাব",
    titleDemo: "আপনার ইনস্ট্যান্ট ডেমো",
    titleDomain: "আপনার ডোমেইন ট্রায়াল",
    notFound: "অনুরোধ পাওয়া যায়নি",
    notFoundBody: "এই লিংকটি মেয়াদোত্তীর্ণ, মুছে ফেলা হয়েছে, বা ভুল। নতুন ডেমো নিলে ইমেইলে নতুন লিংক আসবে।",
    browse: "প্রোডাক্ট দেখুন",
    product: "প্রোডাক্ট",
    requested: "অনুরোধ",
    expires: "শেষ হবে",
    duration: "মেয়াদ",
    domain: "ডোমেইন",
    hosting: "হোস্টিং",
    days: (n: string) => `${n} দিন`,
    statusPending: "তৈরি হচ্ছে",
    statusActive: "চালু",
    statusRejected: "অনুমোদিত নয়",
    statusExpired: "মেয়াদ শেষ",
    statusGone: "বন্ধ",
    provisioningLead: "আপনার ডেমো তৈরি হচ্ছে — এই পেজ নিজে থেকেই আপডেট হবে।",
    goneLead: "এই ট্রায়াল আর চালু নেই। কিনলে বা নতুন ডেমো নিলে আবার অ্যাক্সেস পাবেন।",
    expiredLead: "ট্রায়ালের মেয়াদ শেষ। কিনে নিলে সব ডেটা ও সেটআপ একই থাকে।",
    rejectedLead: "এই অনুরোধ অনুমোদিত হয়নি। বিস্তারিত ইমেইলে পাঠানো হয়েছে।",
    nextStepsTitle: "পরের ধাপ",
    domainOfferTitle: (max: string) => `${max} ফ্রি — আপনার নিজের ডোমেইনে`,
    domainOfferBody: "ডেমো পছন্দ হয়েছে? আপনার VPS বা cPanel হোস্টিংয়ে আমরা নিজেরা বসিয়ে দেব। হোস্টিং না থাকলে আমাদের থেকে নিতে পারবেন। কার্ড লাগবে না।",
    domainOfferUnique: "এই সুবিধা অন্য কেউ দেয় না",
    linkedTitle: "ডোমেইন ট্রায়াল রিকোয়েস্ট পাঠানো আছে",
    linkedBody: "এই ডেমো থেকে আপনি ইতিমধ্যে নিজের ডোমেইনে ট্রায়াল চেয়েছেন।",
    viewLinked: "রিকোয়েস্ট দেখুন",
    sourceTitle: "এই রিকোয়েস্ট আপনার ডেমো থেকে",
    sourceBody: "ডোমেইনে লাইভ হওয়ার আগ পর্যন্ত ডেমো চালিয়ে যেতে পারেন।",
    viewSource: "ডেমো খুলুন",
    liveTitle: "আপনার ডোমেইনে লাইভ",
    liveBody: "নিচের লিংক ও লগইন ব্যবহার করুন। ট্রায়াল শেষে কিনলে সব একই থাকে।",
    buyTitle: "রাখতে চান?",
    buyBody: "এককালীন পেমেন্ট — এই ইনস্ট্যান্সটাই পারমানেন্ট হয়ে যায়। ডেটা, সেটআপ, ডোমেইন — কিছু বদলায় না।",
    buy: "প্রোডাক্ট কিনুন",
    extendBody: (price: string, days: string) => `আরও সময় লাগলে ${price}-এ ${days} দিন বাড়াতে পারবেন।`,
    extend: (price: string) => `এক্সটেন্ড (${price})`,
    installer: "ইনস্টলার ডাউনলোড",
    installerLead: "আপনার সার্ভারে ইনস্টলার চালানোর পর ট্রায়াল Active হবে।",
    downloadStarted: "ডাউনলোড শুরু হয়েছে",
    shared: "শেয়ার্ড ডেমো — অন্যরাও একই স্টোর দেখছে; ডেটা নিয়মিত রিসেট হয়। আসল গ্রাহকের তথ্য দেবেন না।",
    slaNote: (h: string) => `সাধারণত ${h} ঘণ্টার মধ্যে লাইভ করি।`,
    needHelp: "সমস্যা হলে",
    contact: "যোগাযোগ করুন",
  },
  en: {
    eyebrow: "Trial hub",
    titleDemo: "Your instant demo",
    titleDomain: "Your own-domain trial",
    notFound: "Request not found",
    notFoundBody: "This link is expired, was cleared, or is invalid. Start a new demo and a fresh link arrives by email.",
    browse: "Browse products",
    product: "Product",
    requested: "Requested",
    expires: "Expires",
    duration: "Duration",
    domain: "Domain",
    hosting: "Hosting",
    days: (n: string) => `${n} days`,
    statusPending: "Setting up",
    statusActive: "Active",
    statusRejected: "Not approved",
    statusExpired: "Expired",
    statusGone: "Closed",
    provisioningLead: "Your demo is being prepared — this page updates on its own.",
    goneLead: "This trial is no longer running. Buy the product or start a new demo to get access again.",
    expiredLead: "The trial period is over. Buying keeps all data and setup exactly as it is.",
    rejectedLead: "This request was not approved. Details were sent by email.",
    nextStepsTitle: "Next steps",
    domainOfferTitle: (max: string) => `${max} free — on your own domain`,
    domainOfferBody: "Liked the demo? We deploy it ourselves on your VPS or cPanel hosting. No hosting yet? Get it from us. No card needed.",
    domainOfferUnique: "Nobody else offers this",
    linkedTitle: "Domain trial request on file",
    linkedBody: "You already requested an own-domain trial from this demo.",
    viewLinked: "View request",
    sourceTitle: "This request came from your demo",
    sourceBody: "Keep using the demo until your domain goes live.",
    viewSource: "Open demo",
    liveTitle: "Live on your domain",
    liveBody: "Use the links and login below. Buy at the end of the trial and everything stays as is.",
    buyTitle: "Want to keep it?",
    buyBody: "One payment — this very instance becomes permanent. Data, setup, domain — nothing changes.",
    buy: "Buy product",
    extendBody: (price: string, days: string) => `Need more time? Add ${days} days for ${price}.`,
    extend: (price: string) => `Extend (${price})`,
    installer: "Download installer",
    installerLead: "The trial becomes active once you run the installer on your server.",
    downloadStarted: "Download started",
    shared: "Shared demo — others see the same store and data resets regularly. Do not enter real customer data.",
    slaNote: (h: string) => `We usually go live within ${h} hours.`,
    needHelp: "Need help?",
    contact: "Contact us",
  },
} as const;

type Tone = "neutral" | "good" | "warn" | "bad";

/** Collapse instance + request status into one badge the customer understands. */
function summarise(data: TrialStatusResponse, language: MarketplaceLanguage) {
  const copy = COPY[language];
  const tc = trialCopy(language);
  const inst = String(data.instanceStatus || "");
  const gone = ["destroyed", "destroying"].includes(inst);

  if (data.path === "domain") {
    const stage = data.fulfillmentStage || "received";
    const s = tc.stages[stage] || tc.stages.received;
    const tone: Tone = stage === "live" || stage === "converted"
      ? "good"
      : stage === "rejected" || stage === "expired"
        ? "bad"
        : stage === "expiring"
          ? "warn"
          : "neutral";
    return { label: s.label, lead: s.body, tone, gone: false };
  }

  if (data.status === "rejected") return { label: copy.statusRejected, lead: copy.rejectedLead, tone: "bad" as Tone, gone: false };
  if (gone) return { label: copy.statusGone, lead: copy.goneLead, tone: "bad" as Tone, gone: true };
  if (inst === "expired" || (data.daysLeft !== null && data.daysLeft !== undefined && data.daysLeft <= 0 && data.expiresAt)) {
    return { label: copy.statusExpired, lead: copy.expiredLead, tone: "warn" as Tone, gone: false };
  }
  if (data.credentials) return { label: copy.statusActive, lead: tc.demo.readyLead, tone: "good" as Tone, gone: false };
  return { label: copy.statusPending, lead: copy.provisioningLead, tone: "neutral" as Tone, gone: false };
}

const TONE_BADGE: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  good: "bg-accent/15 text-accent-strong",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  bad: "bg-destructive/10 text-destructive",
};

const TONE_ICON: Record<Tone, typeof Clock> = {
  neutral: Clock,
  good: CheckCircle2,
  warn: AlertTriangle,
  bad: XCircle,
};

/**
 * Trial Hub — one token-gated page for both paths. A demo shows credentials
 * plus the own-domain upsell; a domain request shows the fulfilment timeline
 * and, once live, the credentials for the customer's own server.
 */
const TrialStatusPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const { data, isLoading, error } = useTrialStatus(token);
  const { toast } = useToast();
  const trial = useTrialLaunch();
  const copy = COPY[language];
  const tc = trialCopy(language);
  const [downloading, setDownloading] = useState(false);

  const downloadInstaller = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const res = await api.downloadBlob(`/trial/installer/${token}`, `trialvo-installer-${token.slice(0, 8)}.zip`);
      toast({ title: copy.downloadStarted, description: res.filename });
    } catch (e: unknown) {
      toast({ title: tc.common.errorTitle, description: e instanceof Error ? e.message : tc.common.errorGeneric, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <Section size="sm" tone="muted" pattern="mesh" divider="bottom" labelledBy="trial-hub-title">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="flex justify-center py-20" role="status" aria-live="polite">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {error ? (
            <Surface className="p-6 sm:p-8">
              <IconTile icon={XCircle} tone="neutral" className="mb-4" />
              <h1 id="trial-hub-title" className="font-display text-xl font-bold tracking-tight">{copy.notFound}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.notFoundBody}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {trial.demoAvailable ? (
                  <Button type="button" onClick={() => trial.openDemo()} className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                    {tc.demo.cta}
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="h-11">
                  <LocalizedLink href="/products">{copy.browse}</LocalizedLink>
                </Button>
              </div>
            </Surface>
          ) : null}

          {data ? <HubBody data={data} token={token} language={language} downloading={downloading} onDownload={downloadInstaller} /> : null}
        </div>
      </Section>
    </Layout>
  );
};

function HubBody({
  data,
  token,
  language,
  downloading,
  onDownload,
}: Readonly<{
  data: TrialStatusResponse;
  token: string;
  language: MarketplaceLanguage;
  downloading: boolean;
  onDownload: () => void;
}>) {
  const copy = COPY[language];
  const tc = trialCopy(language);
  const trial = useTrialLaunch();
  const summary = summarise(data, language);
  const Icon = TONE_ICON[summary.tone];
  const isDomain = data.path === "domain";
  const productLabel = data.productName?.[language] || data.productName?.en || data.productSlug || "";
  const inst = String(data.instanceStatus || "");
  const gone = summary.gone;

  const canPurchase = Boolean(
    data.instanceId && data.productSlug && data.status !== "pending" && data.status !== "rejected" && !gone,
  );
  const qs = [
    data.email ? `&email=${encodeURIComponent(data.email)}` : "",
    data.customerName ? `&name=${encodeURIComponent(data.customerName)}` : "",
  ].join("");
  const buyHref = canPurchase
    ? `/checkout?product=${encodeURIComponent(data.productSlug!)}&trialInstance=${encodeURIComponent(data.instanceId!)}${qs}`
    : null;
  // Extend packs are a demo-path feature; domain trials are extended by staff.
  const extendHref = canPurchase && !isDomain
    ? `/checkout?extend=1&trialInstance=${encodeURIComponent(data.instanceId!)}&product=${encodeURIComponent(data.productSlug!)}${qs}`
    : null;
  const extendDays = localizeNumber(trial.config.extendDays ?? 30, language);
  const extendPrice = `৳${Number(trial.config.extendPriceBdt ?? 1500).toLocaleString()}`;

  const awaitingInstall = isDomain && data.provisionMode === "agent" && inst === "provisioning";
  const showCredentials = Boolean(data.credentials) && !gone && (!isDomain || ["live", "expiring", "converted"].includes(data.fulfillmentStage || "") || awaitingInstall);

  const offer = data.domainTrialOffer;
  const showDomainOffer = !isDomain && offer && trial.domainAvailable && !data.linkedDomainRequest && data.status !== "rejected";

  const openDomainFromDemo = () =>
    trial.openDomain({
      productSlug: data.productSlug,
      sourceRequestId: token,
      prefill: { name: data.customerName || undefined, email: data.email || undefined },
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Eyebrow className="mb-3">{copy.eyebrow}</Eyebrow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 id="trial-hub-title" className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {isDomain ? copy.titleDomain : copy.titleDemo}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{productLabel}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", TONE_BADGE[summary.tone])}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {summary.label}
          </span>
        </div>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{summary.lead}</p>
      </div>

      {/* Facts strip */}
      <Surface className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-4">
        <Fact label={copy.requested} value={data.requestedAt ? formatDate(data.requestedAt, language) : "—"} />
        {isDomain ? (
          <>
            <Fact label={copy.duration} value={data.requestedMonths ? monthsLabel(data.requestedMonths, language) : "—"} />
            <Fact label={copy.hosting} value={[data.hostingSource ? tc.hostingSource[data.hostingSource] : null, data.hostKind ? tc.hostKind[data.hostKind] : null].filter(Boolean).join(" · ") || "—"} />
            <Fact label={copy.domain} value={data.desiredDomain || "—"} mono />
          </>
        ) : (
          <>
            <Fact label={copy.duration} value={data.trialDays ? copy.days(localizeNumber(data.trialDays, language)) : "—"} />
            <Fact label={copy.expires} value={data.expiresAt ? formatDate(data.expiresAt, language) : "—"} />
            <Fact
              label={language === "bn" ? "বাকি" : "Left"}
              value={data.daysLeft !== null && data.daysLeft !== undefined ? daysLeftLabel(data.daysLeft, language) : "—"}
            />
          </>
        )}
      </Surface>

      {/* Domain pipeline */}
      {isDomain ? (
        <Surface className="p-5 sm:p-6">
          <TrialTimeline
            stage={data.fulfillmentStage}
            history={data.stageHistory}
            hostingSource={data.hostingSource}
            language={language}
            slaHours={data.slaHours}
          />
          {["received", "hosting_pending", "deploying"].includes(data.fulfillmentStage || "") && data.slaHours ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.slaNote(localizeNumber(data.slaHours, language))}
            </p>
          ) : null}
        </Surface>
      ) : null}

      {/* Demo still provisioning */}
      {!isDomain && !data.credentials && data.status !== "rejected" && !gone ? (
        <Surface className="flex items-center gap-4 p-5">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{copy.provisioningLead}</p>
        </Surface>
      ) : null}

      {/* Credentials */}
      {showCredentials ? (
        <div>
          {isDomain ? (
            <div className="mb-3">
              <h2 className="font-display text-lg font-bold tracking-tight">{copy.liveTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.liveBody}</p>
            </div>
          ) : null}
          <CredentialsCard
            shopUrl={data.shopUrl}
            adminUrl={data.adminUrl}
            credentials={data.credentials}
            language={language}
          />
          {data.sharedDemo ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-amber-900 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {copy.shared}
            </p>
          ) : null}
          {awaitingInstall && data.installerUrl ? (
            <Surface className="mt-3 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Package className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {copy.installerLead}
              </p>
              <Button type="button" variant="secondary" disabled={downloading} onClick={onDownload} className="h-10 shrink-0">
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {copy.installer}
              </Button>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {/* Own-domain upsell (demo path) */}
      {/* Own-domain upsell — inverted card using primary / primary-foreground tokens only, so it flips correctly with the theme. */}
      {showDomainOffer ? (
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft-xl ring-1 ring-inset ring-primary-foreground/10 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_90%_10%,hsl(var(--accent)/0.32),transparent_65%)]" />
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow tone="inverted">{copy.nextStepsTitle}</Eyebrow>
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground shadow-accent-glow">{copy.domainOfferUnique}</span>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <IconTile icon={Globe} tone="inverted" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold leading-tight tracking-tight text-primary-foreground">
                {copy.domainOfferTitle(upToMonthsLabel(offer!.maxMonths, language))}
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-primary-foreground/75">{copy.domainOfferBody}</p>
            </div>
          </div>
          <Button type="button" size="lg" onClick={openDomainFromDemo} className="mt-6 h-12 w-full rounded-lg bg-accent px-6 font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90 sm:w-auto">
            {tc.domain.cta}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {/* Cross links */}
      {data.linkedDomainRequest ? (
        <CrossLink
          icon={Globe}
          title={copy.linkedTitle}
          body={`${copy.linkedBody} ${tc.stages[data.linkedDomainRequest.fulfillmentStage || "received"]?.label || ""}`}
          href={`/trial-status/${data.linkedDomainRequest.statusToken}`}
          cta={copy.viewLinked}
        />
      ) : null}
      {data.sourceDemo ? (
        <CrossLink
          icon={Zap}
          title={copy.sourceTitle}
          body={copy.sourceBody}
          href={`/trial-status/${data.sourceDemo.statusToken}`}
          cta={copy.viewSource}
        />
      ) : null}

      {/* Purchase / extend */}
      {buyHref ? (
        <Surface sheen className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <IconTile icon={Sparkles} size="sm" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold tracking-tight">{copy.buyTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.buyBody}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-lg bg-accent px-5 font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90">
                  <LocalizedLink href={buyHref}>
                    <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                    {copy.buy}
                  </LocalizedLink>
                </Button>
                {extendHref ? (
                  <Button asChild variant="outline" className="h-11 rounded-lg bg-background">
                    <LocalizedLink href={extendHref}>{copy.extend(extendPrice)}</LocalizedLink>
                  </Button>
                ) : null}
              </div>
              {extendHref ? (
                <p className="mt-2 text-xs text-muted-foreground">{copy.extendBody(extendPrice, extendDays)}</p>
              ) : null}
            </div>
          </div>
        </Surface>
      ) : null}

      <p className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <span>{copy.needHelp}</span>
        <LocalizedLink href="/contact" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-accent-strong">
          {copy.contact}
        </LocalizedLink>
      </p>
    </div>
  );
}

function Fact({ label, value, mono }: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function CrossLink({
  icon,
  title,
  body,
  href,
  cta,
}: Readonly<{ icon: typeof Zap; title: string; body: string; href: string; cta: string }>) {
  return (
    <Surface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <IconTile icon={icon} size="sm" tone="neutral" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{body}</p>
      </div>
      <Button asChild size="sm" variant="outline" className="h-9 shrink-0 bg-background">
        <LocalizedLink href={href}>
          {cta}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
        </LocalizedLink>
      </Button>
    </Surface>
  );
}

export default TrialStatusPage;
