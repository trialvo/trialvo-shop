import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, Clock, XCircle, Copy, ExternalLink, KeyRound, Mail, Download } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useTrialStatus } from '@/hooks/useTrialRequests';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pending review', variant: 'secondary', icon: <Clock className="w-3.5 h-3.5" /> },
  active: { label: 'Trial active', variant: 'default', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: 'Not approved', variant: 'destructive', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const TrialStatusPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useTrialStatus(token);
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: language === 'bn' ? 'কপি হয়েছে' : 'Copied', description: label });
  };

  const displayStatus = data?.instanceStatus && data.instanceStatus !== 'active'
    ? data.instanceStatus
    : data?.status;
  const cfg = data
    ? (statusConfig[displayStatus || ''] || {
        label: displayStatus || data.status,
        variant: 'outline' as const,
        icon: <Clock className="w-3.5 h-3.5" />,
      })
    : null;
  const productLabel = data?.productName?.[language] || data?.productName?.en || data?.productSlug;
  const isGranted = !!data?.credentials;
  const canPurchase = Boolean(
    data?.instanceId && data.productSlug && data.status !== 'pending' && data.status !== 'rejected'
  );
  const checkoutHref = canPurchase
    ? `/checkout?product=${encodeURIComponent(data!.productSlug!)}&trialInstance=${encodeURIComponent(data!.instanceId!)}`
    : null;

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
        {error && <p className="text-destructive">Request not found.</p>}

        {data && cfg && (
          <div className="space-y-4">
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

              {data.status === 'pending' && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-400">
                  {language === 'bn'
                    ? 'আপনার অনুরোধ পর্যালোচনায় আছে। অনুমোদিত হলে এই পেজে credentials দেখা যাবে এবং ইমেইল পাঠানো হবে।'
                    : 'Your request is under review. Once approved, credentials will appear here and we will email you.'}
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

                {data.installerUrl && (
                  <Button asChild variant="secondary" className="w-full">
                    <a href={data.installerUrl}>
                      <Download className="w-4 h-4 mr-1.5" />
                      {language === 'bn' ? 'Installer ডাউনলোড' : 'Download installer package'}
                    </a>
                  </Button>
                )}
              </div>
            )}

            {checkoutHref && (
              <div className="border rounded-xl p-6 space-y-3 bg-card">
                <h2 className="font-semibold text-sm">
                  {language === 'bn' ? 'ট্রায়াল কিনে নিন / এক্সটেন্ড করুন' : 'Purchase or extend this trial'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn'
                    ? 'পেমেন্ট সফল হলে ট্রায়াল অটো-unfreeze হবে এবং মেয়াদ বাড়বে। একই ইমেইল ব্যবহার করুন।'
                    : 'Successful payment will auto-unfreeze and extend this trial. Use the same email.'}
                </p>
                <Button asChild className="w-full">
                  <Link to={checkoutHref}>
                    {language === 'bn' ? 'কিনুন / কনভার্ট' : 'Purchase / Convert'}
                  </Link>
                </Button>
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link to="/products">{language === 'bn' ? 'প্রোডাক্টে ফিরুন' : 'Back to products'}</Link>
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
