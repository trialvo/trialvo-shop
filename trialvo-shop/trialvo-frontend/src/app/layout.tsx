import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, LOCALE_HREFLANG, LOCALES } from "@/lib/i18n";
import "@/index.css";

export const viewport: Viewport = {
  themeColor: "#1DBF73",
};

const OG_IMAGE = `${BRAND.siteUrl}/api/og`;

/**
 * Defaults only. Every indexable route sets its own metadata through
 * `buildPageMetadata`, so what remains here is the fallback for routes without
 * any — chiefly `/admin` and the 404.
 */
export const metadata: Metadata = {
  title: {
    default:
      "Trialvo Shop — ready-made ecommerce, lifetime license & support",
    template: "%s | Trialvo Shop",
  },
  description:
    "Buy ready-made ecommerce websites from Trialvo Shop. One-time payment, lifetime support and updates. Available in Bangla and English.",
  alternates: {
    languages: {
      ...Object.fromEntries(
        LOCALES.map((locale) => [
          LOCALE_HREFLANG[locale],
          `${BRAND.siteUrl}/${locale}`,
        ]),
      ),
      "x-default": `${BRAND.siteUrl}/${DEFAULT_LOCALE}`,
    },
  },
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: BRAND.siteUrl }],
  publisher: BRAND.company.name,
  metadataBase: new URL(BRAND.siteUrl),
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Trialvo Shop — ready-made ecommerce, lifetime license & support",
    description:
      "Buy ready-made ecommerce websites with the full source code. One-time payment, lifetime license, lifetime support and updates.",
    type: "website",
    url: BRAND.siteUrl,
    siteName: BRAND.name,
    locale: "bn_BD",
    alternateLocale: ["en_US"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: BRAND.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: BRAND.social.twitter,
    creator: BRAND.social.twitter,
    title: "Trialvo Shop — ready-made ecommerce, lifetime license & support",
    description:
      "Ready-made ecommerce websites with full source code. One-time payment, lifetime license and support.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
