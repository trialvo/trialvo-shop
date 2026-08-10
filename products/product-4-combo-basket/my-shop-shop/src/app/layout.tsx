import type { Metadata } from "next";
import { Hind_Siliguri, Poppins } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from "@/utils/structuredData";
import Providers from "@/lib/Providers";
import ScrollToTop from "@/components/ScrollToTop";
import config from "@/config";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-hind-siliguri",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const BASE_URL = config.baseUrl;
const SITE_NAME = "ComboBasket";
const SITE_TITLE = "ComboBasket — বাংলাদেশের সেরা কম্বো ও গিফট শপ";
const SITE_DESCRIPTION =
  "ComboBasket — বাংলাদেশের সেরা অনলাইন কম্বো ও গিফট শপ। স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার, পারফিউম ও প্রিমিয়াম গিফট সেট সবচেয়ে কম দামে। ফ্রি ডেলিভারি, ১০০% অরিজিনাল পণ্য।";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "combobasket",
    "combo basket",
    "কম্বো অফার",
    "গিফট সেট",
    "বাংলাদেশ অনলাইন শপ",
    "skincare combo",
    "makeup kit",
    "hair care combo",
    "perfume gift set",
    "bridal gift",
    "beauty products bangladesh",
    "online shop bangladesh",
    "free delivery bangladesh",
    "বিউটি প্রোডাক্ট",
    "অনলাইন শপিং",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "bn_BD",
    alternateLocale: "en_US",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/og-image.jpg"],
    creator: "@combobasket",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${poppins.variable}`}>
      <head>
        <meta name="theme-color" content="#e91e63" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <JsonLd data={generateOrganizationJsonLd(BASE_URL)} />
        <JsonLd data={generateWebSiteJsonLd(BASE_URL)} />
      </head>
      <body className="min-h-screen bg-[#f8f9fc] font-sans text-[#0f172a] antialiased">
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
