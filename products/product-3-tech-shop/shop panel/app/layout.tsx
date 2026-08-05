import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import JsonLd from "@/components/layout/JsonLd";

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

const siteUrl = "https://shoplinkbd.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "ShopLinkBD — Premium Tech Accessories & Gadgets in Bangladesh",
    template: "%s | ShopLinkBD",
  },
  description:
    "Bangladesh's trusted destination for premium gadgets, tech accessories, and smart devices. 100% authentic products with warranty. Fast delivery & COD available.",
  keywords: [
    "tech accessories",
    "gadgets Bangladesh",
    "earbuds",
    "smartwatch",
    "power bank",
    "gaming accessories",
    "online shop Bangladesh",
    "ShopLinkBD",
    "authentic gadgets",
    "COD Bangladesh",
  ],
  authors: [{ name: "ShopLinkBD" }],
  creator: "ShopLinkBD",
  publisher: "ShopLinkBD",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: siteUrl,
    siteName: "ShopLinkBD",
    title: "ShopLinkBD — Premium Tech Accessories & Gadgets in Bangladesh",
    description:
      "Bangladesh's trusted destination for premium gadgets, tech accessories, and smart devices. 100% authentic products with warranty.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShopLinkBD — Premium Tech Accessories & Gadgets",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ShopLinkBD — Premium Tech Accessories & Gadgets in Bangladesh",
    description:
      "Bangladesh's trusted destination for premium gadgets, tech accessories, and smart devices.",
    images: ["/og-image.png"],
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
    canonical: siteUrl,
  },

  category: "E-Commerce",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a56db" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <ShopRuntimeConfigScript />
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
