import React, { useState } from 'react';
import { Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DemoItem {
  label: { bn: string; en: string };
  url: string;
  username: string;
  password: string;
}

interface DemoAccessCardProps {
  demos: DemoItem[];
}

const CredentialRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-sm">{value}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-2"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 mr-1 text-success" />
            <span className="text-xs">{t('product.copied')}</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 mr-1" />
            <span className="text-xs">{t('product.copy')}</span>
          </>
        )}
      </Button>
    </div>
  );
};

const DemoSection: React.FC<{ demo: DemoItem; language: 'bn' | 'en' }> = ({ demo, language }) => {
  const { t } = useLanguage();

  return (
    <div className="demo-card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{demo.label[language]}</h4>
        <Button variant="outline" size="sm" asChild>
          <a
            href={demo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {t('product.demo')}
          </a>
        </Button>
      </div>
      <div className="space-y-0">
        <CredentialRow label={t('product.username')} value={demo.username} />
        <CredentialRow label={t('product.password')} value={demo.password} />
      </div>
    </div>
  );
};

const DemoAccessCard: React.FC<DemoAccessCardProps> = ({ demos }) => {
  const { t, language } = useLanguage();

  if (!demos || demos.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-4">{t('product.demoAccess')}</h3>

      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {t('product.demoNote')}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {demos.map((demo, index) => (
          <DemoSection key={index} demo={demo} language={language} />
        ))}
      </div>
    </div>
  );
};

export default DemoAccessCard;
