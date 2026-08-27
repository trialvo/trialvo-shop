import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import "@/index.css";

export const viewport: Viewport = {
  themeColor: "#1DBF73",
};

export const metadata: Metadata = {
  title: {
    default:
      "Trialvo Shop - রেডিমেড ইকমার্স ওয়েবসাইট | বাংলাদেশের সেরা ইকমার্স সলিউশন",
    template: "%s | Trialvo Shop",
  },
  description:
    "বাংলাদেশের সেরা রেডিমেড ইকমার্স সলিউশন। এডমিন প্যানেল + শপ ওয়েবসাইট একসাথে কিনুন। ফ্যাশন, গিফট, টেক - সব ক্যাটাগরির জন্য।",
  authors: [{ name: "Trialvo Shop" }],
  metadataBase: new URL("https://shop.trialvo.com"),
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Trialvo Shop - রেডিমেড ইকমার্স ওয়েবসাইট",
    description:
      "বাংলাদেশের সেরা রেডিমেড ইকমার্স সলিউশন। এডমিন প্যানেল + শপ ওয়েবসাইট একসাথে কিনুন।",
    type: "website",
    url: "https://shop.trialvo.com",
    siteName: "Trialvo Shop",
    locale: "bn_BD",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@trialvo",
    title: "Trialvo Shop - রেডিমেড ইকমার্স ওয়েবসাইট",
    description: "বাংলাদেশের সেরা রেডিমেড ইকমার্স সলিউশন",
    images: [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop",
    ],
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
