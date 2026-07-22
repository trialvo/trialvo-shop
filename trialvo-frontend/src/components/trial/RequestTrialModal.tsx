import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubmitTrialRequest } from '@/hooks/useTrialRequests';
import { usePublicTrialConfig } from '@/hooks/useTrialSettings';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productSlug: string;
  productName: string;
}

const RequestTrialModal: React.FC<Props> = ({ open, onOpenChange, productSlug, productName }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const submit = useSubmitTrialRequest();
  const { data: trialSettings } = usePublicTrialConfig();
  const [trialType, setTrialType] = useState<'hosted' | 'self_hosted'>('hosted');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', domain: '', useCase: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = (bn: string, en: string) => (language === 'bn' ? bn : en);

  // Client-side validation so users get instant, field-level feedback before
  // the request ever hits the API (the backend still validates authoritatively).
  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t('নাম দিন', 'Name is required');
    const email = form.email.trim();
    if (!email) next.email = t('ইমেইল দিন', 'Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('সঠিক ইমেইল দিন', 'Enter a valid email address');
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim()) next.phone = t('ফোন নম্বর দিন', 'Phone is required');
    else if (phoneDigits.length < 7) next.phone = t('সঠিক ফোন নম্বর দিন', 'Enter a valid phone number');
    if (trialType === 'self_hosted') {
      const domain = form.domain.trim();
      if (!domain) next.domain = t('ডোমেইন দিন', 'Domain is required');
      else if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
        next.domain = t('সঠিক ডোমেইন দিন (যেমন myshop.com)', 'Enter a valid domain (e.g. myshop.com)');
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await submit.mutateAsync({
        productSlug,
        trialType,
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company || undefined,
        desiredDomain: trialType === 'self_hosted' ? form.domain : undefined,
        useCase: form.useCase || undefined,
      });
      toast({
        title: language === 'bn' ? (res.autoApproved ? 'ট্রায়াল প্রস্তুত!' : 'অনুরোধ পাঠানো হয়েছে!') : (res.autoApproved ? 'Trial is ready!' : 'Request submitted!'),
        description: language === 'bn'
          ? (res.autoApproved ? 'লগইন তথ্য status পেজে দেখুন। ইমেইলও পাঠানো হয়েছে।' : 'ইমেইলে আপডেট পাবেন। Status পেজ খোলা হয়েছে।')
          : (res.autoApproved ? 'Login details are on your status page. We emailed you too.' : 'Check email for updates. Status page opened.'),
      });
      onOpenChange(false);
      if (res.statusUrl) window.location.href = res.statusUrl;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{language === 'bn' ? 'ট্রায়াল অনুরোধ' : 'Request Trial'} — {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={trialType === 'hosted' ? 'default' : 'outline'} onClick={() => setTrialType('hosted')} className="text-xs h-auto py-2 flex-col">
              <span>{language === 'bn' ? 'Option 1' : 'Option 1'}</span>
              <span className="text-[10px] opacity-80">{language === 'bn' ? 'Trialvo হোস্টেড' : 'Trialvo Hosted'}</span>
            </Button>
            <Button type="button" variant={trialType === 'self_hosted' ? 'default' : 'outline'} onClick={() => setTrialType('self_hosted')} className="text-xs h-auto py-2 flex-col">
              <span>{language === 'bn' ? 'Option 2' : 'Option 2'}</span>
              <span className="text-[10px] opacity-80">{language === 'bn' ? 'আমার ডোমেইন' : 'My Domain'}</span>
            </Button>
          </div>
          {trialSettings && (
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
              {language === 'bn' ? 'ট্রায়াল মেয়াদ' : 'Trial period'}:{' '}
              <strong>{trialType === 'hosted' ? trialSettings.hostedDays : trialSettings.selfHostedDays} {language === 'bn' ? 'দিন' : 'days'}</strong>
              {trialType === 'hosted' && trialSettings.autoApproveHosted && (
                <> · {language === 'bn' ? 'তাৎক্ষণিক অনুমোদন' : 'instant approval'}</>
              )}
            </p>
          )}
          <Field
            id="trial-name" label={t('নাম', 'Name')} required error={errors.name}
            value={form.name} onChange={(v) => setField('name', v)} autoComplete="name"
          />
          <Field
            id="trial-email" label="Email" type="email" required error={errors.email}
            value={form.email} onChange={(v) => setField('email', v)} autoComplete="email"
          />
          <Field
            id="trial-phone" label={t('ফোন', 'Phone')} type="tel" required error={errors.phone}
            value={form.phone} onChange={(v) => setField('phone', v)} autoComplete="tel"
          />
          <Field
            id="trial-company" label={t('কোম্পানি (ঐচ্ছিক)', 'Company (optional)')}
            value={form.company} onChange={(v) => setField('company', v)} autoComplete="organization"
          />
          {trialType === 'self_hosted' && (
            <Field
              id="trial-domain" label={t('ডোমেইন', 'Domain')} required error={errors.domain}
              placeholder="myshop.com" value={form.domain} onChange={(v) => setField('domain', v)}
            />
          )}
          <div>
            <Label htmlFor="trial-usecase">{t('ব্যবহারের উদ্দেশ্য', 'Use case')}</Label>
            <Textarea id="trial-usecase" value={form.useCase} onChange={(e) => setField('useCase', e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={submit.isPending}>
            {submit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {language === 'bn' ? 'অনুরোধ পাঠান' : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Accessible labelled input with inline validation messaging. Keeping this
// local avoids repeating the label/aria wiring for every field.
const Field: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}> = ({ id, label, value, onChange, type = 'text', required, error, placeholder, autoComplete }) => (
  <div>
    <Label htmlFor={id}>
      {label}{required && ' *'}
    </Label>
    <Input
      id={id}
      type={type}
      required={required}
      placeholder={placeholder}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={error ? 'border-destructive focus-visible:ring-destructive' : undefined}
    />
    {error && (
      <p id={`${id}-error`} className="mt-1 text-xs text-destructive">{error}</p>
    )}
  </div>
);

export default RequestTrialModal;
