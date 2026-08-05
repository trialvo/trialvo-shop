import React from "react";
import { Link } from "react-router-dom";
import { Headset, Mail, Phone, Clock, ShieldCheck, LifeBuoy, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppBranding } from "@/context/AppBrandingContext";

const SUPPORT_EMAIL = "support@trialvo.com";
const SUPPORT_PHONE = "+8801799345499";

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const { branding } = useAppBranding();
  const companyName = branding.appName;
  const companyTagline = branding.authTagline;
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      {/* Top header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t("support.title")}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("support.subtitle")}
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("support.backToDashboard")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-dark sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
                <ShieldCheck className="h-4 w-4" />
                {t("support.officialSupport")} — {companyName}
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {t("support.heroTitle")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                {t("support.heroDescription", { companyName, companyTagline })}
              </p>
            </div>

            <div className="grid w-full gap-3 md:w-auto">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20"
              >
                <Mail className="h-4 w-4" />
                {t("support.emailSupport")}
              </a>

              <a
                href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:hover:bg-white/5"
              >
                <Phone className="h-4 w-4" />
                {t("support.callSupport")}
              </a>
            </div>
          </div>
        </div>

        {/* Contact cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-white/[0.03]">
                <Mail className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.emailLabel")}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <a className="font-medium text-brand-600 dark:text-brand-400" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {t("support.emailHint")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-white/[0.03]">
                <Phone className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.phoneLabel")}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <a
                    className="font-medium text-brand-600 dark:text-brand-400"
                    href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`}
                  >
                    {SUPPORT_PHONE}
                  </a>
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {t("support.phoneHint")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-white/[0.03]">
                <Clock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.supportHours")}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("support.supportSchedule")}</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {t("support.responseTime")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-dark sm:p-8">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("support.quickHelp")}</h3>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.faq.cantLogin")}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("support.faq.cantLoginAnswer")}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.faq.dashboardSlow")}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("support.faq.dashboardSlowAnswer")}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.faq.newFeature")}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("support.faq.newFeatureAnswer")}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("support.faq.securityIssue")}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("support.faq.securityIssueAnswer")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-dark">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Headset className="h-4 w-4" />
              {t("support.poweredBy", { companyName })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t("support.allRightsReserved", { year: new Date().getFullYear(), companyName })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
