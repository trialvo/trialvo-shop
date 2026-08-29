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

/**
 * Runs before React hydrates. Applies the stored theme, then strips attributes
 * that password/VPN/shopping extensions inject onto every node (bis_skin_checked,
 * bis_register, __processed_*). Those extras are what Next reports as a
 * hydration mismatch even when our markup is identical.
 */
const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("trialvo-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light");}catch(e){}var KNOWN=["bis_skin_checked","bis_register"];function junk(name){if(!name)return false;if(KNOWN.indexOf(name)!==-1)return true;return name.indexOf("__processed_")===0;}function strip(el){if(!el||!el.attributes)return;for(var i=el.attributes.length-1;i>=0;i--){var a=el.attributes[i];if(a&&junk(a.name))el.removeAttribute(a.name);}}function walk(root){strip(root);if(!root.querySelectorAll)return;var all=root.querySelectorAll("*");for(var i=0;i<all.length;i++)strip(all[i]);}try{walk(document.documentElement);}catch(e){}try{var obs=new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==="attributes"&&junk(m.attributeName))strip(m.target);var nodes=m.addedNodes;for(var j=0;j<nodes.length;j++){if(nodes[j].nodeType===1)walk(nodes[j]);}}});obs.observe(document.documentElement,{attributes:true,childList:true,subtree:true});setTimeout(function(){obs.disconnect();},8000);}catch(e){}})();`;

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
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOT_SCRIPT,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
