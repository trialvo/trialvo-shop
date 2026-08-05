import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import AppProviders from "@/store/provider";
import { BottomNavWrapper } from "@/components/layout/BottomNavWrapper";
import "./globals.css";

// Per-request env (IMAGE_URL / API_URL) for multi-tenant trial containers.
// Without this, the root layout is statically baked at build time with empty config.
export const dynamic = "force-dynamic";

/** Display / heading font */
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/** Body / UI font */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LIFESTYLE - Premium Fashion & Lifestyle",
  description:
    "Premium fashion destination bringing you the finest collections from around the world. Shop men's, women's, kids' clothing, accessories, and more.",
  keywords: ["fashion", "lifestyle", "premium", "clothing", "accessories", "LIFESTYLE"],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "LIFESTYLE - Premium Fashion & Lifestyle",
    description:
      "Premium fashion destination bringing you the finest collections from around the world.",
    type: "website",
  },
};

/**
 * Inject per-container IMAGE_URL / API_URL into the browser before client JS
 * runs. Required for Option 1/2 trials: one shop image, many host ports.
 */
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ShopRuntimeConfigScript />
      </head>
      {/* pb-14 md:pb-0: bottom clearance for fixed bottom nav on mobile */}
      <body className={`${dmSans.variable} ${inter.variable} pb-14 md:pb-0`}>
        <AppProviders>
          {children}
          {/* BottomNav shown globally below 768px */}
          <BottomNavWrapper />
        </AppProviders>
      </body>
    </html>
  );
}
