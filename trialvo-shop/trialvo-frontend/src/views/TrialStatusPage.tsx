"use client";

import React, { useState } from 'react';
import LocalizedLink from '@/components/i18n/LocalizedLink';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, CheckCircle2, Clock, XCircle, Copy, ExternalLink, KeyRound, Mail, Download, Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useTrialStatus } from '@/hooks/useTrialRequests';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { usePublicTrialConfig } from '@/hooks/useTrialSettings';
import { api } from '@/lib/api';

const TrialStatusPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useTrialStatus(token);
  const { data: trialConfig } = usePublicTrialConfig();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [downloadingInstaller, setDownloadingInstaller] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: language === 'bn' ? 'কপি হয়েছে' : 'Copied', description: label });
  };

  const t = (bn: string, en: string) => (language === 'bn' ? bn : en);

  const displayStatus = data?.instanceStatus && data.instanceStatus !== 'active'
    ? data.instanceStatus
    : data?.status;

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending: { label: t('পর্যালোচনায়', 'Pending review'), variant: 'secondary', icon: <Clock className="w-3.5 h-3.5" /> },
    active: { label: t('ট্রায়াল চালু', 'Trial active'), variant: 'default', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    rejected: { label: t('অনুমোদিত নয়', 'Not approved'), variant: 'destructive', icon: <XCircle className="w-3.5 h-3.5" /> },
    provisioning: {
      label: t('ইনস্টলের অপেক্ষায়', 'Awaiting install'),
      variant: 'outline',
      icon: <Package className="w-3.5 h-3.5" />,
    },
  };

  const cfg = data
    ? (statusConfig[displayStatus || ''] || {
        label: displayStatus || data.status,
        variant: 'outline' as const,
        icon: <Clock className="w-3.5 h-3.5" />,
      })
    : null;
  const productLabel = data?.productName?.[language] || data?.productName?.en || data?.productSlug;
  const isGranted = !!data?.credentials;
  const awaitingInstall = data?.trialType === 'self_hosted' && data?.instanceStatus === 'provisioning';
  const instanceGone = ['destroyed', 'destroying'].includes(String(data?.instanceStatus || ''));
  const canPurchase = Boolean(
    data?.instanceId
    && data.productSlug
    && data.status !== 'pending'
    && data.status !== 'rejected'
    && !instanceGone
  );
  const emailQs = data?.email ? `&email=${encodeURIComponent(data.email)}` : '';
  const nameQs = data?.customerName ? `&name=${encodeURIComponent(data.customerName)}` : '';
  const extendHref = canPurchase
    ? `/checkout?extend=1&trialInstance=${encodeURIComponent(data!.instanceId!)}&product=${encodeURIComponent(data!.productSlug!)}${emailQs}${nameQs}`
    : null;
  const buyHref = canPurchase
    ? `/checkout?product=${encodeURIComponent(data!.productSlug!)}&trialInstance=${encodeURIComponent(data!.instanceId!)}${emailQs}${nameQs}`
    : null;
  const extendDays = trialConfig?.extendDays ?? 30;
  const extendPriceBdt = trialConfig?.extendPriceBdt ?? 1500;
  const extendPriceUsd = trialConfig?.extendPriceUsd ?? 15;
  const extendPriceLabel = `৳${Number(extendPriceBdt).toLocaleString()}`;
  const extendUsdLabel = Number(extendPriceUsd) > 0
    ? `$${Number(extendPriceUsd).toLocaleString('en-US', { minimumFractionDigits: Number(extendPriceUsd) % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`
    : '';

  return (
    <Layout>
      <div className="section-padding container-custom max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          {language === 'bn' ? 'ট্রায়াল স্ট্যাটাস' : 'Trial Request Status'}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {language === 'bn'
            ? 'এই পেজে আপনার অনুরোধের অবস্থা ও লগইন তথ্য দেখতে পাবেন।'
            : 'Track your request and access login details here.'}
        </p>

        {isLoading && (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
            <p className="text-destructive font-medium">
              {language === 'bn' ? 'অনুরোধ পাওয়া যায়নি' : 'Request not found'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'bn'
                ? 'এই লিংকটি মেয়াদোত্তীর্ণ, মুছে ফেলা হয়েছে, বা ভুল। নতুন ট্রায়াল অনুরোধ পাঠান — ইমেইলে নতুন status লিংক আসবে।'
                : 'This link is expired, was cleared, or is invalid. Submit a new trial request — you will get a fresh status link by email.'}
            </p>
            <Button asChild variant="outline">
              <LocalizedLink href="/products">{language === 'bn' ? 'প্রোডাক্টে যান' : 'Browse products'}</LocalizedLink>
            </Button>
          </div>
        )}

        {data && cfg && (
          <div className="space-y-4">
            {data.sharedDemo && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                {language === 'bn'
                  ? 'শেয়ার্ড ডেমো: অন্য ট্রায়াল ইউজারের সাথে একই স্টোর। ডেটা মিশতে পারে। আলাদা স্ট্যাক চাইলে Option 2 বেছে নিন।'
                  : (data.disclaimer || 'Shared demo — other trial users share this store. Choose Option 2 for an isolated stack.')}
              </div>
            )}
            <div className="border rounded-xl p-6 space-y-4 bg-card">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant={cfg.variant} className="gap-1.5">
                  {cfg.icon}
                  {cfg.label}
                </Badge>
              </div>
              <div className="grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Product: </span>{productLabel}</div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  {data.trialType === 'hosted'
                    ? (language === 'bn' ? 'Option 1 — Trialvo হোস্টেড' : 'Option 1 — Trialvo Hosted')
                    : (language === 'bn' ? 'Option 2 — আপনার ডোমেইন' : 'Option 2 — Your Domain')}
                </div>
                {data.trialDays && (
                  <div><span className="text-muted-foreground">Trial period: </span>{data.trialDays} days</div>
                )}
                {data.approvedAt && (
                  <div><span className="text-muted-foreground">Approved: </span>{new Date(data.approvedAt).toLocaleString()}</div>
                )}
                {data.expiresAt && (
                  <div><span className="text-muted-foreground">Expires: </span>{new Date(data.expiresAt).toLocaleString()}</div>
                )}
              </div>

              {instanceGone && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                  {language === 'bn'
                    ? 'এই ট্রায়াল আর চালু নেই — এক্সটেন্ড বা কেনা এই ইনস্ট্যান্সে করা যাবে না।'
                    : 'This trial is no longer available, so extend and purchase are disabled for this instance.'}
                </div>
              )}

              {data.status === 'pending' && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-400">
                  {language === 'bn'
                    ? 'আপনার অনুরোধ পর্যালোচনায় আছে। অনুমোদিত হলে এই পেজে credentials দেখা যাবে এবং ইমেইল পাঠানো হবে।'
                    : 'Your request is under review. Once approved, credentials will appear here and we will email you.'}
                </div>
              )}

              {awaitingInstall && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-400 space-y-2">
                  <p className="font-medium">
                    {t('অনুরোধ অনুমোদিত — এখন ইনস্টল করুন', 'Approved — install on your server next')}
                  </p>
                  <p>
                    {t(
                      'Option 2 ট্রায়াল আপনার সার্ভারে installer চালানোর পর Active হবে। নিচের credentials ও installer ডাউনলোড ব্যবহার করুন।',
                      'This Option 2 trial stays “Awaiting install” until you run the installer on your server and the license agent registers. Use the credentials and installer download below.',
                    )}
                  </p>
                </div>
              )}

              {(data.shopUrl || data.adminUrl) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {data.shopUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={data.shopUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        {language === 'bn' ? 'শপ খুলুন' : 'Open Shop'}
                      </a>
                    </Button>
                  )}
                  {data.adminUrl && (
                    <Button asChild size="sm">
                      <a href={data.adminUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Open Admin'}
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {isGranted && data.credentials && (
              <div className="border rounded-xl p-6 space-y-4 bg-emerald-500/5 border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold">
                    {language === 'bn' ? 'আপনার লগইন তথ্য' : 'Your login credentials'}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {language === 'bn'
                    ? 'এই তথ্য আপনার ইমেইলেও পাঠানো হয়েছে।'
                    : 'These were also sent to your email.'}
                </p>

                <div className="space-y-3">
                  {data.credentials.adminEmail && (
                    <CredentialRow
                      label="Admin email"
                      value={data.credentials.adminEmail}
                      onCopy={() => copy(data.credentials!.adminEmail!, 'Email')}
                    />
                  )}
                  {data.credentials.adminPassword && (
                    <CredentialRow
                      label="Admin password"
                      value={data.credentials.adminPassword}
                      secret={!showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                      onCopy={() => copy(data.credentials!.adminPassword!, 'Password')}
                    />
                  )}
                  {data.credentials.installId && (
                    <CredentialRow
                      label="Install ID"
                      value={data.credentials.installId}
                      mono
                      onCopy={() => copy(data.credentials!.installId!, 'Install ID')}
                    />
                  )}
                  {data.credentials.bootstrapToken && (
                    <CredentialRow
                      label="Bootstrap token"
                      value={data.credentials.bootstrapToken}
                      mono
                      onCopy={() => copy(data.credentials!.bootstrapToken!, 'Bootstrap token')}
                    />
                  )}
                </div>

                {data.installerUrl && token && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={downloadingInstaller}
                    onClick={async () => {
                      setDownloadingInstaller(true);
                      try {
                        const res = await api.downloadBlob(
                          `/trial/installer/${token}`,
                          `trialvo-installer-${token.slice(0, 8)}.zip`,
                        );
                        toast({
                          title: t('ডাউনলোড শুরু হয়েছে', 'Download started'),
                          description: res.filename,
                        });
                      } catch (e: unknown) {
                        const message = e instanceof Error ? e.message : 'Download failed';
                        toast({ title: 'Error', description: message, variant: 'destructive' });
                      } finally {
                        setDownloadingInstaller(false);
                      }
                    }}
                  >
                    {downloadingInstaller ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1.5" />
                    )}
                    {language === 'bn' ? 'Installer ডাউনলোড' : 'Download installer package'}
                  </Button>
                )}
              </div>
            )}

            {(extendHref || buyHref) && (
              <div className="border rounded-xl p-6 space-y-4 bg-card">
                <h2 className="font-semibold text-sm">
                  {language === 'bn' ? 'পরবর্তী ধাপ' : 'Next steps'}
                </h2>
                {extendHref && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn'
                        ? `ট্রায়াল মেয়াদ বাড়াতে আলাদা এক্সটেন্ড প্যাক কিনুন — ${extendPriceLabel}${extendUsdLabel ? ` (${extendUsdLabel})` : ''} / +${extendDays} দিন। একই ইমেইল ব্যবহার করুন।`
                        : `Buy a separate extend pack to add more trial days — ${extendPriceLabel}${extendUsdLabel ? ` (${extendUsdLabel})` : ''} for +${extendDays} days. Use the same email as this trial.`}
                    </p>
                    <Button asChild className="w-full" variant="default">
                      <LocalizedLink href={extendHref}>
                        {language === 'bn'
                          ? `ট্রায়াল এক্সটেন্ড (${extendPriceLabel})`
                          : `Extend trial (${extendPriceLabel})`}
                      </LocalizedLink>
                    </Button>
                  </div>
                )}
                {buyHref && (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn'
                        ? 'পুরো প্রোডাক্ট কিনলে লাইসেন্স/কনভার্শন — এক্সটেন্ড প্যাক নয়।'
                        : 'Buy the full product for license/conversion — not the extend pack.'}
                    </p>
                    <Button asChild className="w-full" variant="outline">
                      <LocalizedLink href={buyHref}>
                        {language === 'bn' ? 'প্রোডাক্ট কিনুন' : 'Buy product'}
                      </LocalizedLink>
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <LocalizedLink href="/products">{language === 'bn' ? 'প্রোডাক্টে ফিরুন' : 'Back to products'}</LocalizedLink>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

function CredentialRow({
  label, value, secret, mono, onCopy, onToggle,
}: {
  label: string;
  value: string;
  secret?: boolean;
  mono?: boolean;
  onCopy: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background border">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
        <p className={`text-sm truncate ${mono ? 'font-mono' : ''}`}>
          {secret ? '••••••••' : value}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        {onToggle && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onToggle}>
            {secret ? 'Show' : 'Hide'}
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCopy}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default TrialStatusPage;
