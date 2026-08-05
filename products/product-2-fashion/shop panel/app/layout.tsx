import OnlineStatusGate from "@/components/common/OnlineStatusGate";
import ScrollbarVisibility from "@/components/common/ScrollbarVisibility";
import ScrollToTop from "@/components/common/ScrollToTop";
import AuthToastListener from "@/components/toast/AuthToastListener";
import ToasterProvider from "@/components/toast/ToastProvider";
import DefaultLayout from "@/layouts/DefaultLayout";
import AnalyticsProvider from "@/lib/analytics/AnalyticsProvider";
import { buildMetadata, getSiteUrl } from "@/lib/seo";
import { GTM_ID, API_URL } from "@/config/env";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import ReduxProvider from "@/providers/ReduxProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import LanguageSelectModalLoader from "@/components/language/LanguageSelectModalLoader";
import { CompareProvider } from "@/hooks/useCompareStore";
import CompareFloatingBar from "@/components/compare/CompareFloatingBar";
import PushNotificationManagerLoader from "@/components/notifications/PushNotificationManagerLoader";
import type { Metadata, Viewport } from "next";
import nextDynamic from "next/dynamic";
import { Inter, Hind_Siliguri } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Trial / multi-tenant: per-request IMAGE_URL / API_URL from container env
export const dynamic = "force-dynamic";

function ShopRuntimeConfigScript() {
  const config = {
    IMAGE_URL: process.env.IMAGE_URL || "",
    API_URL: process.env.API_URL || "",
    SITE_URL: process.env.SITE_URL || "",
    SHOP_URL: process.env.SHOP_URL || "",
    APP_URL: process.env.APP_URL || "",
  };
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__SHOP_CONFIG__=${JSON.stringify(config)};`,
      }}
    />
  );
}

/* ── Lazy-load event-triggered overlays (separate JS chunks) ── */
const DrawerManager = nextDynamic(
  () => import("@/components/drawers/DrawerManager"),
);
const ModalManager = nextDynamic(
  () => import("@/components/modals/ModalManager"),
);


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Graduate | A Clothing Brand",
    template: "%s",
  },
  applicationName: "Graduate",
  category: "fashion",
  keywords: [
    "Graduate",
    "Graduate Fashion",
    "clothing brand",
    "fashion",
    "apparel",
    "streetwear",
    "menswear",
    "womenswear",
    "Bangladesh",
    "online store",
  ],
  authors: [{ name: "Graduate" }],
  creator: "Graduate",
  publisher: "Graduate",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...buildMetadata({ canonical: "/" }),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${hindSiliguri.variable} font-sans antialiased`}>
        <ShopRuntimeConfigScript />
        {/* ── GTM noscript fallback (for JS-disabled browsers) ── */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* ── Preconnect: API & GCS ───────────────────────── */}

        {API_URL && (
          <>
            <link rel="preconnect" href={API_URL} />
            <link rel="dns-prefetch" href={API_URL} />
          </>
        )}
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />

        {/* ── Preconnect: Analytics SDKs ─────────────────── */}
        {/* Google Tag Manager */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Facebook Pixel (loaded via GTM tag — preconnect for speed) */}
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        {/* Microsoft Clarity */}
        <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="preconnect" href="https://z.clarity.ms" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://z.clarity.ms" />

        {/* ── Data Layer: MUST run before GTM loads ──────── */}
        {/* strategy="beforeInteractive" = runs synchronously during SSR/hydration */}
        {/* This guarantees window.dataLayer exists before gtm.js requests it */}
        <Script
          id="datalayer-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({currency:'BDT',environment:'${process.env.NODE_ENV || 'production'}'});`,
          }}
        />

        {/* ── GTM Script: afterInteractive ───────────────── */}
        {/* Loads after React hydration — doesn't block LCP or TTI */}
        {/* The GTM container ID is read from env; AnalyticsProvider's */}
        {/* initGTM() sets up the dataLayer *before* this script fires. */}
        {GTM_ID && (
          <Script
            id="gtm-loader"
            src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
            strategy="afterInteractive"
          />
        )}
        <ScrollbarVisibility />
        <ScrollToTop />
        <ReactQueryProvider>
          <ReduxProvider>
            <LanguageProvider>
              <LanguageSelectModalLoader />
              <ToasterProvider>
                <CompareProvider>
                  <OnlineStatusGate>
                    <AuthToastListener />
                    <PushNotificationManagerLoader />

                    <AnalyticsProvider>
                      <DefaultLayout>{children}</DefaultLayout>
                    </AnalyticsProvider>
                    <DrawerManager />
                    <ModalManager />
                    <CompareFloatingBar />
                  </OnlineStatusGate>
                </CompareProvider>
              </ToasterProvider>
            </LanguageProvider>
          </ReduxProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
