/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    const apiBase = (process.env.API_URL || "http://techshop-api:5000").replace(/\/+$/, "");
    return [
      { source: "/uploads/:path*", destination: `${apiBase}/uploads/:path*` },
    ];
  },
  images: {
    // Demo/trial: avoid optimizer cache/permission issues in containers
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
    ],
  },
};

export default nextConfig;
