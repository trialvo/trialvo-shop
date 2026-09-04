/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: false,
  images: {
    // Demo/trial containers: skip optimizer (writable cache + remote localhost issues)
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "**.graduatefashionbd.com" },
      { protocol: "https", hostname: "**.shoplinkbd.com" },
      { protocol: "https", hostname: "**.run.app" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      { protocol: "http", hostname: "46.250.224.125", pathname: "/**" },
      { protocol: "http", hostname: "217.216.108.119", pathname: "/**" },
    ],
  },
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const apiBase = (
      process.env.API_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:7010"
        : "http://fashion-api:5000")
    ).replace(/\/+$/, "");
    return [
      { source: "/uploads/:path*", destination: `${apiBase}/uploads/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
      { source: "/robots", destination: "/robots.txt", permanent: true },
    ];
  },
};

module.exports = nextConfig;
