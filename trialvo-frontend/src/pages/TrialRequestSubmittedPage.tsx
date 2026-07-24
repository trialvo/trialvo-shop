import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Home, CheckCircle2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Post-submit landing — never shows credentials.
 * User must open the status link from their email.
 */
const TrialRequestSubmittedPage: React.FC = () => {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const existing = params.get('existing') === '1';

  const t = (bn: string, en: string) => (language === 'bn' ? bn : en);

  return (
    <Layout>
      <SEOHead
        title={t('ট্রায়াল অনুরোধ পাঠানো হয়েছে', 'Trial request submitted')}
        description={t('ইমেইল চেক করুন', 'Check your email')}
        noindex
      />

      <section className="section-padding">
        <div className="container-custom max-w-lg text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold">
            {existing
              ? t('আগের ট্রায়াল অনুরোধ পাওয়া গেছে', 'You already have a trial request')
              : t('অনুরোধ পাঠানো হয়েছে', 'Request submitted')}
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed">
            {t(
              'ট্রায়াল অনুমোদন হলে আপনি ইমেইলে একটি লিংক পাবেন। সেই লিংক থেকে status পেজে গিয়ে লগইন তথ্য ও শপ/অ্যাডমিন অ্যাক্সেস পাবেন।',
              'If your trial request is approved, you will receive an email with a link. Open that link to view your status page, login details, and shop/admin access.',
            )}
          </p>

          {email ? (
            <p className="inline-flex items-center gap-2 text-sm rounded-lg border border-border bg-card px-4 py-2">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">{t('ইমেইল', 'Email')}:</span>
              <span className="font-medium break-all">{email}</span>
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            {t(
              'ইনবক্সে না পেলে Spam / Promotions ফোল্ডার চেক করুন।',
              'If you do not see the email, check Spam or Promotions.',
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {t('হোমে ফিরুন', 'Back to home')}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/products">{t('প্রোডাক্ট দেখুন', 'Browse products')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TrialRequestSubmittedPage;
