import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, LOCALE_HREFLANG, LOCALES } from "@/lib/i18n";
import "@/index.css";

/**
 * Self-hosted through next/font: the files are served from our own origin, so
 * there is no blocking request to Google and no flash of unstyled text. All
 * three are variable fonts, hence no weight list.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Latin headings only — geometric shapes that Inter deliberately avoids. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Bengali body and headings. Handles conjuncts (juktakkhor) correctly. */
const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  variable: "--font-anek-bangla",
  display: "swap",
});

const FONT_VARS = `${inter.variable} ${jakarta.variable} ${anekBangla.variable}`;

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
    locale: "en_US",
    alternateLocale: ["bn_BD"],
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
    <html
      lang={DEFAULT_LOCALE}
      className={FONT_VARS}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
